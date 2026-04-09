# 🗓️ Robbie

A high-performance, unified calendar aggregator that merges **Google Calendar, Apple iCloud, Microsoft Outlook, and any CalDAV source** into a single intelligent interface — complete with automatic event detection from connected email inboxes.

---

## 🛠️ Tech Stack

`FastAPI (Python)` • `React 18` • `TypeScript` • `Vite (SWC)` • `Supabase (PostgreSQL + RLS)` • `TanStack Query` • `Tailwind CSS` • `shadcn/ui`

---

## ✨ Key Features

- **Multi-Source View:** Aggregates events from multiple providers into a single cohesive view (Today, Week, Month).
- **Inbox Intelligence:** Watches connected Gmail and Outlook inboxes for meeting invitations and booking confirmations, surfacing them as suggested events before they hit your calendar.
- **Timezone Normalization:** Synchronizes timezones across all sources, displaying events in your local timezone alongside the original organizer's timezone.
- **Auto-Extraction:** Automatically extracts meeting links (Zoom, Teams, Google Meet), attendee lists, and RSVP statuses.

---

## 🔌 Integrations

| Source | Protocol | Auth | Status |
| :--- | :--- | :--- | :--- |
| **Google Calendar + Gmail** | REST / Gmail API | OAuth 2.0 | ✅ Live |
| **Microsoft Outlook + Mail** | Microsoft Graph | OAuth 2.0 | 🔜 Planned |
| **Apple iCloud Calendar** | CalDAV | App-Specific Password | 🔜 Planned |
| **Any CalDAV server** | CalDAV | Basic Auth | 🔜 Planned |

---

## 🏗️ Architecture Overview

```
Frontend (React + TypeScript)
    ├── src/integrations/supabase/   ← Direct Supabase calls (auth, settings, timezones)
    └── src/services/api.ts          ← Backend REST calls (events, calendar connections)
          └── Hooks (TanStack Query)
                └── Components

Backend (FastAPI + Python)           ← Deployed on Render
    ├── /api/events                  ← Event fetching
    ├── /api/calendars               ← Calendar connection management
    └── /api/calendars/connect/oauth ← Google OAuth flow

Database (Supabase / PostgreSQL)
    ├── events
    ├── calendar_connections
    ├── sub_calendars
    ├── user_settings
    ├── timezone
    └── users
```

> **Note on direct Supabase access:** Authentication, user settings, and timezone lookups bypass the FastAPI backend and hit Supabase directly from the frontend. All calendar and event data flows through the backend API.

For the full architecture breakdown — data flow, folder structure, design system, and conventions — see [`STRUCTURE.md`](./STRUCTURE.md).

For the full backend API contract — all endpoints, request/response shapes, SQL DDL, and column mappings — see [`BACKEND_API.md`](./BACKEND_API.md).

---

## 🎨 A Note on the Frontend

The visual interface and component structure of this application (approximately 99%) was built using **[Lovable](https://lovable.dev)**, an AI-powered frontend builder. The product vision, UX decisions, information architecture, and all backend engineering were done independently.

Lovable accelerated the frontend significantly. The design system, component hierarchy, API contract, and data architecture were all deliberately designed — Lovable was the tool used to execute that vision quickly.

For Backend — see **[Robbie-Calendar-backend](https://github.com/SarbajitChatterjee/Robbie-calendar-backend)**.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend API running locally or pointed at the deployed instance

### Installation

```bash
npm install
# or
bun install
```

### Environment Setup

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=https://your-backend-url.com/api
```

> The backend is currently deployed at `https://robbie-calendar-backend.onrender.com`.  
> If `VITE_API_BASE_URL` is not set, it defaults to `/api` (same-origin reverse proxy).

### Running Locally

```bash
npm run dev          # Starts at http://localhost:8080
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

---

## 🔒 Security & Privacy

- **No event caching:** Event content is never persisted. Data is fetched live — only connection tokens are stored.
- **AES-256 encryption:** All OAuth tokens are encrypted at rest using Fernet symmetric encryption before being written to the database.
- **Row-Level Security (RLS):** Active on every Supabase table. Users can only access their own data, enforced at the database layer.
- **JWT validation:** Every API request is verified against Supabase's JWKS endpoint before any data is touched.
- **AuthGuard:** All protected routes are wrapped in an `AuthGuard` component that listens to `onAuthStateChange`, keeps the Supabase JWT synced to `localStorage` as a Bearer token, and redirects unauthenticated users to `/auth`.

> **Data Governance:** This application acts as a secure proxy. Your calendar data is never stored or sold.

---

## 📂 Project Structure (Quick Reference)

```
src/
├── types/index.ts                    # All shared TypeScript interfaces (single source of truth)
├── services/api.ts                   # ⭐ REST API client — the ONLY file that calls the backend
├── integrations/supabase/
│   ├── client.ts                     # Supabase JS client (auto-generated, do not edit)
│   └── types.ts                      # Generated DB types
├── hooks/
│   ├── useEvents.ts                  # TanStack Query hooks for events + pending inbox
│   ├── useCalendars.ts               # Hook for calendar connections
│   ├── useUserSettings.ts            # Reads/writes user_settings directly via Supabase
│   ├── useTimezones.ts               # Fetches timezone reference data directly via Supabase
│   └── use-mobile.tsx                # Responsive breakpoint hook
├── components/
│   ├── calendar/                     # TodayView, WeekView, MonthView
│   ├── inbox/                        # InboxView (email-detected events)
│   ├── calendars/                    # CalendarsView (connected sources)
│   ├── shared/                       # EventCard, EventDetailSheet, JoinButton, etc.
│   └── ui/                           # ⛔ shadcn/ui — do not edit
├── pages/
│   ├── Auth.tsx                      # Login + Signup page (Supabase auth)
│   ├── AuthConfirm.tsx               # Email confirmation handler → writes user_settings on first login
│   ├── Index.tsx                     # Main app shell (protected)
│   ├── Settings.tsx                  # User preferences (protected, Supabase direct)
│   └── NotFound.tsx                  # 404 catch-all
└── lib/
    ├── utils.ts                      # Tailwind cn() merge utility
    └── timezone-utils.ts             # UTC offset parsing and timezone display formatting helpers
```

Full breakdown with what-goes-where table and conventions → [`STRUCTURE.md`](./STRUCTURE.md)

---

## 📚 Documentation Index

| File | Contents |
| :--- | :--- |
| `README.md` | This file — project overview, setup, security |
| [`STRUCTURE.md`](./STRUCTURE.md) | Frontend architecture, folder tree, design system, conventions |
| [`BACKEND_API.md`](./BACKEND_API.md) | REST API contract, SQL DDL, JSON shapes, column mappings |

---

> [!IMPORTANT]
> **Data Governance:** This application does not cache your calendar data. We act as a secure proxy to ensure your schedule remains private and under your control at all times.

---
