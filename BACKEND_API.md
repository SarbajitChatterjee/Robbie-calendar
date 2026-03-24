# Robbie — Backend API Contract

> **Audience:** Backend engineers implementing the REST API server.
>
> The frontend calls these endpoints via `src/services/api.ts`.
> Every request includes `Authorization: Bearer <token>` when the user is authenticated.
> The backend is responsible for token validation, user identity extraction, and all database access.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Response Format](#error-response-format)
3. [Endpoints — Events](#endpoints--events)
4. [Endpoints — Calendar Connections](#endpoints--calendar-connections)
5. [Endpoints — Timezones](#endpoints--timezones)
6. [Endpoints — User Settings](#endpoints--user-settings)
7. [Endpoints — Data Management](#endpoints--data-management)
8. [SQL DDL](#sql-ddl)
9. [JSON Response Shapes](#json-response-shapes)

---

## Authentication

Every request from the frontend includes:

```
Authorization: Bearer <token>
Content-Type: application/json
```

The backend must:
1. Validate the token
2. Extract the `user_id` from it
3. Scope all database queries to that user
4. Return `401 Unauthorized` if the token is missing or invalid

The frontend stores the token in `localStorage` under the key `"auth_token"`.

---

## Error Response Format

On any error, return a JSON body with an `error` field:

```json
{
  "error": "Human-readable error message shown to the user"
}
```

Use appropriate HTTP status codes:
- `400` — Bad request (validation errors, missing fields)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (user doesn't own the resource)
- `404` — Resource not found
- `500` — Internal server error

---

## Endpoints — Events

### `GET /events?start=<ISO>&end=<ISO>`

Fetches all **confirmed** events within a date range for the authenticated user.

| Param | Type | Description |
|---|---|---|
| `start` | ISO 8601 string (query) | Range start (inclusive) |
| `end` | ISO 8601 string (query) | Range end (inclusive) |

**Filter:** Only return events where `acceptance_status = 'accepted'`.

**Response:** `200 OK` — `CalendarEvent[]` (see [JSON shapes](#calendarevent))

---

### `GET /events/pending`

Fetches events detected from email that are awaiting user review.

**Filter:** `acceptance_status = 'pending_review'` AND `detected_from_email = true`

**Response:** `200 OK` — `CalendarEvent[]`

---

### `POST /events/:id/accept`

Accepts a pending event and assigns it to a target calendar.

**Request body:**
```json
{
  "targetCalendarId": "uuid-of-target-calendar"
}
```

**Action:** Set `acceptance_status = 'accepted'` and `calendar_id = targetCalendarId`.

**Response:** `200 OK` — the updated `CalendarEvent`

---

### `POST /events/:id/dismiss`

Dismisses a pending event (user chose to ignore it).

**Action:** Set `acceptance_status = 'dismissed'`.

**Response:** `204 No Content`

---

## Endpoints — Calendar Connections

### `GET /calendars`

Fetches all connected calendar accounts for the authenticated user, including nested sub-calendars.

**Response:** `200 OK` — `CalendarConnection[]` (each with a `calendars` array of `SubCalendar`)

---

### `POST /calendars/connect/oauth`

Initiates an OAuth flow for Google or Outlook.

**Request body:**
```json
{
  "source": "google" | "outlook"
}
```

**Response:** `200 OK`
```json
{
  "redirectUrl": "https://accounts.google.com/o/oauth2/..."
}
```

The frontend will redirect the user to this URL. After completing OAuth, the backend should handle the callback, store the tokens, and redirect the user back to the app.

---

### `POST /calendars/connect/apple`

Connects an Apple iCloud calendar via app-specific password.

**Request body:**
```json
{
  "appleId": "user@icloud.com",
  "appPassword": "xxxx-xxxx-xxxx-xxxx"
}
```

**Response:** `200 OK` — the new `CalendarConnection`

---

### `POST /calendars/connect/caldav`

Connects a generic CalDAV server.

**Request body:**
```json
{
  "serverUrl": "https://caldav.example.com",
  "username": "user",
  "password": "pass"
}
```

**Response:** `200 OK` — the new `CalendarConnection`

---

### `DELETE /calendars/:id`

Disconnects a calendar source and removes all its synced events.

**Response:** `204 No Content`

---

### `POST /calendars/sync`

Triggers an immediate calendar sync.

**Request body:**
```json
{
  "connectionId": "uuid-or-null"
}
```

If `connectionId` is provided, sync only that connection. If `null` or omitted, sync all.

**Response:** `204 No Content`

---

### `PATCH /calendars/:id/color`

Updates the display color for a calendar connection.

**Request body:**
```json
{
  "color": "#4285F4"
}
```

**Response:** `204 No Content`

---

### `PATCH /calendars/:id/visibility`

Toggles whether a calendar's events appear in views.

**Request body:**
```json
{
  "enabled": true
}
```

**Response:** `204 No Content`

---

### `PATCH /calendars/:id/email-watch`

Toggles email inbox watching for a connection.

**Request body:**
```json
{
  "enabled": true
}
```

**Response:** `204 No Content`

---

## Endpoints — Timezones

### `GET /timezones`

Fetches all supported timezones, ordered by UTC offset. This is public reference data — no authentication required.

**Response:** `200 OK` — `Timezone[]`

---

## Endpoints — User Settings

### `GET /user/settings`

Fetches the authenticated user's preferences.

**Response:** `200 OK` — `UserSettings`

If no settings row exists yet (new user), the backend should return defaults:
```json
{
  "userId": "...",
  "homeTimezone": "UTC",
  "showOrganizerTimezone": true,
  "defaultCalendarId": "",
  "firstDayOfWeek": "monday",
  "emailDetectionMode": "ics_only",
  "displayName": "",
  "email": "",
  "darkMode": false
}
```

---

### `PATCH /user/settings`

Partially updates user preferences. Only the fields present in the request body should be updated (merge semantics).

**Request body:** Any subset of `UserSettings` fields (except `userId`):
```json
{
  "homeTimezone": "Asia/Singapore",
  "darkMode": true
}
```

**Response:** `200 OK` — the full merged `UserSettings` object

---

## Endpoints — Data Management

### `DELETE /user/data`

Permanently deletes **all** user data: events, calendar connections, sub-calendars, and settings. This action is irreversible.

**Response:** `204 No Content`

---

## SQL DDL

Run this in your database to create the required tables.

```sql
-- 1. Events
CREATE TABLE events (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL,          -- FK to your users table
  title                  TEXT NOT NULL,
  start_time             TIMESTAMPTZ NOT NULL,
  end_time               TIMESTAMPTZ NOT NULL,
  is_all_day             BOOLEAN DEFAULT FALSE,
  organizer_tz           TEXT,
  user_tz                TEXT,
  meeting_link           TEXT,
  meeting_platform       TEXT,                    -- zoom | teams | meet | other
  meeting_id             TEXT,
  meeting_passcode       TEXT,
  organizer              JSONB,                   -- { "name": "...", "email": "..." }
  attendees              JSONB DEFAULT '[]',      -- array of attendee objects
  description            TEXT,
  location               TEXT,
  calendar_id            TEXT,
  calendar_name          TEXT,
  account_email          TEXT,
  source                 TEXT NOT NULL,            -- google | apple | outlook | caldav
  color                  TEXT,
  is_read_only           BOOLEAN DEFAULT FALSE,
  html_link              TEXT,
  detected_from_email    BOOLEAN DEFAULT FALSE,
  email_detection_method TEXT,                     -- ics_attachment | smart_parse
  email_sender           TEXT,
  email_snippet          TEXT,
  acceptance_status      TEXT DEFAULT 'pending_review',  -- accepted | pending_review | dismissed
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- 2. Calendar connections
CREATE TABLE calendar_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  source              TEXT NOT NULL,               -- google | outlook | apple | caldav | gmail
  connection_type     TEXT NOT NULL,                -- calendar | email_watch | both
  account_email       TEXT NOT NULL,
  display_name        TEXT,
  color               TEXT,
  is_enabled          BOOLEAN DEFAULT TRUE,
  email_watch_enabled BOOLEAN DEFAULT FALSE,
  last_synced_at      TIMESTAMPTZ,
  sync_status         TEXT DEFAULT 'synced',        -- synced | syncing | error | disconnected
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. Sub-calendars (nested under connections)
CREATE TABLE sub_calendars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT,
  is_enabled    BOOLEAN DEFAULT TRUE,
  is_read_only  BOOLEAN DEFAULT FALSE
);

-- 4. User settings (one row per user)
CREATE TABLE user_settings (
  user_id               UUID PRIMARY KEY,          -- FK to your users table
  home_timezone         TEXT DEFAULT 'UTC',
  show_organizer_tz     BOOLEAN DEFAULT TRUE,
  default_calendar_id   TEXT,
  first_day_of_week     TEXT DEFAULT 'monday',     -- sunday | monday
  email_detection_mode  TEXT DEFAULT 'ics_only',   -- ics_only | smart
  display_name          TEXT,
  email                 TEXT,
  dark_mode             BOOLEAN DEFAULT FALSE
);

-- 5. Timezones (reference/lookup — seed this with IANA timezone data)
CREATE TABLE timezones (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,         -- e.g. "Singapore (SGT, UTC+8)"
  iana_key   TEXT UNIQUE NOT NULL,  -- e.g. "Asia/Singapore"
  location   TEXT,                  -- e.g. "Singapore"
  utc_offset TEXT NOT NULL              -- e.g. '08:00:00' or '-05:00:00'
);

-- 6. user
create table public.users (
  user_id bigint generated by default as identity not null,
  firstname character varying not null,
  lastname character varying not null,
  email character varying null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint users_pkey primary key (user_id),
  constraint users_user_id_fkey foreign KEY (user_id) references user_settings (user_id) on delete CASCADE
) TABLESPACE pg_default;
```

---

## JSON Response Shapes

These match the TypeScript interfaces in `src/types/index.ts`. The backend **must** return camelCase keys.

### CalendarEvent

```json
{
  "id": "uuid",
  "title": "Team standup",
  "start": "2025-01-15T09:00:00Z",
  "end": "2025-01-15T09:30:00Z",
  "isAllDay": false,
  "organizerTimezone": "America/New_York",
  "userTimezone": "Asia/Singapore",
  "meetingLink": "https://zoom.us/j/123",
  "meetingPlatform": "zoom",
  "meetingId": "123-456-789",
  "meetingPasscode": "abc123",
  "location": "Conference Room A",
  "organizer": { "name": "Jane", "email": "jane@co.com" },
  "attendees": [
    {
      "name": "You",
      "email": "you@co.com",
      "rsvpStatus": "accepted",
      "isCurrentUser": true
    }
  ],
  "description": "Daily sync",
  "calendarId": "primary",
  "calendarName": "Work",
  "accountEmail": "you@co.com",
  "source": "google",
  "color": "#4285F4",
  "isReadOnly": false,
  "htmlLink": "https://calendar.google.com/event?eid=...",
  "detectedFromEmail": false,
  "emailDetectionMethod": null,
  "emailSender": null,
  "emailSnippet": null,
  "acceptanceStatus": "accepted"
}
```

### CalendarConnection

```json
{
  "id": "uuid",
  "userId": "uuid",
  "source": "google",
  "connectionType": "both",
  "accountEmail": "you@gmail.com",
  "displayName": "Personal Gmail",
  "color": "#4285F4",
  "isEnabled": true,
  "emailWatchEnabled": true,
  "lastSyncedAt": "2025-01-15T10:00:00Z",
  "syncStatus": "synced",
  "errorMessage": null,
  "calendars": [
    {
      "id": "uuid",
      "name": "Work",
      "color": "#4285F4",
      "isEnabled": true,
      "isReadOnly": false
    }
  ]
}
```

### UserSettings

```json
{
  "userId": "uuid",
  "homeTimezone": "Asia/Singapore",
  "showOrganizerTimezone": true,
  "defaultCalendarId": "primary",
  "firstDayOfWeek": "monday",
  "emailDetectionMode": "ics_only",
  "displayName": "John Doe",
  "email": "john@example.com",
  "darkMode": false
}
```

### Timezone

```json
{
  "id": 1,
  "name": "Singapore (SGT, UTC+8)",
  "iana_key": "Asia/Singapore",
  "location": "Singapore",
  "utc_offset": "08:00:00"
}
```

---

## Column Mapping Reference

The backend must transform database `snake_case` columns to `camelCase` JSON keys.

| DB Column | JSON Key |
|---|---|
| `start_time` | `start` |
| `end_time` | `end` |
| `is_all_day` | `isAllDay` |
| `organizer_tz` | `organizerTimezone` |
| `user_tz` | `userTimezone` |
| `meeting_link` | `meetingLink` |
| `meeting_platform` | `meetingPlatform` |
| `meeting_id` | `meetingId` |
| `meeting_passcode` | `meetingPasscode` |
| `calendar_id` | `calendarId` |
| `calendar_name` | `calendarName` |
| `account_email` | `accountEmail` |
| `is_read_only` | `isReadOnly` |
| `html_link` | `htmlLink` |
| `detected_from_email` | `detectedFromEmail` |
| `email_detection_method` | `emailDetectionMethod` |
| `email_sender` | `emailSender` |
| `email_snippet` | `emailSnippet` |
| `acceptance_status` | `acceptanceStatus` |
| `user_id` | `userId` |
| `connection_type` | `connectionType` |
| `display_name` | `displayName` |
| `is_enabled` | `isEnabled` |
| `email_watch_enabled` | `emailWatchEnabled` |
| `last_synced_at` | `lastSyncedAt` |
| `sync_status` | `syncStatus` |
| `error_message` | `errorMessage` |
| `home_timezone` | `homeTimezone` |
| `show_organizer_tz` | `showOrganizerTimezone` |
| `default_calendar_id` | `defaultCalendarId` |
| `first_day_of_week` | `firstDayOfWeek` |
| `email_detection_mode` | `emailDetectionMode` |
| `dark_mode` | `darkMode` |
