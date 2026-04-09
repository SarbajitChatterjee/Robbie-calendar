# Robbie — Project Architecture Guide

> **Audience:** Any developer joining this project.  
> **Last updated:** April 2026  
> **Maintainer:** Core team

---

## 1. What is Robbie?

Robbie is a **unified calendar aggregator** that merges events from Google Calendar, Apple iCloud, Microsoft Outlook, and any CalDAV source into a single interface. It also watches connected email inboxes for meeting invitations and booking confirmations, surfacing them as suggested events before they hit your calendar.

### Tech Stack

| Layer | Technology |
|:------|:-----------|
| Framework | React 18 + TypeScript |
| Build | Vite (SWC) |
| Styling | Tailwind CSS + CSS custom properties |
| UI Components | shadcn/ui (Radix primitives) |
| Data Fetching | TanStack Query (React Query v5) |
| Routing | React Router v6 |
| Date Library | date-fns v3 |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| Backend API | FastAPI (Python) — deployed on Render |

### Running Locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (single run)
npm run test:watch # Vitest (watch mode)
```

---

## 2. Folder Tree

```
src/
├── App.tsx                    # Root component. Providers + Router + AuthGuard. Contains /auth and /auth/confirm routes.
├── main.tsx                   # Entry point. Mounts <App /> to #root.
├── index.css                  # Tailwind directives + design system tokens (light/dark).
│
├── types/
│   └── index.ts               # ALL shared TypeScript interfaces. Single source of truth for data shapes.
│
├── services/
│   └── api.ts                 # ⭐ REST API CLIENT. The ONLY file that calls the FastAPI backend.
│                              #    Uses apiFetch() — a typed fetch wrapper that attaches the Bearer token.
│                              #    Every function has a JSDoc with its REST endpoint.
│
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase JS client. Auto-generated — do not edit.
│       └── types.ts           # Generated DB types from Supabase CLI — do not edit.
│
├── hooks/
│   ├── useEvents.ts           # TanStack Query hooks for calendar events + pending inbox → calls api.ts
│   ├── useCalendars.ts        # TanStack Query hook for calendar connections → calls api.ts
│   ├── useUserSettings.ts     # Reads/writes user_settings directly via Supabase (not via backend)
│   ├── useTimezones.ts        # Fetches timezone reference data directly via Supabase (staleTime: Infinity)
│   └── use-mobile.tsx         # Responsive breakpoint hook (returns boolean for mobile viewport)
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx      # Shell: desktop top nav + mobile bottom tab bar + content area.
│   │
│   ├── calendar/
│   │   ├── TodayView.tsx      # "Today" tab — groups events by time-of-day (morning/afternoon/evening).
│   │   ├── WeekView.tsx       # "Week" tab — 7-day hourly grid with event blocks.
│   │   └── MonthView.tsx      # "Month" tab — calendar grid with event dots + day drawer.
│   │
│   ├── inbox/
│   │   └── InboxView.tsx      # "Inbox" tab — pending email-detected events, accept/dismiss flow.
│   │
│   ├── calendars/
│   │   └── CalendarsView.tsx  # "Calendars" tab — connected sources, add source cards, privacy section.
│   │
│   ├── shared/                # Reusable components used across multiple views.
│   │   ├── EventCard.tsx      # Summary card for a single event (used in Today, Month drawer).
│   │   ├── EventDetailSheet.tsx # Bottom sheet with full event details + actions.
│   │   ├── JoinButton.tsx     # "Join Meeting" button with platform-specific styling.
│   │   ├── SourceBadge.tsx    # Colored pill showing calendar source (Google, Apple, etc.).
│   │   ├── TimezoneDisplay.tsx # Timezone comparison display + pill component.
│   │   ├── EmptyState.tsx     # Emoji + title + subtitle for empty views.
│   │   ├── EventSkeleton.tsx  # Loading skeleton for event lists.
│   │   └── ConfirmDialog.tsx  # Generic confirmation dialog (delete, destructive actions).
│   │
│   └── ui/                    # ⛔ DO NOT EDIT. Auto-generated shadcn/ui components.
│
├── pages/
│   ├── Auth.tsx               # Login + Signup page. Two tabs — email/password auth via Supabase.
│   ├── AuthConfirm.tsx        # Email confirmation handler. Writes user_settings row on first login.
│   ├── Index.tsx              # Route "/" — renders <AppLayout />. Protected by AuthGuard.
│   ├── Settings.tsx           # User preferences — timezone, display, email detection. Protected by AuthGuard.
│   └── NotFound.tsx           # 404 catch-all.
│
├── test/
│   ├── example.test.ts        # Example test file.
│   └── setup.ts               # Vitest setup (jsdom environment).
│
└── lib/
    ├── utils.ts               # Tailwind `cn()` merge utility.
    └── timezone-utils.ts      # UTC offset parsing, timezone formatting helpers for DB-driven timezone records.
