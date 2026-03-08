/**
 * Robbie — Service Layer (Backend-Ready Placeholders)
 *
 * ⭐ THIS IS THE ONLY FILE THE BACKEND ENGINEER MODIFIES.
 *
 * Every function in this file:
 * 1. Has a JSDoc with the intended REST endpoint
 * 2. Returns typed data matching interfaces in src/types/index.ts
 * 3. Contains a commented-out Supabase query (the "REAL" block)
 * 4. Currently throws a "Backend not connected" error (the "PLACEHOLDER" block)
 *
 * To wire up the real backend:
 * ─────────────────────────────────────────────────────────────────
 * 1. Create the Supabase project and run the DDL below.
 * 2. Generate or create `src/integrations/supabase/client.ts`:
 *      import { createClient } from "@supabase/supabase-js";
 *      export const supabase = createClient(
 *        "https://<PROJECT_REF>.supabase.co",
 *        "<ANON_KEY>"
 *      );
 * 3. Uncomment the import line below.
 * 4. In each function, uncomment the "REAL" block, delete the "PLACEHOLDER" block.
 * 5. Deploy Edge Functions for OAuth, sync, Apple, CalDAV, and data deletion.
 * ─────────────────────────────────────────────────────────────────
 *
 * ═══════════════════════════════════════════════════════════════
 *  SQL DDL — Run this in the Supabase SQL editor to create tables
 * ═══════════════════════════════════════════════════════════════
 *
 * -- 1. Events table
 * CREATE TABLE events (
 *   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   title          TEXT NOT NULL,
 *   start_time     TIMESTAMPTZ NOT NULL,
 *   end_time       TIMESTAMPTZ NOT NULL,
 *   is_all_day     BOOLEAN DEFAULT FALSE,
 *   organizer_tz   TEXT,
 *   user_tz        TEXT,
 *   meeting_link   TEXT,
 *   meeting_platform TEXT,
 *   meeting_id     TEXT,
 *   meeting_passcode TEXT,
 *   organizer      JSONB,           -- { name, email }
 *   attendees      JSONB DEFAULT '[]',
 *   description    TEXT,
 *   location       TEXT,
 *   calendar_id    TEXT,
 *   calendar_name  TEXT,
 *   account_email  TEXT,
 *   source         TEXT NOT NULL,    -- google | apple | outlook | caldav | gmail
 *   color          TEXT,
 *   is_read_only   BOOLEAN DEFAULT FALSE,
 *   detected_from_email  BOOLEAN DEFAULT FALSE,
 *   email_detection_method TEXT,     -- ics_attachment | smart_parse
 *   email_sender   TEXT,
 *   email_snippet  TEXT,
 *   acceptance_status TEXT DEFAULT 'pending_review',
 *   created_at     TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- 2. Calendar connections
 * CREATE TABLE calendar_connections (
 *   id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   source           TEXT NOT NULL,
 *   connection_type  TEXT NOT NULL,  -- calendar | email_watch | both
 *   account_email    TEXT NOT NULL,
 *   display_name     TEXT,
 *   color            TEXT,
 *   is_enabled       BOOLEAN DEFAULT TRUE,
 *   email_watch_enabled BOOLEAN DEFAULT FALSE,
 *   last_synced_at   TIMESTAMPTZ,
 *   sync_status      TEXT DEFAULT 'synced',
 *   error_message    TEXT,
 *   created_at       TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- 3. Sub-calendars (nested under connections)
 * CREATE TABLE sub_calendars (
 *   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
 *   name          TEXT NOT NULL,
 *   color         TEXT,
 *   is_enabled    BOOLEAN DEFAULT TRUE,
 *   is_read_only  BOOLEAN DEFAULT FALSE
 * );
 *
 * -- 4. User settings (one row per user)
 * CREATE TABLE user_settings (
 *   user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   home_timezone        TEXT DEFAULT 'UTC',
 *   show_organizer_tz    BOOLEAN DEFAULT TRUE,
 *   default_calendar_id  TEXT,
 *   first_day_of_week    TEXT DEFAULT 'monday',
 *   email_detection_mode TEXT DEFAULT 'ics_only',
 *   display_name         TEXT,
 *   email                TEXT,
 *   dark_mode            BOOLEAN DEFAULT FALSE
 * );
 *
 * -- 5. Timezones (reference/lookup, no RLS needed)
 * CREATE TABLE timezones (
 *   id         SERIAL PRIMARY KEY,
 *   name       TEXT NOT NULL,
 *   iana_key   TEXT UNIQUE NOT NULL,
 *   location   TEXT,
 *   utc_offset INTERVAL
 * );
 *
 * ═══════════════════════════════════════════════════════════════
 *  Edge Functions needed (deploy to supabase/functions/)
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. connect-oauth      — Initiates OAuth flow for Google / Outlook
 * 2. connect-apple      — Connects Apple iCloud via app-specific password
 * 3. connect-caldav     — Connects a generic CalDAV server
 * 4. sync-calendars     — Triggers an immediate calendar sync
 * 5. delete-user-data   — Permanently deletes all user data
 */

