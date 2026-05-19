
## Overview

Three independent changes, all in the frontend + `BACKEND_API.md`. **No `.env` changes, no other files touched.**

Files you will edit manually:
1. `src/services/api.ts`
2. `src/components/calendars/CalendarsView.tsx`
3. `BACKEND_API.md`

---

## 1) Email-watch: check status + safe enable/disable flow

### 1A. What already exists in your backend

`emailWatchEnabled` (boolean) is already returned on every `GET /calendars` connection row — that **is** the source of truth for "is watch on or off" (it's stored in the `email_watch_enabled` column). The UI already reads `connection.emailWatchEnabled`. So you do **not** need a new "check status" endpoint — the status comes back on the normal `/calendars` fetch and a `refetch`/`invalidateQueries(["calendars"])` re-reads it.

### 1B. New backend endpoints you must add

The current `PATCH /calendars/:id/email-watch` just flips a boolean. You want a guarded flow: scan-first when turning ON, stop-first when turning OFF, and only persist `email_watch_enabled` after the side-effect succeeds.

Add **two** new endpoints (keep the old PATCH as a fallback or remove it once these are live):

| Method | Path | Purpose | Success | Failure |
|---|---|---|---|---|
| POST | `/calendars/:id/email-watch/start` | (1) Kick off `fetchEmails()`; (2) on success kick off `emailScan()` (LLM pipeline); (3) only if both succeed, set `email_watch_enabled = true`. | `204 No Content` | non-2xx + `{ "detail": "..." }`, DB stays `false` |
| POST | `/calendars/:id/email-watch/stop` | Stop the inbox watcher / scan worker for this connection. Only if the stop call succeeds, set `email_watch_enabled = false`. | `204 No Content` | non-2xx + `{ "detail": "..." }`, DB stays `true` |

The backend is responsible for atomicity: the DB column must only change after the side-effect succeeds. The frontend then trusts the HTTP status.

### 1C. `src/services/api.ts` — replace the existing `toggleEmailWatch`

Replace lines 265–276 (the existing `toggleEmailWatch` block) with:

```ts
/**
 * POST /calendars/:id/email-watch/start
 * Backend runs fetchEmails() → emailScan(); only on full success does it
 * set email_watch_enabled = true. On any failure, DB stays false and a
 * non-2xx is returned so the UI can revert.
 */
export async function startEmailWatch(connectionId: string): Promise<void> {
  return apiFetch("POST", `/calendars/${connectionId}/email-watch/start`);
}

/**
 * POST /calendars/:id/email-watch/stop
 * Backend stops the watcher; only on success does it set
 * email_watch_enabled = false.
 */
export async function stopEmailWatch(connectionId: string): Promise<void> {
  return apiFetch("POST", `/calendars/${connectionId}/email-watch/stop`);
}
```

### 1D. `src/components/calendars/CalendarsView.tsx` — wire the guarded toggle

**Step 1.** In the import block at the top (currently importing `toggleEmailWatch`), replace `toggleEmailWatch` with the two new names:

```ts
import {
  toggleCalendarVisibility,
  syncNow,
  disconnectCalendar,
  updateCalendarColor,
  startEmailWatch,
  stopEmailWatch,
} from "@/services/api";
```

**Step 2.** Add a local "pending" state inside `ConnectionRow` (just under the existing `useState` lines, near `confirmDisconnect`):

```ts
const [watchPending, setWatchPending] = useState(false);
```

**Step 3.** Replace the entire existing `handleEmailWatchToggle` function with:

```ts
const handleEmailWatchToggle = async (next: boolean) => {
  if (watchPending) return;
  setWatchPending(true);
  try {
    if (next) {
      // Turn ON: backend runs fetchEmails() → emailScan(); only persists on full success.
      await startEmailWatch(connection.id);
      toast.success("Email watch on — scanning started");
    } else {
      // Turn OFF: backend stops the watcher; only persists on success.
      await stopEmailWatch(connection.id);
      toast.success("Email watch off");
    }
    // Re-fetch the row so emailWatchEnabled reflects the new server state.
    await qc.invalidateQueries({ queryKey: ["calendars"] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Couldn't update email watch";
    toast.error(msg);
    // Force a refetch so the Switch snaps back to the actual server value.
    await qc.invalidateQueries({ queryKey: ["calendars"] });
  } finally {
    setWatchPending(false);
  }
};
```

**Step 4.** In the `<DropdownMenuItem>` that renders the "Watch inbox" row, add `disabled` + a clearer status label so the user always knows the current state. Replace the existing Watch-inbox block with:

```tsx
{canWatchEmail && (
  <DropdownMenuItem
    onSelect={(e) => e.preventDefault()}
    className="flex items-center justify-between gap-2 cursor-pointer"
  >
    <span className="flex items-center">
      <Mail className="w-4 h-4 mr-2" />
      <span className="flex flex-col leading-tight">
        <span>Watch inbox</span>
        <span className="text-[10px] text-muted-foreground">
          {watchPending
            ? (connection.emailWatchEnabled ? "Stopping…" : "Starting scan…")
            : (connection.emailWatchEnabled ? "On" : "Off")}
        </span>
      </span>
    </span>
    <Switch
      checked={!!connection.emailWatchEnabled}
      disabled={watchPending}
      onCheckedChange={handleEmailWatchToggle}
      className="scale-75"
    />
  </DropdownMenuItem>
)}
```

This gives the user an explicit textual status (On / Off / Starting scan… / Stopping…) plus the pill on the row (already added in the previous round) for at-a-glance status.

### 1E. `BACKEND_API.md` — replace the single email-watch endpoint section

Find the block:

```
### 🔜 `PATCH /calendars/:id/email-watch`
...
**Response:** `204 No Content`
```

Replace the whole section (between the two `---` separators around it) with:

```md
### 🔜 `POST /calendars/:id/email-watch/start`

Enables email-watch for a connection in a guarded sequence:

1. Run `fetchEmails(connectionId)` (pull latest inbox state).
2. On success (HTTP 2xx from the fetch step), run `emailScan(connectionId)` (LLM detection pipeline).
3. **Only if both steps succeed**, set `email_watch_enabled = true` on `calendar_connections`.
4. If any step fails, leave `email_watch_enabled = false` and return a non-2xx with `{ "detail": "..." }`.

**Response (success):** `204 No Content`
**Response (failure):** `4xx`/`5xx` with `{ "detail": "..." }` — DB state unchanged.

---

### 🔜 `POST /calendars/:id/email-watch/stop`

Disables email-watch for a connection:

1. Stop the inbox watcher / scan worker for this connection.
2. **Only if the stop succeeds**, set `email_watch_enabled = false`.
3. On failure, leave `email_watch_enabled = true` and return a non-2xx.

**Response (success):** `204 No Content`
**Response (failure):** `4xx`/`5xx` with `{ "detail": "..." }` — DB state unchanged.

---

### Reading current status

There is **no separate status endpoint**. The current value of `email_watch_enabled` is included on every `GET /calendars` response, so the frontend simply re-fetches that list after a start/stop call.
```

---

## 2) Color change must propagate to all events instantly

### Root cause
`updateCalendarColor` succeeds and `["calendars"]` is invalidated, but the events views (`TodayView`, `WeekView`, `MonthView`) cache under `["events", ...]` and each `CalendarEvent.color` is a snapshot baked at fetch time. So the swatch updates but cards keep the old color until the next events refetch.

### 2A. `src/components/calendars/CalendarsView.tsx` — invalidate events too

In `handleColorChange`, add an events invalidation right after the calendars one. Replace the function with:

```ts
const handleColorChange = async (next: string) => {
  try {
    await updateCalendarColor(connection.id, next);
    // Refresh both the connection list (swatch) AND every events query
    // (Today / Week / Month / pending inbox) so cards repaint immediately.
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["calendars"] }),
      qc.invalidateQueries({ queryKey: ["events"] }),
    ]);
    toast.success("Color updated");
  } catch {
    toast.error("Couldn't update color");
  }
};
```

All three event hooks (`useWeekEvents`, `useMonthEvents`, `usePendingInbox`) start their queryKey with `"events"`, so a single `["events"]` invalidate refetches all of them.

### 2B. `BACKEND_API.md` — clarify color-update side effects

Find `### 🔜 PATCH /calendars/:id/color` and replace its body with:

```md
### 🔜 `PATCH /calendars/:id/color`

Updates the display color for a calendar connection.

**Request body:**
```json
{ "color": "#4285F4" }
```

**Action:** Update `color` on `calendar_connections`. Events served by `GET /events` derive their `color` from the parent connection, so subsequent event fetches must reflect the new color (either via a JOIN at read time, or by cascading the new color into the connection's existing event rows). The frontend invalidates its `["events"]` cache on a 2xx response and re-fetches.

**Response:** `204 No Content`
```

> If your backend currently stores `color` as a denormalized snapshot on each `events` row, the cascade in the bullet above is **required** — otherwise the refetch will still return the old color. The frontend invalidate alone cannot fix stale DB values.

---

## 3) Sync button — restyle to match the app

### What's wrong
The current button is a square outline pill sitting inside the text column, breaking the row's vertical rhythm and using a different border style than the rest of the card chrome (the `…` menu and Switch).

### 3A. `src/components/calendars/CalendarsView.tsx` — move + restyle the Sync action

**Step 1.** Add `RefreshCw` to the existing lucide import:

```ts
import { MoreHorizontal, Mail, Trash2, RefreshCw } from "lucide-react";
```

**Step 2.** In `ConnectionRow`, **delete** the existing `<button>` Sync block (the entire `<button disabled={isSyncing} …>` element inside the text column, including its `<span>` / `<svg>` children). Also delete the trailing `</button>` so the text column ends cleanly after the `syncLabel` paragraph.

**Step 3.** Place a new icon-button next to the `…` menu (same visual family — circular, ghost, 32px tap target). Insert it **immediately before** `<DropdownMenu>`:

```tsx
{/* Sync — icon button, matches the … menu style */}
<button
  aria-label={isSyncing ? "Syncing" : "Sync now"}
  disabled={isSyncing}
  onClick={async () => {
    try {
      setIsSyncing(true);
      await syncNow(connection.id);
      await qc.invalidateQueries({ queryKey: ["calendars"] });
      await qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Sync started");
    } catch {
      toast.error("Sync failed — try again");
    } finally {
      setIsSyncing(false);
    }
  }}
  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
</button>
```

### Resulting right-side row order
`color strip → Sync icon → ⋯ menu → visibility Switch` — four equally-weighted controls, matching the existing 32px circular ghost-button language.

### 3B. `BACKEND_API.md` — no changes needed
`POST /calendars/sync` is unchanged.

---

## Final sanity checklist (run after you apply everything)

- `src/services/api.ts`: `toggleEmailWatch` is **gone**; `startEmailWatch` and `stopEmailWatch` exist.
- `CalendarsView.tsx` imports: includes `startEmailWatch`, `stopEmailWatch`, `RefreshCw`; **no** `toggleEmailWatch`.
- The text-column Sync `<button>` is removed; a new icon-button sits beside `<DropdownMenu>`.
- Color picker calls invalidate both `["calendars"]` and `["events"]`.
- Watch-inbox row shows On / Off / Starting scan… / Stopping…; Switch is `disabled` while `watchPending`.
- `BACKEND_API.md` has the two new `/email-watch/start` and `/email-watch/stop` endpoints and the updated color-cascade note.
