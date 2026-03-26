/**
 * Robbie — Shared TypeScript Interfaces
 *
 * This is the SINGLE SOURCE OF TRUTH for all data shapes used across the app.
 * Every interface here mirrors the expected API response structure.
 * When the backend is wired up, these types define the contract between
 * the frontend and the service layer.
 */

/**
 * Represents a single calendar event from any connected source.
 *
 * Events can originate from direct calendar sync (Google/Apple/Outlook/CalDAV)
 * or be detected from email inboxes (ICS attachments or smart parsing).
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601, always stored in UTC
  end: string;   // ISO 8601, always stored in UTC
  isAllDay: boolean;

  /** The timezone of the person who created the event (e.g., "Europe/Berlin"). */
  organizerTimezone: string;
  /** The current user's display timezone (e.g., "Asia/Singapore"). */
  userTimezone: string;

  // --- Meeting details (optional, extracted automatically) ---
  meetingLink?: string;
  meetingPlatform?: "zoom" | "teams" | "meet" | "other";
  meetingId?: string;
  meetingPasscode?: string;

  /** Physical location, if specified on the event. */
  location?: string;

  /** The person who created/sent the event. */
  organizer?: { name: string; email: string };

  /** Attendee list. `isCurrentUser` flags the logged-in user's entry. */
  attendees?: Array<{
    name: string;
    email: string;
    rsvpStatus: "accepted" | "declined" | "pending" | "unknown";
    isCurrentUser: boolean;
  }>;

  description?: string;

  // --- Source tracking ---
  calendarId: string;
  calendarName: string;
  accountEmail: string;
  source: "google" | "outlook" | "apple" | "caldav";
  /** Hex color from the source calendar (e.g., "#4285F4"). Used for color bars and dots. */
  color: string;
  /** If true, the user can view but not edit this event (e.g., shared calendars). */
  isReadOnly: boolean;
  /** Direct link to the event in the source provider's web UI. */
  htmlLink?: string;

  // --- Email detection metadata ---
  /** True if this event was extracted from an email rather than a calendar sync. */
  detectedFromEmail: boolean;
  /** How the event was detected: ICS file attachment or AI-powered email parsing. */
  emailDetectionMethod?: "ics_attachment" | "smart_parse";
  emailSender?: string;
  emailSnippet?: string;

  /**
   * Lifecycle status:
   * - "accepted": confirmed on a calendar
   * - "pending_review": detected from email, awaiting user action
   * - "dismissed": user chose to ignore this event
   */
  acceptanceStatus: "accepted" | "pending_review" | "dismissed";
}

/**
 * A sub-calendar within a connection (e.g., "Work" and "Birthdays" under a Google account).
 */
export interface SubCalendar {
  id: string;
  name: string;
  color: string;
  isEnabled: boolean;
  isReadOnly: boolean;
}

/**
 * Represents a connected calendar account (e.g., a Google account or an Apple iCloud account).
 * Each connection can have multiple sub-calendars and optionally watch the account's email inbox.
 */
export interface CalendarConnection {
  id: string;
  userId: string;
  source: "google" | "outlook" | "apple" | "caldav" | "gmail";
  /** What this connection provides: calendar events, email watching, or both. */
  connectionType: "calendar" | "email_watch" | "both";
  accountEmail: string;
  displayName: string;
  color: string;
  isEnabled: boolean;
  emailWatchEnabled: boolean;
  lastSyncedAt: string;
  syncStatus: "synced" | "syncing" | "error" | "disconnected";
  errorMessage?: string;
  calendars?: SubCalendar[];
}

/**
 * User-level preferences. Persisted server-side, loaded once on app start.
 */
export interface UserSettings {
  userId: string;
  homeTimezone: string;
  showOrganizerTimezone: boolean;
  defaultCalendarId: number | null; 
  firstDayOfWeek: "sunday" | "monday";
  /** "ics_only" = only detect .ics attachments; "smart" = also parse email body for events. */
  emailDetectionMode: "ics_only" | "smart" | "disabled";
  displayName: string;
  email: string;
  darkMode: boolean;
}

/**
 * A timezone record fetched from the `timezones` database table.
 * Used to populate dropdowns and format timezone display strings dynamically.
 */
export interface Timezone {
  //id: number;
  /** Human-readable label shown in dropdowns, e.g. "Singapore (SGT, UTC+8)". */
  //name: string;
  tz_name:     string;
  /** IANA identifier stored as the user's preference, e.g. "Asia/Singapore". */
  //iana_key: string;
  tz_tag: string;
  /** City or region name, e.g. "Singapore". */
  //location: string;
  tz_location: string;
  /** Postgres interval string representing UTC offset, e.g. "08:00:00" or "-05:00:00". */
  utc_offset: string;
}

/** Navigation tab identifiers used by AppLayout for tab switching. */
export type TabId = "today" | "week" | "month" | "inbox" | "calendars";