import { CalendarEvent, CalendarConnection, UserSettings, Timezone } from "@/types";

// ── Uncomment when Supabase client is ready ──
// import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Row Mappers — Postgres snake_case → Frontend camelCase
// ─────────────────────────────────────────────

/** Maps a Postgres `events` row to the frontend CalendarEvent interface. */
export function mapEventRow(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    start: row.start_time as string,
    end: row.end_time as string,
    isAllDay: row.is_all_day as boolean,
    organizerTimezone: row.organizer_tz as string | undefined,
    userTimezone: row.user_tz as string | undefined,
    meetingLink: row.meeting_link as string | undefined,
    meetingPlatform: row.meeting_platform as CalendarEvent["meetingPlatform"],
    meetingId: row.meeting_id as string | undefined,
    meetingPasscode: row.meeting_passcode as string | undefined,
    organizer: row.organizer as CalendarEvent["organizer"],
    attendees: row.attendees as CalendarEvent["attendees"],
    description: row.description as string | undefined,
    location: row.location as string | undefined,
    calendarId: row.calendar_id as string,
    calendarName: row.calendar_name as string,
    accountEmail: row.account_email as string,
    source: row.source as CalendarEvent["source"],
    color: row.color as string,
    isReadOnly: row.is_read_only as boolean,
    detectedFromEmail: row.detected_from_email as boolean,
    emailDetectionMethod: row.email_detection_method as CalendarEvent["emailDetectionMethod"],
    emailSender: row.email_sender as string | undefined,
    emailSnippet: row.email_snippet as string | undefined,
    acceptanceStatus: row.acceptance_status as CalendarEvent["acceptanceStatus"],
  };
}

/** Maps a Postgres `calendar_connections` row + nested `sub_calendars` to CalendarConnection. */
export function mapConnectionRow(row: Record<string, unknown>): CalendarConnection {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    source: row.source as CalendarConnection["source"],
    connectionType: row.connection_type as CalendarConnection["connectionType"],
    accountEmail: row.account_email as string,
    displayName: row.display_name as string,
    color: row.color as string,
    isEnabled: row.is_enabled as boolean,
    emailWatchEnabled: row.email_watch_enabled as boolean,
    lastSyncedAt: row.last_synced_at as string,
    syncStatus: row.sync_status as CalendarConnection["syncStatus"],
    errorMessage: row.error_message as string | undefined,
    calendars: (row.sub_calendars as Array<Record<string, unknown>> ?? []).map((sc) => ({
      id: sc.id as string,
      name: sc.name as string,
      color: sc.color as string,
      isEnabled: sc.is_enabled as boolean,
      isReadOnly: sc.is_read_only as boolean,
    })),
  };
}

/** Maps a Postgres `user_settings` row to the frontend UserSettings interface. */
export function mapSettingsRow(row: Record<string, unknown>): UserSettings {
  return {
    userId: row.user_id as string,
    homeTimezone: row.home_timezone as string,
    showOrganizerTimezone: row.show_organizer_tz as boolean,
    defaultCalendarId: row.default_calendar_id as string,
    firstDayOfWeek: row.first_day_of_week as UserSettings["firstDayOfWeek"],
    emailDetectionMode: row.email_detection_mode as UserSettings["emailDetectionMode"],
    displayName: row.display_name as string,
    email: row.email as string,
    darkMode: row.dark_mode as boolean,
  };
}

