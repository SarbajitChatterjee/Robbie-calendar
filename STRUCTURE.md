# Robbie — Project Architecture Guide

> **Audience:** Any developer joining this project.  
> **Last updated:** March 2026  
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
| Backend (planned) | Supabase (PostgreSQL + RLS + Edge Functions) |

### Running Locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # Production build
npm run test       # Vitest
```

---

## 2. Folder Tree

```
src/
├── App.tsx                    # Root component. Wraps the app in providers (QueryClient, Tooltip, Toasters, Router).
├── main.tsx                   # Entry point. Mounts <App /> to #root.
├── index.css                  # Tailwind directives + design system tokens (light/dark).
│
├── types/
│   └── index.ts               # ALL shared TypeScript interfaces. Single source of truth for data shapes.
│
├── services/
│   └── api.ts                 # ⭐ SERVICE LAYER. The ONLY file the backend engineer touches.
│                              #    Returns mock data now; swap to real HTTP calls later.
│                              #    Every function has a JSDoc with the intended REST endpoint.
│
├── hooks/
│   ├── useEvents.ts           # TanStack Query hooks for calendar events + pending inbox.
│   ├── useCalendars.ts        # TanStack Query hook for calendar connections.
│   └── useUserSettings.ts     # TanStack Query hook for user preferences.
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
│   ├── Index.tsx              # Route "/" — renders <AppLayout />.
│   ├── Settings.tsx           # Settings view — timezone, display, email detection preferences.
│   └── NotFound.tsx           # 404 catch-all.
│
├── styles/
│   └── theme.css              # Extended design tokens (source colors, pastels, platform colors).
│
└── lib/
    └── utils.ts               # Tailwind `cn()` merge utility.
```

### What goes where?

| I need to… | Put it in… |
|:-----------|:-----------|
| Add a new data type | `src/types/index.ts` |
| Add a new API call | `src/services/api.ts` (mock first, real later) |
| Add a new data-fetching hook | `src/hooks/` |
| Add a new tab/view | `src/components/<domain>/` + register in `AppLayout.tsx` |
| Add a reusable UI piece | `src/components/shared/` |
| Add a new page route | `src/pages/` + register in `App.tsx` |
| Change colors/tokens | `src/index.css` (core) or `src/styles/theme.css` (extended) |

---

## 3. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────┐
│                    React Components                  │
│  (TodayView, WeekView, MonthView, InboxView, etc.)  │
└──────────────────────┬──────────────────────────────┘
                       │ call hooks
                       ▼
┌─────────────────────────────────────────────────────┐
│                   Custom Hooks                       │
│  useWeekEvents()  usePendingInbox()  useCalendars() │
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
│  ⭐ THE ONLY FILE THE BACKEND ENGINEER MODIFIES      │
│                                                      │
│  Currently: returns mock data with simulated delay   │
│  Future:    HTTP calls to Supabase / REST API        │
│                                                      │
│  Each function has a JSDoc with the intended         │
│  REST endpoint (e.g., GET /api/events?start=&end=)   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Backend / API   │
              │  (not yet wired) │
              └─────────────────┘
```

### Key Principle: Components never call `fetch()` directly.

Every component gets data through hooks. Every hook calls a function in `api.ts`. This means:

1. **Swapping mock → real** requires changing only `api.ts`.
2. **Caching strategy** lives in the hooks layer (TanStack Query).
3. **Components stay pure UI** — they receive data and render it.

---

## 4. Service Layer Contract

`src/services/api.ts` is the integration boundary. Here's how it works:

```typescript
// Every function follows this pattern:

/** GET /api/events?start=&end=&timezone= */          // ← Intended endpoint
export async function getEventsForDateRange(           // ← Typed signature
  _start: Date,
  _end: Date
): Promise<CalendarEvent[]> {                          // ← Returns domain types
  await delay();                                       // ← Simulated latency
  return MOCK_EVENTS;                                  // ← Replace with fetch()
}
```

**Rules for the backend engineer:**

1. Keep the function signatures identical.
2. Replace mock data with real HTTP calls.
3. Throw standard errors — the hooks/components handle loading and error states via TanStack Query.
4. Do not import React or any UI code in this file.

---

## 5. Design System

### Tokens (CSS Custom Properties)

All visual values live in two files:

| File | Contains |
|:-----|:---------|
| `src/index.css` | Core shadcn tokens (background, foreground, primary, etc.) + Robbie-specific tokens (fuse-primary, source colors, status, surfaces, radii) |
| `src/styles/theme.css` | Extended tokens (pastel palette, platform colors) |

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

## 6. Adding a New Feature — Checklist

Follow this checklist when adding any new feature:

### Step 1: Define the data shape
- [ ] Add/update interfaces in `src/types/index.ts`
- [ ] Add JSDoc comments explaining non-obvious fields

### Step 2: Add the service function
- [ ] Add a mock function in `src/services/api.ts`
- [ ] Include the intended REST endpoint as a JSDoc comment
- [ ] Use the `delay()` helper to simulate network latency

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

## 7. Conventions

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

## 8. Testing

```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```

- Test files live alongside source: `src/test/` or co-located `*.test.ts`.
- Framework: Vitest + jsdom.
- Focus tests on: service layer logic, hook behavior, utility functions.
- UI components: test interaction logic, not visual rendering.

---

## 9. Key Design Decisions (and why)

| Decision | Rationale |
|:---------|:----------|
| **Mock-first service layer** | Enables frontend development without a backend. Backend engineer swaps mocks for real calls without touching UI code. |
| **TanStack Query over `useEffect`** | Built-in caching, deduplication, background refetch, loading/error states. Eliminates boilerplate. |
| **CSS variables over Tailwind theme** | Enables runtime theme switching (dark mode) and keeps the design system in one place. |
| **Bottom sheets over modals** | Mobile-first UX pattern. Sheets feel natural on touch devices and degrade gracefully on desktop. |
| **`HOUR_HEIGHT = 60px`** in WeekView | 1px per minute. Makes time-to-pixel math trivial: `top = minutes * 1`. |
| **Attendees capped at 5** in detail sheet | Prevents layout overflow. "Show all" link handles the long tail. |
| **Event dots capped at 3** in MonthView | More than 3 dots become indistinguishable at small sizes. |

---

*This document is the source of truth for project architecture. Keep it updated when making structural changes.*
