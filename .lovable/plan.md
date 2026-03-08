

# Wire api.ts to Supabase — Remove All Mocks

## Blocker: No Supabase connection

There is no `src/integrations/supabase/client.ts` in the project. I need to connect Supabase first, which generates the typed client. Then I rewrite `api.ts`.

## Step 1 — Connect Supabase
I will prompt you to link your Supabase project (or create one via Lovable Cloud). This auto-generates the client file.

## Step 2 — Rewrite `src/services/api.ts`

**Delete entirely** (~305 lines):
- All `MOCK_*` arrays, `makeDate()`, `today()`, `weekStart`, `mondayOffset`, `delay()`
- `date-fns` import (no longer needed here)

**Replace each function body** with a Supabase query. Same signatures, same return types — no other file changes.

A small `mapRow()` helper converts Postgres `snake_case` columns to the `camelCase` TypeScript interfaces. This is the only glue code.

```text
// BEFORE
export async function getEventsForDateRange(...) {
  await delay();
  return MOCK_EVENTS;
}

// AFTER
export async function getEventsForDateRange(start: Date, end: Date) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("start", start.toISOString())
    .lte("start", end.toISOString())
    .eq("acceptance_status", "accepted");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEventRow);
}
```

### Full function → query mapping

| Function | Query |
|---|---|
| `getEventsForDateRange(start, end)` | `events` — filter by `start` range, `acceptance_status = accepted` |
| `getPendingEmailEvents()` | `events` — filter `acceptance_status = pending_review` |
| `acceptEmailEvent(id, calId)` | `events` — update `acceptance_status`, `calendar_id` |
| `dismissEmailEvent(id)` | `events` — update `acceptance_status = dismissed` |
| `getCalendarConnections()` | `calendar_connections` — select with `sub_calendars(*)` |
| `disconnectCalendar(id)` | `calendar_connections` — delete |
| `updateCalendarColor(id, color)` | `calendar_connections` — update `color` |
| `toggleCalendarVisibility(id, enabled)` | `calendar_connections` — update `is_enabled` |
| `toggleEmailWatch(id, enabled)` | `calendar_connections` — update `email_watch_enabled` |
| `getTimezones()` | `timezones` — select all, order by `utc_offset` |
| `getUserSettings()` | `user_settings` — select single row for current user |
| `updateUserSettings(settings)` | `user_settings` — update, return merged |
| `deleteAllUserData()` | `supabase.functions.invoke("delete-user-data")` |
| `initiateOAuthConnection(source)` | `supabase.functions.invoke("oauth-connect", ...)` |
| `connectAppleCalendar(...)` | `supabase.functions.invoke("connect-apple", ...)` |
| `connectCalDAV(...)` | `supabase.functions.invoke("connect-caldav", ...)` |
| `syncNow(id)` | `supabase.functions.invoke("sync-calendar", ...)` |

### What the backend engineer does after this
1. Create tables: `events`, `calendar_connections`, `sub_calendars`, `user_settings`, `timezones`
2. Enable RLS on each table
3. Seed `timezones` with timezone data
4. Create Edge Functions: `delete-user-data`, `oauth-connect`, `connect-apple`, `connect-caldav`, `sync-calendar`

### Files touched

| File | Action |
|---|---|
| `src/services/api.ts` | Full rewrite — mocks → Supabase queries |

No other files change. All hooks, components, and types stay identical.

### First action
I will prompt the Supabase connection dialog so you can link your project.

