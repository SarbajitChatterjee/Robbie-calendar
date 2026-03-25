/**
 * Robbie — Frontend Service Layer (REST API Client)
 *
 * This file is the ONLY place the frontend makes HTTP calls.
 * Every function maps 1:1 to a backend REST endpoint.
 *
 * ── Architecture ──────────────────────────────────────────────
 *   React Component → TanStack Query Hook → this file → Backend REST API → Database
 *
 * The frontend has ZERO knowledge of the database schema, SQL, or ORM.
 * All data shaping, validation, and persistence happens server-side.
 *
 * ── Configuration ─────────────────────────────────────────────
 *   Set VITE_API_BASE_URL in your .env file:
 *     VITE_API_BASE_URL=https://your-backend.example.com/api
 *
 *   If not set, defaults to "/api" (same-origin reverse proxy).
 *
 * ── Authentication ────────────────────────────────────────────
 *   Every request attaches a Bearer token from localStorage ("auth_token").
 *   The backend is responsible for validating this token and extracting
 *   the user identity. See BACKEND_API.md for the full contract.
 *
 * ── For Backend Engineers ─────────────────────────────────────
 *   See BACKEND_API.md at the project root for:
 *     • Every endpoint this frontend calls (method, path, request, response)
 *     • SQL DDL for all required tables
 *     • Expected JSON response shapes
 */

import {
  CalendarEvent,
  CalendarConnection,
  UserSettings,
  Timezone,
} from "@/types";

import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

/** Base URL for all API requests. Reads from env or defaults to same-origin "/api". */
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "/api";

// ─────────────────────────────────────────────
// Core HTTP Helper
// ─────────────────────────────────────────────

/**
 * Centralized fetch wrapper used by every API function below.
 *
 * - Prepends API_BASE_URL to the path
 * - Attaches Authorization header if a token exists
 * - Parses JSON response and throws on non-2xx status
 * - Returns typed data matching the frontend interfaces
 *
 * @param method  HTTP method (GET, POST, PATCH, DELETE)
 * @param path    Endpoint path, e.g. "/events" or "/calendars/123/color"
 * @param body    Optional request body (automatically JSON-stringified)
 * @returns       Parsed JSON response, typed as T
 * @throws        Error with the server's error message on failure
 */
async function apiFetch<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  /* If the server returned an error, try to extract a meaningful message */
  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) message = errorBody.error;
      else if (errorBody?.message) message = errorBody.message;
    } catch {
      /* Response body wasn't JSON — use the default status message */
    }
    throw new Error(message);
  }

  /* DELETE endpoints may return 204 No Content */
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ─────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────

/**
 * GET /events?start=<ISO>&end=<ISO>
 * Fetches all confirmed events within a date range.
 */
export async function getEventsForDateRange(
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  return apiFetch(
    "GET",
    `/events?start=${start.toISOString()}&end=${end.toISOString()}`
  );
}

/**
 * GET /events/pending
 * Fetches events detected from email that are awaiting user review.
 */
export async function getPendingEmailEvents(): Promise<CalendarEvent[]> {
  return apiFetch("GET", "/events/pending");
}

/**
 * POST /events/:id/accept
 * Accepts a pending event and assigns it to a target calendar.
 */
export async function acceptEmailEvent(
  eventId: string,
  targetCalendarId: string
): Promise<CalendarEvent> {
  return apiFetch("POST", `/events/${eventId}/accept`, { targetCalendarId });
}

/**
 * POST /events/:id/dismiss
 * Dismisses a pending event — user chose to ignore it.
 */
export async function dismissEmailEvent(eventId: string): Promise<void> {
  return apiFetch("POST", `/events/${eventId}/dismiss`);
}

// ─────────────────────────────────────────────
// Calendar Connections
// ─────────────────────────────────────────────

/**
 * GET /calendars
 * Fetches all connected calendar accounts with their sub-calendars.
 */
export async function getCalendarConnections(): Promise<CalendarConnection[]> {
  return apiFetch("GET", "/calendars");
}

/**
 * POST /calendars/connect/oauth
 * Initiates an OAuth flow for Google or Outlook.
 * Returns a redirect URL the frontend navigates to.
 */
export async function initiateOAuthConnection(
  source: "google" | "outlook"
): Promise<{ redirectUrl: string }> {
  return apiFetch("POST", "/calendars/connect/oauth", { source });
}

/**
 * POST /calendars/connect/apple
 * Connects an Apple iCloud calendar via app-specific password.
 */
export async function connectAppleCalendar(
  appleId: string,
  appPassword: string
): Promise<CalendarConnection> {
  return apiFetch("POST", "/calendars/connect/apple", { appleId, appPassword });
}

/**
 * POST /calendars/connect/caldav
 * Connects a generic CalDAV server.
 */
export async function connectCalDAV(
  serverUrl: string,
  username: string,
  password: string
): Promise<CalendarConnection> {
  return apiFetch("POST", "/calendars/connect/caldav", {
    serverUrl,
    username,
    password,
  });
}

/**
 * DELETE /calendars/:id
 * Disconnects a calendar source and removes all its synced events.
 */
export async function disconnectCalendar(connectionId: string): Promise<void> {
  return apiFetch("DELETE", `/calendars/${connectionId}`);
}

/**
 * POST /calendars/sync
 * Triggers an immediate sync. Pass connectionId to sync one, or omit for all.
 */
export async function syncNow(connectionId?: string): Promise<void> {
  return apiFetch("POST", "/calendars/sync", { connectionId });
}

/**
 * PATCH /calendars/:id/color
 * Updates the display color for a calendar connection.
 */
export async function updateCalendarColor(
  connectionId: string,
  color: string
): Promise<void> {
  return apiFetch("PATCH", `/calendars/${connectionId}/color`, { color });
}

/**
 * PATCH /calendars/:id/visibility
 * Toggles whether a calendar's events appear in views.
 */
export async function toggleCalendarVisibility(
  connectionId: string,
  enabled: boolean
): Promise<void> {
  return apiFetch("PATCH", `/calendars/${connectionId}/visibility`, {
    enabled,
  });
}

/**
 * PATCH /calendars/:id/email-watch
 * Toggles email inbox watching for a connection.
 */
export async function toggleEmailWatch(
  connectionId: string,
  enabled: boolean
): Promise<void> {
  return apiFetch("PATCH", `/calendars/${connectionId}/email-watch`, {
    enabled,
  });
}

// ─────────────────────────────────────────────
// Timezones
// ─────────────────────────────────────────────

/**
 * GET /timezones
 * Fetches all supported timezones, ordered by UTC offset.
 */
export async function getTimezones(): Promise<Timezone[]> {
  const { data, error } = await supabase
    .from("timezone")
    .select("tz_tag");

  if (error) {
    console.error("Failed to fetch timezones:", error.message);
    return [];
  }

  return (data ?? []) as Timezone[];
}

// ─────────────────────────────────────────────
// User Settings
// ─────────────────────────────────────────────

/**
 * GET /user/settings
 * Fetches the current user's preferences.
 */
export async function getUserSettings(): Promise<UserSettings> {
  return apiFetch("GET", "/user/settings");
}

/**
 * PATCH /user/settings
 * Partially updates user preferences. Returns the merged result.
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  return apiFetch("PATCH", "/user/settings", settings);
}

/**
 * DELETE /user/data
 * Permanently deletes all user data (events, connections, settings).
 * This action is irreversible.
 */
export async function deleteAllUserData(): Promise<void> {
  return apiFetch("DELETE", "/user/data");
}