/** Converts a partial UserSettings object to Postgres column names for PATCH. */
export function toSettingsColumns(settings: Partial<UserSettings>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (settings.homeTimezone !== undefined) map.home_timezone = settings.homeTimezone;
  if (settings.showOrganizerTimezone !== undefined) map.show_organizer_tz = settings.showOrganizerTimezone;
  if (settings.defaultCalendarId !== undefined) map.default_calendar_id = settings.defaultCalendarId;
  if (settings.firstDayOfWeek !== undefined) map.first_day_of_week = settings.firstDayOfWeek;
  if (settings.emailDetectionMode !== undefined) map.email_detection_mode = settings.emailDetectionMode;
  if (settings.displayName !== undefined) map.display_name = settings.displayName;
  if (settings.email !== undefined) map.email = settings.email;
  if (settings.darkMode !== undefined) map.dark_mode = settings.darkMode;
  return map;
}

// ─────────────────────────────────────────────
// Shared error for all placeholder functions
// ─────────────────────────────────────────────

const BACKEND_NOT_CONNECTED = "Backend not connected. See src/services/api.ts for setup instructions.";

// ─────────────────────────────────────────────
// API Functions: Events
// ─────────────────────────────────────────────

/** GET /api/events?start=&end= — Fetches all confirmed events in a date range. */
export async function getEventsForDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  // ── REAL (uncomment when Supabase is connected) ──
  // const { data, error } = await supabase
  //   .from("events")
  //   .select("*")
  //   .gte("start_time", start.toISOString())
  //   .lte("start_time", end.toISOString())
  //   .eq("acceptance_status", "accepted")
  //   .order("start_time", { ascending: true });
  // if (error) throw new Error(error.message);
  // return (data ?? []).map(mapEventRow);

  // ── PLACEHOLDER (remove when Supabase is connected) ──
  void start; void end; // suppress unused-variable warnings
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** GET /api/events/pending-inbox — Fetches events detected from email that need user review. */
export async function getPendingEmailEvents(): Promise<CalendarEvent[]> {
  // ── REAL ──
  // const { data, error } = await supabase
  //   .from("events")
  //   .select("*")
  //   .eq("acceptance_status", "pending_review")
  //   .eq("detected_from_email", true)
  //   .order("start_time", { ascending: true });
  // if (error) throw new Error(error.message);
  // return (data ?? []).map(mapEventRow);

  // ── PLACEHOLDER ──
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/events/accept — Accepts a pending event and adds it to the target calendar. */
export async function acceptEmailEvent(eventId: string, targetCalendarId: string): Promise<CalendarEvent> {
  // ── REAL ──
  // const { data, error } = await supabase
  //   .from("events")
  //   .update({ acceptance_status: "accepted", calendar_id: targetCalendarId })
  //   .eq("id", eventId)
  //   .select()
  //   .single();
  // if (error) throw new Error(error.message);
  // return mapEventRow(data);

  // ── PLACEHOLDER ──
  void eventId; void targetCalendarId;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/events/dismiss — Dismisses a pending event (user chose to ignore it). */
export async function dismissEmailEvent(eventId: string): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase
  //   .from("events")
  //   .update({ acceptance_status: "dismissed" })
  //   .eq("id", eventId);
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void eventId;
  throw new Error(BACKEND_NOT_CONNECTED);
}

// ─────────────────────────────────────────────
// API Functions: Calendar Connections
// ─────────────────────────────────────────────

/** GET /api/calendars — Fetches all connected calendar accounts for the current user. */
export async function getCalendarConnections(): Promise<CalendarConnection[]> {
  // ── REAL ──
  // const { data, error } = await supabase
  //   .from("calendar_connections")
  //   .select("*, sub_calendars(*)")
  //   .order("created_at", { ascending: true });
  // if (error) throw new Error(error.message);
  // return (data ?? []).map(mapConnectionRow);

  // ── PLACEHOLDER ──
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/calendars/connect/oauth — Initiates OAuth flow. Returns a redirect URL from Edge Function. */
export async function initiateOAuthConnection(source: "google" | "outlook"): Promise<{ redirectUrl: string }> {
  // ── REAL ──
  // const { data, error } = await supabase.functions.invoke("connect-oauth", {
  //   body: { source },
  // });
  // if (error) throw new Error(error.message);
  // return { redirectUrl: data.redirectUrl };

  // ── PLACEHOLDER ──
  void source;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/calendars/connect/apple — Connects Apple iCloud via app-specific password. */
export async function connectAppleCalendar(appleId: string, appPassword: string): Promise<CalendarConnection> {
  // ── REAL ──
  // const { data, error } = await supabase.functions.invoke("connect-apple", {
  //   body: { appleId, appPassword },
  // });
  // if (error) throw new Error(error.message);
  // return mapConnectionRow(data);

  // ── PLACEHOLDER ──
  void appleId; void appPassword;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/calendars/connect/caldav — Connects a generic CalDAV server. */
export async function connectCalDAV(serverUrl: string, username: string, password: string): Promise<CalendarConnection> {
  // ── REAL ──
  // const { data, error } = await supabase.functions.invoke("connect-caldav", {
  //   body: { serverUrl, username, password },
  // });
  // if (error) throw new Error(error.message);
  // return mapConnectionRow(data);

  // ── PLACEHOLDER ──
  void serverUrl; void username; void password;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** DELETE /api/calendars/:id — Disconnects a calendar source. */
export async function disconnectCalendar(connectionId: string): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase
  //   .from("calendar_connections")
  //   .delete()
  //   .eq("id", connectionId);
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void connectionId;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** POST /api/calendars/:id/sync — Triggers an immediate sync via Edge Function. */
export async function syncNow(connectionId?: string): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase.functions.invoke("sync-calendars", {
  //   body: { connectionId },
  // });
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void connectionId;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** PATCH /api/calendars/:id/color — Updates the display color for a calendar connection. */
export async function updateCalendarColor(connectionId: string, color: string): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase
  //   .from("calendar_connections")
  //   .update({ color })
  //   .eq("id", connectionId);
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void connectionId; void color;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** PATCH /api/calendars/:id/visibility — Toggles whether a calendar's events appear in views. */
export async function toggleCalendarVisibility(connectionId: string, enabled: boolean): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase
  //   .from("calendar_connections")
  //   .update({ is_enabled: enabled })
  //   .eq("id", connectionId);
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void connectionId; void enabled;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** PATCH /api/calendars/:id/email-watch — Toggles email inbox watching for a connection. */
export async function toggleEmailWatch(connectionId: string, enabled: boolean): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase
  //   .from("calendar_connections")
  //   .update({ email_watch_enabled: enabled })
  //   .eq("id", connectionId);
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  void connectionId; void enabled;
  throw new Error(BACKEND_NOT_CONNECTED);
}

// ─────────────────────────────────────────────
// API Functions: Timezones
// ─────────────────────────────────────────────

/** GET /api/timezones — Fetches all supported timezones, ordered by UTC offset. */
export async function getTimezones(): Promise<Timezone[]> {
  // ── REAL ──
  // const { data, error } = await supabase
  //   .from("timezones")
  //   .select("*")
  //   .order("utc_offset", { ascending: true });
  // if (error) throw new Error(error.message);
  // return data as Timezone[];

  // ── PLACEHOLDER ──
  throw new Error(BACKEND_NOT_CONNECTED);
}

// ─────────────────────────────────────────────
// API Functions: User Settings
// ─────────────────────────────────────────────

/** GET /api/user/settings — Fetches user preferences. */
export async function getUserSettings(): Promise<UserSettings> {
  // ── REAL ──
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) throw new Error("Not authenticated");
  // const { data, error } = await supabase
  //   .from("user_settings")
  //   .select("*")
  //   .eq("user_id", user.id)
  //   .single();
  // if (error) throw new Error(error.message);
  // return mapSettingsRow(data);

  // ── PLACEHOLDER ──
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** PATCH /api/user/settings — Partially updates user preferences. Returns the merged result. */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  // ── REAL ──
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) throw new Error("Not authenticated");
  // const columns = toSettingsColumns(settings);
  // const { data, error } = await supabase
  //   .from("user_settings")
  //   .update(columns)
  //   .eq("user_id", user.id)
  //   .select()
  //   .single();
  // if (error) throw new Error(error.message);
  // return mapSettingsRow(data);

  // ── PLACEHOLDER ──
  void settings;
  throw new Error(BACKEND_NOT_CONNECTED);
}

/** DELETE /api/user/data — Permanently deletes all user data via Edge Function. */
export async function deleteAllUserData(): Promise<void> {
  // ── REAL ──
  // const { error } = await supabase.functions.invoke("delete-user-data");
  // if (error) throw new Error(error.message);

  // ── PLACEHOLDER ──
  throw new Error(BACKEND_NOT_CONNECTED);
}
