

# Fuse Calendar — Implementation Plan

## Overview
A mobile-first unified smart calendar app with mock data, ready for backend integration. All calendar/email integrations use a mock service layer — no real API calls.

---

## Phase 1: Foundation
- Set up folder structure (`/components/calendar`, `/inbox`, `/calendars`, `/shared`, `/services`, `/hooks`, `/types`, `/styles`)
- Define TypeScript types (`Event`, `CalendarConnection`, `UserSettings`) in `/types/index.ts`
- Create `/styles/theme.css` with CSS variables for brand colors, source calendar colors (Google blue, Apple coral, Outlook teal), and pastel palette
- Apply design system: Inter font, 16px rounded corners, soft shadows, WCAG AA contrast, 56px min tap targets
- Set up Supabase auth (email/password + Google OAuth)

## Phase 2: Service Layer & Mock Data
- Build `/services/api.ts` with all specified functions returning rich mock data
- 3 connected sources (Google synced, Apple synced, Outlook error state)
- 5 events across the week with meeting links, timezone differences, attendees
- 2 pending email-detected events in inbox
- Wire everything through TanStack Query custom hooks (`useEvents`, `useCalendars`, `usePendingInbox`, `useUserSettings`)

## Phase 3: Shared Components
- **EventCard** — color bar, title, time, source chip, join button (Zoom/Teams/Meet icons), location, email-detected badge
- **EventDetailSheet** — full bottom sheet with all 7 sections (header, time/timezone, join meeting, location, people with RSVP, description, actions)
- **SourceBadge**, **JoinButton**, **TimezoneDisplay**, **ConfirmDialog** (for destructive actions)
- Skeleton loading states for all data-driven components
- Warm illustrated empty states

## Phase 4: Navigation & Layout
- Bottom tab bar (mobile) with 5 tabs: Today, Week, Month, Inbox, Calendars
- Top nav bar (desktop)
- Profile/Settings accessible from nav
- React Router routes for all screens

## Phase 5: Today View
- Large date header + timezone pill
- Email invitation banner (yellow, links to Inbox)
- Events grouped by All Day / Morning / Afternoon / Evening
- Pull-to-refresh sync gesture
- Floating "+" button for new event creation
- Empty state: "Nothing scheduled today. Enjoy your day ☀️"

## Phase 6: Week & Month Views
- **Week**: 7-column swipeable grid, color-coded time blocks, red current-time line, join icon badges, tap-to-create on empty slots
- **Month**: Swipeable month grid, colored dots per day (one per source), today highlight, tap day → bottom drawer with event cards

## Phase 7: Inbox (Email Intelligence Center)
- Two tabs: Pending Review / Already Added
- Pending cards: detected title, time with dual timezones, source email, detection method badge, detail preview grid, Add/Dismiss buttons
- "Add to Calendar" triggers calendar picker before confirming
- Already Added: list with swipe-to-remove
- Empty state: "No new invitations. We'll watch your inbox for you. 👀"

## Phase 8: Calendars (Sources & Privacy)
- **Connected sources list**: logo, email, connection type badge, color swatch picker (8 pastels), show/hide toggle, sync status as friendly sentences, expandable sub-calendars, swipe to disconnect
- **Add a Source**: 2×3 card grid (Google, Outlook, Apple with app-password explainer modal, Gmail email-only, CalDAV form, Coming Soon)
- **Privacy section**: expandable plain-English data explanation, Download Data button, Delete Everything with type-to-confirm

## Phase 9: Settings/Profile
- Avatar, name, email
- Home timezone searchable dropdown
- Organizer timezone toggle, default calendar, first day of week, email detection sensitivity toggle
- Dark mode toggle
- Sign out

## Phase 10: Onboarding Flow
- 4-step flow: Welcome → Sign Up/In → Connect First Source → Timezone Confirmation
- Skip options where appropriate
- Privacy messaging throughout

