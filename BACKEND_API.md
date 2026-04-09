# Robbie — Backend API Contract

> **Audience:** Backend engineers working on or extending the REST API server.
>
> The frontend calls these endpoints via `src/services/api.ts`.
> Every request includes `Authorization: Bearer <token>` when the user is authenticated.
> The backend is responsible for token validation, user identity extraction, and all database access.
>
> **Status key used in this document:**
> - ✅ **Live** — implemented and deployed
> - 🔜 **Planned** — frontend is wired and ready; backend implementation pending

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Response Format](#error-response-format)
3. [Endpoints — Health](#endpoints--health)
4. [Endpoints — Events](#endpoints--events)
5. [Endpoints — Calendar Connections](#endpoints--calendar-connections)
6. [Endpoints — Timezones](#endpoints--timezones)
7. [Endpoints — User Settings](#endpoints--user-settings)
8. [Endpoints — Data Management](#endpoints--data-management)
9. [SQL DDL](#sql-ddl)
10. [JSON Response Shapes](#json-response-shapes)
11. [Column Mapping Reference](#column-mapping-reference)

---

## Authentication

Every request from the frontend includes:

```
Authorization: Bearer <token>
Content-Type: application/json
```

The backend:
1. Validates the JWT against the Supabase JWKS endpoint (`JWKS_URL` in `.env`)
2. Extracts `user_id` from the `sub` claim
3. Scopes all database queries to that user
4. Returns `401 Unauthorized` if the token is missing or invalid

The frontend syncs the Supabase session JWT into `localStorage` under `"auth_token"` via the `AuthGuard` in `App.tsx`. `api.ts` reads it from there and attaches it as the Bearer token on every request.

---

## Error Response Format

On any error, return a JSON body with a `detail` field (FastAPI default):

```json
{
  "detail": "Human-readable error message"
}
```

Use appropriate HTTP status codes:
- `400` — Bad request (validation errors, missing fields)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (user doesn't own the resource)
- `404` — Resource not found
- `500` — Internal server error

---

## Endpoints — Health

### ✅ `GET /health`

Public endpoint — no authentication required. Used for uptime monitoring.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "version": "0.0.1"
}
```

---

## Endpoints — Events

### ✅ `GET /events?start=<ISO>&end=<ISO>`

Fetches all **confirmed** events within a date range for the authenticated user.

| Param | Type | Description |
|---|---|---|
| `start` | ISO 8601 string (query) | Range start (inclusive) |
| `end` | ISO 8601 string (query) | Range end (inclusive) |

**Filter:** Only returns events where `acceptance_status = 'accepted'`.

**Response:** `200 OK` — `CalendarEvent[]` (see [JSON shapes](#calendarevent))

---

### 🔜 `GET /events/pending`

Fetches events detected from email that are awaiting user review.

**Filter:** `acceptance_status = 'pending_review'` AND `detected_from_email = true`

**Response:** `200 OK` — `CalendarEvent[]`

---

### 🔜 `POST /events/:id/accept`

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

### 🔜 `POST /events/:id/dismiss`

Dismisses a pending event (user chose to ignore it).

**Action:** Set `acceptance_status = 'dismissed'`.

**Response:** `204 No Content`

---

## Endpoints — Calendar Connections

### ✅ `GET /calendars`

Fetches all connected calendar accounts for the authenticated user, including nested sub-calendars.

**Response:** `200 OK` — `CalendarConnection[]` (each with a `calendars` array of `SubCalendar`)

---

### ✅ `POST /calendars/connect/oauth`

Initiates a Google OAuth flow.

**Request body:**
```json
{
  "source": "google",
  "connection_type": "both"
}
```

> `source` must be `"google"` — other providers are not yet implemented.  
> `connection_type` accepts `"calendar"`, `"email_watch"`, or `"both"`.

**Response:** `200 OK`
```json
{
  "redirect_auth_url": "https://accounts.google.com/o/oauth2/..."
}
```

The frontend redirects the user to `redirect_auth_url`. After the user completes Google auth, the backend callback handles the token exchange and redirects back to the app.

---

### ✅ `GET /auth/google/callback`

Google OAuth callback — handled entirely by the backend. Not called directly by the frontend.

Validates the PKCE `code_verifier` and signed JWT `state`, exchanges the authorisation code for tokens, fetches the user's Google email, encrypts and stores the tokens in `calendar_connections`, then redirects to the frontend.

---

### 🔜 `POST /calendars/connect/apple`

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

### 🔜 `POST /calendars/connect/caldav`

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

### 🔜 `DELETE /calendars/:id`

Disconnects a calendar source and removes all its synced events.

**Response:** `204 No Content`

---

### 🔜 `POST /calendars/sync`

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

### 🔜 `PATCH /calendars/:id/color`

Updates the display color for a calendar connection.

**Request body:**
```json
{
  "color": "#4285F4"
}
```

**Response:** `204 No Content`

---

### 🔜 `PATCH /calendars/:id/visibility`

Toggles whether a calendar's events appear in views.

**Request body:**
```json
{
  "enabled": true
}
```

**Response:** `204 No Content`

---

### 🔜 `PATCH /calendars/:id/email-watch`

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

> **Note:** Timezones are not served by the FastAPI backend. The frontend queries the `timezone` table in Supabase directly via the Supabase JS client (`useTimezones` hook). No backend endpoint is needed or planned for this.

---

## Endpoints — User Settings

> **Note:** User settings are not served by the FastAPI backend. The frontend reads and writes the `user_settings` table in Supabase directly via `useUserSettings` and `useUpdateUserSettings` hooks. No backend endpoint is needed or planned for this.

---

## Endpoints — Data Management

### 🔜 `DELETE /user/data`

Permanently deletes **all** user data: events, calendar connections, sub-calendars, and settings. This action is irreversible.

**Response:** `204 No Content`

---

## SQL DDL

The live database schema. Run each block in Supabase SQL editor.

> **Important:** The `user_settings` and `timezone` tables use the exact column names shown here — the frontend's generated types in `src/integrations/supabase/types.ts` are the source of truth for these two tables.

```sql
-- 1. Users
CREATE TABLE public.users (
  user_id    BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  firstname  CHARACTER VARYING NOT NULL,
  lastname   CHARACTER VARYING NOT NULL,
  email      CHARACTER VARYING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES user_settings (user_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. User settings (one row per user)
-- Note: column names are camelCase as stored in Supabase
CREATE TABLE public.user_settings (
  user_id                UUID PRIMARY KEY,
  email                  TEXT,
  "displayName"          TEXT,
  "homeTimezone"         TEXT DEFAULT 'UTC',
  "firstDayOfWeek"       TEXT DEFAULT 'monday',       -- sunday | monday
  "emailDetectionMode"   TEXT DEFAULT 'ics_only',     -- ics_only | smart
  "darkMode"             BOOLEAN DEFAULT FALSE,
  "showOrganizerTimezone" BOOLEAN DEFAULT TRUE,
  "defaultCalendarId"    INTEGER,
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- 3. Timezone reference data
-- Note: queried directly by the frontend — not via the backend API
CREATE TABLE public.timezone (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tz_tag      TEXT UNIQUE NOT NULL,   -- IANA key, e.g. "Asia/Singapore"
  tz_name     TEXT,                   -- Display name, e.g. "Singapore (SGT, UTC+8)"
  tz_location TEXT,                   -- e.g. "Singapore"
  utc_offset  TEXT,                   -- e.g. "UTC+08:00" or "08:00:00"
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Calendar connections
CREATE TABLE public.calendar_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  source              TEXT NOT NULL,               -- google | outlook | apple | caldav | gmail
  connection_type     TEXT NOT NULL,               -- calendar | email_watch | both
  account_email       TEXT NOT NULL,
  display_name        TEXT,
  color               TEXT,
  is_enabled          BOOLEAN DEFAULT TRUE,
  email_watch_enabled BOOLEAN DEFAULT FALSE,
  access_token        TEXT,                        -- Fernet-encrypted
  refresh_token       TEXT,                        -- Fernet-encrypted
  last_synced_at      TIMESTAMPTZ,
  sync_status         TEXT DEFAULT 'synced',       -- synced | syncing | error | disconnected
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 5. Sub-calendars (nested under connections)
-- Full DDL including RLS policies is in app/database/sub_calendar_SCHEMA.sql
CREATE TABLE public.sub_calendars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT,
  is_enabled    BOOLEAN DEFAULT TRUE,
  is_read_only  BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.sub_calendars ENABLE ROW LEVEL SECURITY;
-- See app/database/sub_calendar_SCHEMA.sql for full RLS policies

-- 6. Events
CREATE TABLE public.events (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL,
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
  source                 TEXT NOT NULL,           -- google | apple | outlook | caldav
  color                  TEXT,
  is_read_only           BOOLEAN DEFAULT FALSE,
  html_link              TEXT,
  detected_from_email    BOOLEAN DEFAULT FALSE,
  email_detection_method TEXT,                    -- ics_attachment | smart_parse
  email_sender           TEXT,
  email_snippet          TEXT,
  acceptance_status      TEXT DEFAULT 'pending_review',  -- accepted | pending_review | dismissed
  created_at             TIMESTAMPTZ DEFAULT now()
);
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

---

## Column Mapping Reference

The backend maps database `snake_case` columns to `camelCase` JSON keys. This mapping is handled in `api.ts` via `mapConnection()` for calendar connections; events are returned as-is from the DB and rely on the column names matching.

> **Note:** `user_settings` and `timezone` columns are accessed directly by the frontend via Supabase JS — they are not transformed by the backend.

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
