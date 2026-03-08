# 🗓️ Robbie

A high-performance, unified calendar aggregator that merges **Google Calendar, Apple iCloud, Microsoft Outlook, and any CalDAV source** into a single intelligent interface—complete with automatic event detection from email inboxes.

---

## ✨ Key Features

* **Multi-Source View:** Aggregates events from multiple providers into a single, cohesive view (Day, Week, Month).
* **Inbox Intelligence:** Watches connected Gmail and Outlook inboxes for meeting invitations and booking confirmations, surfacing them as suggested events before they hit your calendar.
* **Timezone Normalization:** Synchronizes timezones across all sources, displaying events in your local timezone alongside the original organizer's timezone.
* **Auto-Extraction:** Automatically extracts meeting links (Zoom, Teams, Google Meet), attendee lists, and RSVP statuses.

---

## 🛠️ Tech Stack

`ASP.NET Core` • `React` • `TypeScript` • `Vite` • `Supabase (PostgreSQL + RLS)` • `TanStack Query`

---

## 🔌 Integrations

| Source | Protocol | Auth |
| :--- | :--- | :--- |
| **Google Calendar + Gmail** | REST / Gmail API | OAuth 2.0 |
| **Microsoft Outlook + Mail** | Microsoft Graph | OAuth 2.0 |
| **Apple iCloud Calendar** | CalDAV | App-Specific Password |
| **Any CalDAV server** | CalDAV | Basic Auth |

---

## 🛡️ Security & Architecture

The system is built on four core architectural principles:

* **Privacy First:** Event content is **never persisted**. Data is fetched live, and only connection tokens are stored.
* **Hardened Encryption:** All tokens are **AES-256 encrypted** at rest via **Supabase Vault**.
* **Database Security:** Row-Level Security (RLS) is active on every table, enforced strictly at the database layer.
* **Clean API Contract:** A single `api.ts` service contract ensures the frontend remains decoupled from backend logic.

---

> [!IMPORTANT]
> **Data Governance:** This application does not cache your calendar data. We act as a secure proxy to ensure your schedule remains private and under your control at all times.

---
