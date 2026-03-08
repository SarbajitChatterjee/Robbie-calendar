

# Two Tasks: STRUCTURE.md + Code Comments & Cleanup

## Task 1: Create `STRUCTURE.md`

Create a senior-developer-grade project guide that covers:

- **Project overview** — what Robbie is, tech stack, how to run it
- **Folder tree** with annotations explaining every directory and key file
- **Architecture diagram** (ASCII) showing data flow: Components → Hooks → Service Layer → Mock/Backend
- **Service layer contract** — explain that `src/services/api.ts` is the ONLY file the backend engineer touches
- **Design system rules** — tap targets, font sizes, color management via CSS variables, WCAG compliance
- **Adding a new feature checklist** — step-by-step for a developer joining the project
- **Conventions** — naming, file size limits, no inline styles, Tailwind only, etc.

Written in a clear, authoritative tone with practical examples — not generic boilerplate.

---

## Task 2: Add Code Comments & Remove Redundant Code

### Comments to add (concise, purposeful — no noise):
- **File-level doc comments** on every component/hook/service file explaining its role
- **Section comments** on non-obvious logic (event grouping, timezone formatting, mock data shape)
- **JSDoc on exported functions** in hooks and shared components
- **Inline notes** where design decisions matter (e.g., why `HOUR_HEIGHT = 60`, why attendees capped at 5)

### Redundant code to remove:
- `src/App.css` — contains leftover Vite starter styles (logo spin, `.card`, `.read-the-docs`). Completely unused by the app. Delete it.
- `src/components/NavLink.tsx` — a `NavLink` wrapper component that is never imported anywhere in the codebase. Delete it.
- Remove the `App.css` import from `src/main.tsx` if present.

### Files to comment (all non-UI-library files):
1. `src/services/api.ts` — file header, section dividers for mock data vs API functions
2. `src/types/index.ts` — doc comments on each interface and non-obvious fields
3. `src/hooks/useEvents.ts`, `useCalendars.ts`, `useUserSettings.ts` — JSDoc on each hook
4. `src/components/layout/AppLayout.tsx` — section comments for nav, tabs, mobile bar
5. `src/components/calendar/TodayView.tsx` — grouping logic, banner, FAB
6. `src/components/calendar/WeekView.tsx` — grid constants, event positioning math
7. `src/components/calendar/MonthView.tsx` — week generation, dot logic
8. `src/components/inbox/InboxView.tsx` — pending/accepted state, PendingCard
9. `src/components/calendars/CalendarsView.tsx` — source configs, sections A/B/C
10. `src/pages/Settings.tsx` — settings layout
11. `src/components/shared/*` — all shared components (EventCard, EventDetailSheet, JoinButton, SourceBadge, TimezoneDisplay, EmptyState, EventSkeleton, ConfirmDialog)
12. `src/App.tsx` — provider stack explanation
13. `src/pages/Index.tsx` — entry point note

