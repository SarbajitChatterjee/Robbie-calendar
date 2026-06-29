## Goal
Add a real-time event detection notification system that pops up when the backend writes a new `pending_review` email-detected event, and adds a pending count badge to the Inbox tab.

## New files

### 1) `src/hooks/useEventDetection.ts`
- Subscribes to Supabase Realtime on `public.events` (INSERT) via channel `email-detections`.
- Filters payloads client-side: keeps only `acceptance_status === "pending_review"` AND `detected_from_email === true`, casts `payload.new` to `CalendarEvent`, pushes onto an internal queue.
- On every queue add, invalidates `["events", "pending-inbox"]` so the Inbox badge stays in sync.
- Exposes:
  - `currentEvent` = `queue[0] ?? null`
  - `queueCount` = `queue.length`
  - `acceptCurrent(targetCalendarId)` → calls `acceptEmailEvent`, shifts queue, invalidates `["events","pending-inbox"]`, rethrows on error.
  - `dismissCurrent()` → calls `dismissEmailEvent`, shifts queue, invalidates same key.
  - `snoozeAll()` → `setQueue([])` only; no API, no invalidation.
- Cleans up channel via `supabase.removeChannel` in the `useEffect` return.
- DEV-only mock: inside `if (import.meta.env.DEV)`, fires `MOCK_ICS` after 3s and `MOCK_SMART` after 5s into the queue (exact objects per spec). Both timers cleared on unmount.

### 2) `src/components/shared/EventDetectedPopup.tsx`
Props: `{ event, queueCount, onAccept, onCheckLater, onDismiss }`.

Local state: `showCalendarPicker`, `isAccepting`.

Layout (all Tailwind, semantic tokens):
- Fixed container: `fixed z-50 right-6 bottom-6 w-[380px] md:w-[380px]` on desktop, `inset-x-3 bottom-4 w-auto` on mobile (responsive classes combined).
- Card: `bg-card border border-border rounded-2xl shadow-xl overflow-hidden`.
- **Progress bar** at top: `h-1 bg-primary`, width animates 100% → 0% over 12s using inline `transition-[width] duration-[12000ms] ease-linear` style set via class + a `useState` width flipped from `100%` to `0%` after a 50ms `setTimeout`. A second `setTimeout(12000)` calls `onCheckLater()`. Both cleared on unmount.
- **Detection pill** centered, `mt-3`:
  - `ics_attachment` → "✦ Robbie found a calendar invite" with `bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400`.
  - otherwise → "✦ Robbie interpreted an email" with purple equivalents.
  - `text-xs font-medium px-3 py-1 rounded-full`.
- **X button**: `absolute top-3 right-3`, ghost icon button, lucide `X` w-4 h-4 → `onDismiss()`.
- **Body** `p-4 pt-2`:
  - Title: `font-semibold text-base text-foreground line-clamp-2 mb-1`.
  - Date/time row via `date-fns format`: `"EEEE, d MMM · h:mm – h:mm a"`, or `"EEEE, d MMM · All day"` if `isAllDay`. If `organizerTimezone !== userTimezone` and both exist, second line `text-xs text-muted-foreground` showing organizer-local time (use `toLocaleString` with `timeZone`).
  - Meeting/location row (icons from lucide: `Video` for meeting, `MapPin` for location), `text-xs text-muted-foreground`, location truncated.
  - If `smart_parse`: italic note `text-xs text-muted-foreground/70 italic mt-1`.
  - If `queueCount > 1`: tappable `+{queueCount-1} more found in your inbox`, `text-xs text-muted-foreground underline mt-2`, calls `onCheckLater()`.
- **Footer**:
  - Default: two `Button`s flex-1 with gap-2 → "Check in Inbox" (outline) and "Add to Calendar ✓" (default, shows "Adding..." when `isAccepting`, sets `showCalendarPicker=true`).
  - Picker: label `Add to which calendar?`, then list from `useCalendars()` filtered `isEnabled === true`. Each row: full-width button, color dot (`w-3 h-3 rounded-full` using `connection.color` — only allowed inline style is `backgroundColor` because color is dynamic data, not a theme token), `connection.displayName`. On click: `setIsAccepting(true)` then `await onAccept(connection.id)`; on error reset both flags. Cancel link below.

Spec allows only Tailwind + CSS vars — but the per-connection swatch color is runtime data, so it uses `style={{ backgroundColor: connection.color }}`, matching how the existing app already handles dynamic event colors.

## Modified file

### 3) `src/components/layout/AppLayout.tsx` (only this)
- Add imports: `useQueryClient` from `@tanstack/react-query`, `useEventDetection`, `usePendingInbox`, `EventDetectedPopup`.
- Inside component, alongside existing `useState`s:
  ```ts
  const queryClient = useQueryClient();
  const { currentEvent, queueCount, acceptCurrent, dismissCurrent, snoozeAll } = useEventDetection();
  const { data: pendingEvents } = usePendingInbox();
  const pendingCount = pendingEvents?.length ?? 0;
  ```
  (`queryClient` declared per spec even though unused locally — kept to match the brief.)
- In both desktop nav `tabs.map` and mobile bottom-nav `tabs.map`, wrap the icon for `tab.id === "inbox"` in a `relative inline-flex` span and render a badge when `pendingCount > 0`:
  - Badge: `absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--fuse-primary))] text-white text-[10px] font-semibold flex items-center justify-center` showing `pendingCount > 9 ? "9+" : pendingCount`.
- Just before the closing `</div>` of the root flex container (after the mobile bottom nav), render:
  ```tsx
  {currentEvent && (
    <EventDetectedPopup
      event={currentEvent}
      queueCount={queueCount}
      onAccept={acceptCurrent}
      onDismiss={dismissCurrent}
      onCheckLater={() => { snoozeAll(); handleTabChange("inbox"); }}
    />
  )}
  ```

## Not touched
`src/services/api.ts`, `src/types/index.ts`, `src/hooks/useEvents.ts`, `src/hooks/useCalendars.ts`, `src/components/inbox/InboxView.tsx`, `src/pages/Index.tsx`, `src/pages/Settings.tsx`, anything under `src/components/ui/` or `src/integrations/`, `.env`, `supabase/*`. No new npm packages.

## Realtime note
The plan does not enable Realtime publication on `public.events` (that would require a migration, which is out of scope for the listed files). The DEV mock timers exercise the full popup → accept/dismiss/snooze flow without needing the DB channel. Once the backend enables `events` in `supabase_realtime`, the same subscription will start delivering live INSERTs with no frontend change.
