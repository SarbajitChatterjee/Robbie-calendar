

# Restructure to Frontend → REST API → Backend

## Current Problem

`api.ts` currently contains Supabase-specific queries (commented out). This means the frontend is designed to talk directly to the database. The user wants a clean separation: **frontend only knows about REST endpoints**, backend handles everything else.

## What Changes

### Rewrite `src/services/api.ts`

**Delete entirely:**
- All Supabase-specific commented-out code (`.from("events").select(...)`, `.functions.invoke(...)`)
- All row mappers (`mapEventRow`, `mapConnectionRow`, `mapSettingsRow`, `toSettingsColumns`) — these belong in the backend
- The Supabase client import comment
- The SQL DDL block — move to a separate backend doc

**Replace with:**
- A single `API_BASE_URL` config constant (reads from `import.meta.env.VITE_API_BASE_URL`, defaults to `"/api"`)
- A shared `apiFetch<T>(method, path, body?)` helper that:
  - Prepends `API_BASE_URL`
  - Sets `Content-Type: application/json`
  - Attaches auth token from `localStorage` (or wherever the backend auth puts it)
  - Throws a typed error on non-2xx responses with the server's error message
- Each function becomes a clean HTTP call — no DB knowledge whatsoever

### Example (before → after)

```text
// BEFORE (Supabase-aware)
export async function getEventsForDateRange(start, end) {
  // const { data, error } = await supabase.from("events").select("*")...
  throw new Error("Backend not connected");
}

// AFTER (pure REST)
export async function getEventsForDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  return apiFetch("GET", `/events?start=${start.toISOString()}&end=${end.toISOString()}`);
}
```

### Full endpoint mapping

| Function | HTTP Call |
|---|---|
| `getEventsForDateRange(start, end)` | `GET /events?start=...&end=...` |
| `getPendingEmailEvents()` | `GET /events/pending` |
| `acceptEmailEvent(id, calId)` | `POST /events/{id}/accept` body: `{ targetCalendarId }` |
| `dismissEmailEvent(id)` | `POST /events/{id}/dismiss` |
| `getCalendarConnections()` | `GET /calendars` |
| `initiateOAuthConnection(source)` | `POST /calendars/connect/oauth` body: `{ source }` |
| `connectAppleCalendar(appleId, pw)` | `POST /calendars/connect/apple` body: `{ appleId, appPassword }` |
| `connectCalDAV(url, user, pw)` | `POST /calendars/connect/caldav` body: `{ serverUrl, username, password }` |
| `disconnectCalendar(id)` | `DELETE /calendars/{id}` |
| `syncNow(id?)` | `POST /calendars/sync` body: `{ connectionId? }` |
| `updateCalendarColor(id, color)` | `PATCH /calendars/{id}/color` body: `{ color }` |
| `toggleCalendarVisibility(id, enabled)` | `PATCH /calendars/{id}/visibility` body: `{ enabled }` |
| `toggleEmailWatch(id, enabled)` | `PATCH /calendars/{id}/email-watch` body: `{ enabled }` |
| `getTimezones()` | `GET /timezones` |
| `getUserSettings()` | `GET /user/settings` |
| `updateUserSettings(settings)` | `PATCH /user/settings` body: partial settings |
| `deleteAllUserData()` | `DELETE /user/data` |

### Create `BACKEND_API.md`

A standalone doc for the backend engineer containing:
- The full REST API contract (every endpoint, method, request body, response shape)
- The SQL DDL (moved from `api.ts` — it doesn't belong in frontend code)
- Expected JSON response shapes matching the TypeScript interfaces
- Auth expectations (Bearer token in Authorization header)

### Files touched

| File | Action |
|---|---|
| `src/services/api.ts` | Full rewrite — pure REST calls via `fetch()`, zero DB knowledge |
| `BACKEND_API.md` | **Create** — REST contract + SQL DDL for the backend engineer |

No other files change. All hooks, components, and types remain identical because the function signatures stay the same.