```

### What goes where?

| I need to… | Put it in… |
|:-----------|:-----------|
| Add a new data type | `src/types/index.ts` |
| Add a new backend API call | `src/services/api.ts` |
| Add a call that reads Supabase directly | `src/hooks/` (see `useUserSettings.ts` as a pattern) |
| Add a new data-fetching hook | `src/hooks/` |
| Add a new tab/view | `src/components/<domain>/` + register in `AppLayout.tsx` |
| Add a reusable UI piece | `src/components/shared/` |
| Add a new page route | `src/pages/` + register in `App.tsx` |
| Change colors/tokens | `src/index.css` |

---

## 3. Architecture & Data Flow

There are **two data paths** in this app depending on what is being fetched:

### Path A — Calendar & Event data (via FastAPI backend)

```
┌─────────────────────────────────────────────────────┐
│                    React Components                  │
│  (TodayView, WeekView, MonthView, InboxView, etc.)  │
└──────────────────────┬──────────────────────────────┘
                       │ call hooks
                       ▼
┌─────────────────────────────────────────────────────┐
│           Custom Hooks (useEvents, useCalendars)     │
│                                                      │
│  Wraps TanStack Query:                               │
│  • Caching, deduplication, background refetch        │
│  • Returns { data, isLoading, error }                │
└──────────────────────┬──────────────────────────────┘
                       │ call service functions
                       ▼
┌─────────────────────────────────────────────────────┐
│              Service Layer  (api.ts)                 │
│                                                      │
│  ⭐ THE ONLY FILE THAT CALLS THE FASTAPI BACKEND     │
│                                                      │
│  apiFetch() attaches the Supabase JWT as Bearer      │
│  token on every request.                             │
│                                                      │
│  Each function has a JSDoc with its REST endpoint.   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Bearer token)
                       ▼
              ┌─────────────────────────┐
              │  FastAPI Backend         │
              │  (Render)               │
              │                         │
              │  Validates JWT via JWKS  │
              │  Queries Supabase DB     │
              └─────────────────────────┘
```

### Path B — Auth, Settings & Timezone data (direct Supabase)

```
┌──────────────────────────────────────────────────────┐
│  Components (Auth, Settings, AuthConfirm, etc.)      │
└──────────────────────┬───────────────────────────────┘
                       │ call hooks
                       ▼
┌──────────────────────────────────────────────────────┐
│  useUserSettings / useTimezones / supabase.auth.*    │
│                                                      │
│  These hooks call Supabase directly — they do NOT    │
│  go through api.ts or the FastAPI backend.           │
└──────────────────────┬───────────────────────────────┘
                       │ Supabase JS client
                       ▼
              ┌─────────────────────────┐
              │  Supabase               │
              │  (PostgreSQL + RLS)     │
              └─────────────────────────┘
```

### Key Principle: Components never call `fetch()` directly.

Every component gets data through hooks. Event and calendar data flows through `api.ts`. Auth, settings, and timezone data goes straight to Supabase. This means:

1. **Backend integration** is isolated to `api.ts` — changing the backend URL or response shape only touches that file.
2. **Caching strategy** lives in the hooks layer (TanStack Query).
3. **Components stay pure UI** — they receive data and render it.

---

## 4. Service Layer Contract

`src/services/api.ts` is the integration boundary for the FastAPI backend. Every function maps to a REST endpoint and uses the shared `apiFetch()` helper:

```typescript
// Core pattern — every function follows this:

/** GET /events?start=<ISO>&end=<ISO> */
export async function getEventsForDateRange(
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  return apiFetch(
    "GET",
    `/events?start=${start.toISOString()}&end=${end.toISOString()}`
  );
}
```

`apiFetch()` handles:
- Prepending `VITE_API_BASE_URL` to the path
- Attaching `Authorization: Bearer <token>` from `localStorage`
- Parsing JSON and throwing typed errors on non-2xx responses
- Returning `undefined` cleanly for `204 No Content`

**Rules for anyone modifying `api.ts`:**

1. Keep function signatures identical — hooks and components depend on them.
2. Use `apiFetch()` for all calls — do not call `fetch()` directly.
3. Throw standard errors — TanStack Query in the hooks layer handles loading and error states.
4. Do not import React or any UI code in this file.

For the full endpoint list and expected request/response shapes, see `BACKEND_API.md`.

---

## 5. Authentication Flow

Authentication is handled entirely by Supabase Auth. The `AuthGuard` component in `App.tsx`:

1. Listens to `supabase.auth.onAuthStateChange`
2. On login, writes the Supabase JWT to `localStorage` under `"auth_token"` so `api.ts` can attach it as a Bearer token
3. On logout, removes the token from `localStorage`
4. Redirects unauthenticated users to `/auth`
5. Redirects authenticated users away from `/auth`

On first login (after email confirmation), `AuthConfirm.tsx` reads `user_metadata` from the session and writes the initial `user_settings` row to Supabase.

---

## 6. Design System

### Tokens (CSS Custom Properties)

All visual values live in one file:

| File | Contains |
|:-----|:---------|
| `src/index.css` | All design tokens — shadcn core (background, foreground, primary, etc.) + Robbie-specific (fuse-primary, source colors, status, surfaces, platform colors, radii) |

**Never hardcode colors in components.** Use semantic tokens:

```tsx
// ✅ Correct
className="text-foreground bg-card"
className="bg-[hsl(var(--fuse-primary))]"
className="text-[hsl(var(--status-success))]"

