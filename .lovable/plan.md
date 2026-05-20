# Plan: Instant Event Colors + Modernized Week View

Two focused, frontend-only changes. No `.env`, no Supabase, no backend, no types regeneration touched.

---

## 1) Events reflect the connection color instantly (no sync needed)

**Problem.** `GET /events` returns each event with the `color` it had at sync time. When the user changes a calendar's color in `CalendarsView`, the `calendars` cache updates, but cached/persisted events still carry the old hex until the backend re-syncs and re-emits them. Result: events stay blue (or the old color) in Today / Week / Month / Inbox / EventDetailSheet.

**Fix (frontend-only override).** Always derive the rendered color from the parent connection at render time, ignoring the stale `event.color` from the API. This makes color changes visible immediately, regardless of sync state.

### Files to change

**`src/hooks/useEvents.ts`** — add a small helper hook + apply it inside `useWeekEvents`, `useMonthEvents`, `usePendingInbox`:

- Add `useColoredEvents(events)` that:
  - Reads the `["calendars"]` query data from the cache (no extra fetch).
  - Builds a `Map<connectionId, color>` and a fallback `Map<accountEmail, color>`.
  - Returns a new array where each event's `color` is overridden by `connections[event.calendarId]?.color ?? connections[event.accountEmail]?.color ?? event.color`.
- Each hook (`useWeekEvents`, `useMonthEvents`, `usePendingInbox`) re-exports `{ ...query, data: useColoredEvents(query.data) }` so every consumer (TodayView, WeekView, MonthView, InboxView, EventCard, EventDetailSheet) automatically gets the live color with zero call-site changes.

**`src/components/calendars/CalendarsView.tsx`** — `handleColorChange` already invalidates `["calendars"]` and `["events"]`. Keep as-is; the override above means even without a refetch, all views repaint instantly the moment the `calendars` cache mutates.

**No other files need editing** for change #1.

**Backend doc.** No new backend contract required for this fix (purely client-side override). `BACKEND_API.md` does NOT need an update for #1. The existing planned cascade in `PATCH /calendars/:id/color` is still nice-to-have for cross-device freshness but no longer blocks the UX.

---

## 2) WeekView — calmer, more modern, easier to scan

**Inspiration.** Apple Calendar / Cron / Notion Calendar week view, kept consistent with Robbie's "Notion-meets-Apple" aesthetic (Inter, 16px radii, soft shadows, semantic tokens only).

### What changes in `src/components/calendar/WeekView.tsx`

Layout & rhythm
- **Sticky header**: the week range bar + day-label row stick to the top while the time grid scrolls. Today's column gets a subtle `bg-muted/40` tint behind it across the full grid height.
- **Hour rhythm**: `HOUR_HEIGHT` 60 → **72 px**. Add a faint half-hour divider (`border-border/30`, dashed) between each hour line (`border-border/60`).
- **Time gutter**: widened from `3rem` → `3.5rem`, hour labels right-aligned, slightly smaller (`text-[11px]`), `text-muted-foreground/70`, sitting just above their line (not overlapping the divider).
- **Day header row**: weekday `EEE` in `text-[11px] uppercase tracking-wide`, day number in a 32 px circle. Today's circle uses `bg-[hsl(var(--fuse-primary))] text-primary-foreground`; non-today day numbers are clickable to jump (future improvement, scaffolded as a button but no-op for now — keep scope tight).
- **All-day strip**: thin row beneath the day labels (max-height ~48 px, scrollable if many) showing `isAllDay` events as pill chips colored by connection. This removes today's awkward gap where all-day events disappear.
- **Visible window**: default range stays 7 AM–8 PM, but on mount we **auto-scroll to ~1 hour before `now`** when viewing the current week so the user lands on "right now" instead of 7 AM.
- **Current-time line**: keep the red line, add a small **time pill** ("2:47 PM") on the left edge so it reads at a glance. Re-tick every minute via `setInterval`.

Event blocks (timed)
- Keep the existing greedy overlap-packing math — it works.
- Restyle each block:
  - `rounded-[10px]`, `px-2 py-1.5`, `text-[12px]`, `leading-[1.15]`.
  - Background: `linear-gradient(180deg, ${color}1F, ${color}0A)` (top-down, ~12% → ~4% opacity) instead of left-to-right tint — feels less busy when many events stack.
  - **Left accent bar** thickened to 3 px, full height, slightly inset (`top: 4, bottom: 4, left: 4`).
  - Title in `color` (connection color), time in `text-muted-foreground`, meeting icon in top-right corner instead of below the time (saves a line for short events).
  - Hover: `shadow-md`, `-translate-y-[1px]`, no border color shift.
  - Min height bumped 22 → **28 px** so even 15-min events show title + time without clipping.
- **Short-event compaction**: if rendered `height < 44 px`, hide the time line and shrink padding — only title + accent bar.

Header & navigation
- Header row: left = `‹` icon button; center = **two-line title** ("Week of May 18" big, "May 18 – May 24, 2026" small muted); right = `›` icon button. Add a small **"Today"** ghost button next to the chevrons that resets `weekOffset = 0` and is hidden when already on the current week.

Empty / loading / error states
- Keep the same `EventListSkeleton` / `ErrorState` patterns, just rendered inside the new grid frame (not replacing the header) so the chrome is stable.

### Files to change for #2
- `src/components/calendar/WeekView.tsx` — all of the above. Single-file change.
- No new shared components, no design-token additions (uses existing `--fuse-primary`, `--shadow-soft`, `--radius-card`, `--status-error`, `--min-tap`, `border-border`, `bg-muted`).

### Backend doc
- `BACKEND_API.md` does **not** need updating for #2 (pure UI).

---

## Summary of files touched
1. `src/hooks/useEvents.ts` — add `useColoredEvents`, wrap the three query hooks.
2. `src/components/calendar/WeekView.tsx` — restyle + sticky header + all-day strip + auto-scroll + Today button.

**Files NOT touched (strict):** `.env`, `src/integrations/supabase/*`, `supabase/*`, `src/services/api.ts`, `src/types/index.ts`, any other view files, `BACKEND_API.md`.
