

# Cleanup: Dead Code, Mock Leftovers, and Error Handling Polish

## Audit Findings

### Dead code and unused modules

| Issue | File | Detail |
|---|---|---|
| Unused Radix toast system | `use-toast.ts`, `toaster.tsx`, `ui/use-toast.ts`, `ui/toast.tsx` | App uses **Sonner** for all toasts. The Radix `Toaster` is mounted in `App.tsx` but nothing dispatches to it. 4 files + 1 import in `App.tsx` are dead weight. |
| `ConfirmDialog` never used | `shared/ConfirmDialog.tsx` | Created but never imported by any component. Keep it (it's useful for future destructive actions like "Delete everything") but add a comment noting it's intentionally unused for now. |
| `format` import in `api.ts` | `src/services/api.ts` line 18 | `format` is imported from `date-fns` but never called in any exported function. Dead import. |
| Mock-specific error flag | `EventCard.tsx` line 35 | `const hasError = event.source === "outlook"` — hardcoded mock assumption that Outlook = error. Should derive error state from actual connection data, not source type. |

### Missing error handling / broken UX

| Issue | File | Detail |
|---|---|---|
| "Review" button does nothing | `TodayView.tsx` line 66 | The pending invitation banner's "Review" button has no `onClick`. Should switch to the Inbox tab. |
| Settings toggles/selects are fire-and-forget | `Settings.tsx` | All controls use `defaultValue`/`defaultChecked` with no `onChange`. Changes aren't persisted. Not wirable until backend exists, but should have placeholder handlers with toast feedback. |
| Calendar toggle does nothing | `CalendarsView.tsx` line 129 | `Switch defaultChecked={connection.isEnabled}` — no `onChange`, toggling is silently ignored. |
| MonthView has no loading skeleton | `MonthView.tsx` | Unlike TodayView/WeekView, MonthView shows no skeleton during initial load. The grid renders empty. |
| `api.ts` still returns mock data | `src/services/api.ts` | Per the approved plan, this needs to become backend-ready placeholders with commented-out Supabase queries. |

---

## Plan

### 1. Rewrite `api.ts` — mock data → backend-ready placeholders
- Delete all `MOCK_*` constants, `delay()`, `makeDate()`, `today()`, `weekStart`, `mondayOffset`
- Remove the `date-fns` import (dead after mock removal)
- Add top-of-file SQL DDL + Edge Function documentation in comments
- Add `mapEventRow`, `mapConnectionRow`, `mapSettingsRow` row-mapping utilities (live code)
- Each function gets a commented-out Supabase query block + an active `throw new Error("Backend not connected")` placeholder
- Add commented-out `import { supabase } from "@/integrations/supabase/client"` at the top

### 2. Remove dead Radix toast system
- Delete `src/hooks/use-toast.ts`
- Delete `src/components/ui/use-toast.ts`
- Delete `src/components/ui/toaster.tsx`
- Delete `src/components/ui/toast.tsx`
- Remove `<Toaster />` import and usage from `App.tsx`
- The app already uses Sonner (`<Sonner />`) exclusively

### 3. Fix `EventCard.tsx` — remove mock-specific error logic
- Remove `const hasError = event.source === "outlook"` and the associated warning block
- This was a mock-data artifact. Real connection errors should be surfaced at the view level (already done via `ErrorState`), not per-card based on source type

### 4. Fix TodayView "Review" button
- Accept an `onTabChange` callback from `AppLayout` and pass it down
- Wire the "Review" button to switch to the `"inbox"` tab
- This requires `AppLayout` to pass `setActiveTab` as a prop to `TodayView`

### 5. Add placeholder `onChange` handlers to Settings controls
- Wire each `Switch`/`Select` to call `updateUserSettings()` with a try/catch
- Show a Sonner toast on success ("Settings updated") and on failure ("Couldn't save — try again")
- This makes settings functional the moment the backend is connected

### 6. Add placeholder `onChange` to CalendarsView toggle
- Wire `Switch onChange` to call `toggleCalendarVisibility()` with optimistic UI + error toast rollback

### 7. Add loading state to MonthView
- Show skeleton/spinner while `isLoading` is true, consistent with other views

### 8. Add comment to `ConfirmDialog.tsx`
- Note that it's intentionally unused — reserved for future destructive actions (disconnect calendar, delete all data)

---

## Files touched

| File | Action |
|---|---|
| `src/services/api.ts` | Full rewrite — mocks → commented Supabase queries + throw placeholders |
| `src/hooks/use-toast.ts` | **Delete** |
| `src/components/ui/use-toast.ts` | **Delete** |
| `src/components/ui/toaster.tsx` | **Delete** |
| `src/components/ui/toast.tsx` | **Delete** |
| `src/App.tsx` | Remove Radix `Toaster` import + JSX |
| `src/components/shared/EventCard.tsx` | Remove mock-specific Outlook error flag |
| `src/components/calendar/TodayView.tsx` | Wire "Review" button to tab switch |
| `src/components/layout/AppLayout.tsx` | Pass `onTabChange` prop to TodayView |
| `src/pages/Settings.tsx` | Add onChange handlers with toast feedback |
| `src/components/calendars/CalendarsView.tsx` | Wire Switch onChange + loading state |
| `src/components/calendar/MonthView.tsx` | Add loading skeleton |
| `src/components/shared/ConfirmDialog.tsx` | Add "intentionally unused" comment |

