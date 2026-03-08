export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601, UTC
  end: string;
  isAllDay: boolean;
  organizerTimezone: string;
  userTimezone: string;
  meetingLink?: string;
  meetingPlatform?: "zoom" | "teams" | "meet" | "other";
  meetingId?: string;
  meetingPasscode?: string;
  location?: string;
  organizer?: { name: string; email: string };
  attendees?: Array<{
    name: string;
    email: string;
    rsvpStatus: "accepted" | "declined" | "pending" | "unknown";
    isCurrentUser: boolean;
  }>;
  description?: string;
  calendarId: string;
  calendarName: string;
  accountEmail: string;
  source: "google" | "outlook" | "apple" | "caldav";
  color: string;
  isReadOnly: boolean;
  htmlLink?: string;
  detectedFromEmail: boolean;
  emailDetectionMethod?: "ics_attachment" | "smart_parse";
  emailSender?: string;
  emailSnippet?: string;
  acceptanceStatus: "accepted" | "pending_review" | "dismissed";
}

export interface SubCalendar {
  id: string;
  name: string;
  color: string;
  isEnabled: boolean;
  isReadOnly: boolean;
}

export interface CalendarConnection {
  id: string;
  userId: string;
  source: "google" | "outlook" | "apple" | "caldav" | "gmail";
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

export interface UserSettings {
  userId: string;
  homeTimezone: string;
  showOrganizerTimezone: boolean;
  defaultCalendarId: string;
  firstDayOfWeek: "sunday" | "monday";
  emailDetectionMode: "ics_only" | "smart";
  displayName: string;
  email: string;
  darkMode: boolean;
}

export type TabId = "today" | "week" | "month" | "inbox" | "calendars";
