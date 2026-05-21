## Goal
Fix the calendar visibility toggle so that (a) the switch reflects the actual DB state on refresh, and (b) events from disabled connections are hidden from all calendar views immediately.

## Problems found
1. **Switch is uncontrolled** — `<Switch defaultChecked={connection.isEnabled} ... />` in `CalendarsView.tsx` (line 367) uses `defaultChecked`, so after a refetch the UI doesn't sync with the DB value. It also never invalidates the `["calendars"]` cache.
2. **No frontend filtering** — `useWeekEvents`, `useMonthEvents`, `usePendingInbox` in `useEvents.ts` return all events regardless of the parent connection's `isEnabled`. Even though the value persists in the DB, disabled calendars still show events on the frontend.

## Changes

### 1) `src/components/calendars/CalendarsView.tsx`
- Make the visibility Switch **controlled**: `checked={connection.isEnabled}` instead of `defaultChecked`.
- In `handleToggle`:
  - On success: invalidate `["calendars"]` **and** `["events"]` so views re-render with the new visibility immediately.
  - On error: also invalidate `["calendars"]` to revert UI to true DB state.

### 2) `src/hooks/useEvents.ts`
- Extend the existing `useColoredEvents` helper (or add a sibling `useVisibleColoredEvents`) to **filter out events whose parent connection has `isEnabled === false`**, matched by `calendarId` or `accountEmail` against the `["calendars"]` cache.
- Apply to `useWeekEvents`, `useMonthEvents`, `usePendingInbox` (same call sites as today).
- If the `["calendars"]` cache isn't loaded yet, fall back to showing all events (no false hides on first paint).

## Files touched (only these)
- `src/components/calendars/CalendarsView.tsx`
- `src/hooks/useEvents.ts`

## NOT touched
`.env`, `supabase/*`, `src/integrations/supabase/*`, `src/types/index.ts`, `src/services/api.ts`, `BACKEND_API.md`, or any other file.
