

# Add Error Handling Across All Views

## Problem

Every view uses TanStack Query hooks but only handles `isLoading` and empty states. **None handle errors.** If a fetch fails, users see either nothing or a broken UI with no explanation.

## What will change

### 1. Create `src/components/shared/ErrorState.tsx`
A reusable error component matching the existing `EmptyState` pattern. Shows an icon, a user-friendly message, and a "Try again" button that calls `refetch()`.

```text
┌────────────────────────┐
│         ⚠️              │
│  Something went wrong   │
│  Could not load events  │
│                         │
│     [ Try again ]       │
└────────────────────────┘
```

### 2. Add error states to every view

Each view currently destructures `{ data, isLoading }` from its hook. We add `isError, refetch` and render `<ErrorState>` when `isError` is true.

| View | Hook(s) | Error message |
|---|---|---|
| TodayView | `useWeekEvents` | "Couldn't load today's events" |
| WeekView | `useWeekEvents` | "Couldn't load this week's events" |
| MonthView | `useWeekEvents` | "Couldn't load events" |
| InboxView | `usePendingInbox` | "Couldn't load invitations" |
| CalendarsView | `useCalendars` | "Couldn't load your calendars" |
| Settings | `useUserSettings` | "Couldn't load your settings" |

### 3. Add error handling to InboxView actions

`handleAccept` and `handleDismiss` currently only update local state — they never call the API. Wrap with try/catch, call the real API functions, and show a toast on failure.

### 4. Settings — show error instead of returning `null`

Currently `if (!settings) return null` hides errors silently. Replace with an error state when the query fails.

## Files touched

| File | Action |
|---|---|
| `src/components/shared/ErrorState.tsx` | **Create** — reusable error UI |
| `src/components/calendar/TodayView.tsx` | Add error state |
| `src/components/calendar/WeekView.tsx` | Add error state |
| `src/components/calendar/MonthView.tsx` | Add error state |
| `src/components/inbox/InboxView.tsx` | Add error state + try/catch on accept/dismiss |
| `src/components/calendars/CalendarsView.tsx` | Add error state |
| `src/pages/Settings.tsx` | Add error state instead of returning null |

No logic changes to hooks or api.ts. Only UI-level error surfaces.