// ❌ Wrong
className="text-black bg-white"
className="bg-orange-500"
```

### Layout Constants

| Token | Value | Purpose |
|:------|:------|:--------|
| `--min-tap` | `3.5rem` (56px) | Minimum touch target. All interactive elements must meet this. |
| `--radius-card` | `1rem` (16px) | Border radius for cards and sheets. |
| `--radius-button` | `0.75rem` (12px) | Border radius for buttons. |
| `--radius-pill` | `9999px` | Fully rounded badges and pills. |

### Typography

- **Font:** Inter (loaded from Google Fonts).
- **Title size:** 28px (`text-[28px]`) for view headers.
- **Body:** 14px (Tailwind default `text-sm`).
- **Caption:** 12px (`text-xs`).
- **Antialiasing:** Enabled globally via `-webkit-font-smoothing: antialiased`.

### Shadows (Elevation)

Two levels defined as CSS variables:
- `--shadow-soft`: `0 2px 8px` — default card resting state.
- `--shadow-medium`: `0 4px 16px` — hover / active elevation.

### Dark Mode

- Class-based (`darkMode: ["class"]` in Tailwind config).
- All core tokens have `.dark` overrides in `index.css`.
- **Do not use** `dark:` Tailwind modifiers — the token system handles it automatically.

---

## 7. Adding a New Feature — Checklist

### Step 1: Define the data shape
- [ ] Add/update interfaces in `src/types/index.ts`
- [ ] Add JSDoc comments explaining non-obvious fields

### Step 2: Add the service function
- [ ] Add the function to `src/services/api.ts` using `apiFetch()`
- [ ] Include the REST endpoint as a JSDoc comment above the function

### Step 3: Create the hook
- [ ] Add a TanStack Query hook in `src/hooks/`
- [ ] Use a descriptive, unique `queryKey`
- [ ] Export the hook as a named export

### Step 4: Build the component
- [ ] Create the component in the appropriate `src/components/<domain>/` folder
- [ ] Use only semantic tokens for colors (no hardcoded values)
- [ ] Ensure all tap targets meet `--min-tap` (56px)
- [ ] Use existing shared components (`EventCard`, `EmptyState`, etc.) where applicable

### Step 5: Wire it up
- [ ] Register the view in `AppLayout.tsx` if it's a new tab
- [ ] Register the route in `App.tsx` if it's a new page

### Step 6: Comment your code
- [ ] Add a file-level doc comment explaining the component's purpose
- [ ] Add inline comments on non-obvious logic

---

## 8. Conventions

### Naming
- **Files:** PascalCase for components (`TodayView.tsx`), camelCase for hooks/services (`useEvents.ts`, `api.ts`).
- **Components:** Named exports for shared components, default exports for page-level views.
- **CSS classes:** Tailwind utility classes only. No custom CSS classes in components.

### Code Style
- **No inline styles** except for dynamic values (event positioning, colors from data).
- **No `any` types.** Every variable and parameter is typed.
- **Prefer composition** over prop drilling. Use hooks for data, props for configuration.
- **Keep components small.** If a component exceeds ~150 lines, extract sub-components.

### Imports
- Use `@/` path alias for all imports (maps to `src/`).
- Group imports: React → third-party → hooks → types → components.

### File Size Limits
- **Components:** Target < 150 lines. Extract helpers and sub-components.
- **Service layer:** If `api.ts` exceeds ~400 lines, split into domain files (`eventService.ts`, `calendarService.ts`).
- **Types:** Keep in a single file until it exceeds ~200 lines.

---

## 9. Testing

```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```

- Test files live in `src/test/` or co-located as `*.test.ts`.
- Framework: Vitest + jsdom.
- Focus tests on: service layer logic, hook behavior, utility functions.
- UI components: test interaction logic, not visual rendering.

---

## 10. Key Design Decisions (and why)

| Decision | Rationale |
|:---------|:----------|
| **Single REST client (`api.ts`)** | All backend calls go through one file. Changing the backend URL, auth scheme, or response shape only touches `api.ts` — zero component changes needed. |
| **Direct Supabase for auth/settings/timezones** | These are user-scoped, low-frequency reads with no business logic. Going direct to Supabase keeps the backend lean and avoids unnecessary round-trips. |
| **TanStack Query over `useEffect`** | Built-in caching, deduplication, background refetch, loading/error states. Eliminates boilerplate. |
| **CSS variables over Tailwind theme** | Enables runtime theme switching (dark mode) and keeps the design system in one place. |
| **Bottom sheets over modals** | Mobile-first UX pattern. Sheets feel natural on touch devices and degrade gracefully on desktop. |
| **`HOUR_HEIGHT = 60px`** in WeekView | 1px per minute. Makes time-to-pixel math trivial: `top = minutes * 1`. |
| **Attendees capped at 5** in detail sheet | Prevents layout overflow. "Show all" link handles the long tail. |
| **Event dots capped at 3** in MonthView | More than 3 dots become indistinguishable at small sizes. |

---

*This document is the source of truth for project architecture. Keep it updated when making structural changes.*
