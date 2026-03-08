/**
 * Fuse Calendar — Service Layer
 * This is the ONLY file the backend engineer touches when wiring up a real server.
 * All functions return mock data. Each has a JSDoc with the intended endpoint path.
 */

import { CalendarEvent, CalendarConnection, UserSettings } from "@/types";
import { addDays, startOfWeek, format, setHours, setMinutes } from "date-fns";

// Helper to get dates relative to "today"
const today = () => new Date();
const makeDate = (dayOffset: number, hour: number, minute = 0) => {
  const d = addDays(today(), dayOffset);
  return setMinutes(setHours(d, hour), minute).toISOString();
};

const weekStart = startOfWeek(today(), { weekStartsOn: 1 });
const dayOfWeek = today().getDay(); // 0=Sun
const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Weekly Team Standup",
    start: makeDate(mondayOffset, 9, 0),
    end: makeDate(mondayOffset, 9, 30),
    isAllDay: false,
    organizerTimezone: "Europe/Berlin",
    userTimezone: "Asia/Singapore",
    meetingLink: "https://zoom.us/j/123456789",
    meetingPlatform: "zoom",
    meetingId: "123 456 789",
    meetingPasscode: "abc123",
    organizer: { name: "Sarah Chen", email: "sarah@company.com" },
    attendees: [
      { name: "You", email: "me@company.com", rsvpStatus: "accepted", isCurrentUser: true },
      { name: "Sarah Chen", email: "sarah@company.com", rsvpStatus: "accepted", isCurrentUser: false },
      { name: "James Lee", email: "james@company.com", rsvpStatus: "accepted", isCurrentUser: false },
      { name: "Maria Lopez", email: "maria@company.com", rsvpStatus: "pending", isCurrentUser: false },
    ],
    description: "Weekly sync to review sprint progress and blockers.",
    calendarId: "cal-google-work",
    calendarName: "Work",
    accountEmail: "me@company.com",
    source: "google",
    color: "#4285F4",
    isReadOnly: false,
    detectedFromEmail: false,
    acceptanceStatus: "accepted",
  },
  {
    id: "evt-2",
    title: "Dentist Appointment",
    start: makeDate(mondayOffset + 2, 14, 0),
    end: makeDate(mondayOffset + 2, 15, 0),
    isAllDay: false,
    organizerTimezone: "Asia/Singapore",
    userTimezone: "Asia/Singapore",
    location: "23 Orchard Road, Singapore",
    calendarId: "cal-apple-personal",
    calendarName: "Personal",
    accountEmail: "me@icloud.com",
    source: "apple",
    color: "#E8634F",
    isReadOnly: false,
    detectedFromEmail: false,
    acceptanceStatus: "accepted",
    description: "Regular checkup with Dr. Tan.",
  },
  {
    id: "evt-3",
    title: "Product Review",
    start: makeDate(mondayOffset + 3, 15, 0),
    end: makeDate(mondayOffset + 3, 16, 30),
    isAllDay: false,
    organizerTimezone: "Asia/Singapore",
    userTimezone: "Asia/Singapore",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    meetingPlatform: "meet",
    organizer: { name: "Alex Wong", email: "alex@company.com" },
    attendees: [
      { name: "You", email: "me@company.com", rsvpStatus: "accepted", isCurrentUser: true },
      { name: "Alex Wong", email: "alex@company.com", rsvpStatus: "accepted", isCurrentUser: false },
      { name: "Sarah Chen", email: "sarah@company.com", rsvpStatus: "accepted", isCurrentUser: false },
      { name: "James Lee", email: "james@company.com", rsvpStatus: "pending", isCurrentUser: false },
      { name: "Emily Tan", email: "emily@company.com", rsvpStatus: "declined", isCurrentUser: false },
      { name: "David Kim", email: "david@company.com", rsvpStatus: "accepted", isCurrentUser: false },
    ],
    description: "Q2 product roadmap review. Bring your ideas!",
    calendarId: "cal-google-work",
    calendarName: "Work",
    accountEmail: "me@company.com",
    source: "google",
    color: "#4285F4",
    isReadOnly: false,
    detectedFromEmail: false,
    acceptanceStatus: "accepted",
  },
  {
    id: "evt-4",
    title: "Dad's Birthday 🎂",
    start: makeDate(mondayOffset + 4, 0, 0),
    end: makeDate(mondayOffset + 4, 23, 59),
    isAllDay: true,
    organizerTimezone: "Asia/Singapore",
    userTimezone: "Asia/Singapore",
    calendarId: "cal-apple-personal",
    calendarName: "Personal",
    accountEmail: "me@icloud.com",
    source: "apple",
    color: "#E8634F",
    isReadOnly: false,
    detectedFromEmail: false,
    acceptanceStatus: "accepted",
  },
  {
    id: "evt-5",
    title: "Sales Sync",
    start: makeDate(mondayOffset + 1, 11, 0),
    end: makeDate(mondayOffset + 1, 12, 0),
    isAllDay: false,
    organizerTimezone: "America/New_York",
    userTimezone: "Asia/Singapore",
    meetingLink: "https://teams.microsoft.com/l/meetup/abc",
    meetingPlatform: "teams",
    organizer: { name: "Tom Wilson", email: "tom@partner.com" },
    attendees: [
      { name: "You", email: "me@company.com", rsvpStatus: "accepted", isCurrentUser: true },
      { name: "Tom Wilson", email: "tom@partner.com", rsvpStatus: "accepted", isCurrentUser: false },
    ],
    description: "Monthly sales alignment call.",
    calendarId: "cal-outlook-team",
    calendarName: "Team Shared",
    accountEmail: "me@outlook.com",
    source: "outlook",
    color: "#2BA4A4",
    isReadOnly: true,
    detectedFromEmail: false,
    acceptanceStatus: "accepted",
  },
];

const MOCK_PENDING_EVENTS: CalendarEvent[] = [
  {
    id: "pending-1",
    title: "Q2 Planning Workshop",
    start: makeDate(7, 10, 0),
    end: makeDate(7, 13, 0),
    isAllDay: false,
    organizerTimezone: "America/New_York",
    userTimezone: "Asia/Singapore",
    meetingLink: "https://teams.microsoft.com/l/meetup/xyz",
    meetingPlatform: "teams",
    organizer: { name: "Lisa Park", email: "manager@company.com" },
    attendees: Array.from({ length: 8 }, (_, i) => ({
      name: `Attendee ${i + 1}`,
      email: `person${i + 1}@company.com`,
      rsvpStatus: "pending" as const,
      isCurrentUser: i === 0,
    })),
    description: "Full-day planning workshop for Q2 initiatives. Bring laptops.",
    calendarId: "",
    calendarName: "",
    accountEmail: "me@company.com",
    source: "google",
    color: "#4285F4",
    isReadOnly: false,
    detectedFromEmail: true,
    emailDetectionMethod: "ics_attachment",
    emailSender: "manager@company.com",
    emailSnippet: "Hi team, please join us for the Q2 planning workshop next Monday. Calendar invite attached.",
    acceptanceStatus: "pending_review",
  },
  {
    id: "pending-2",
    title: "Flight SQ321 Singapore → London",
    start: makeDate(12, 23, 55),
    end: makeDate(13, 6, 30),
    isAllDay: false,
    organizerTimezone: "Asia/Singapore",
    userTimezone: "Asia/Singapore",
    calendarId: "",
    calendarName: "",
    accountEmail: "me@company.com",
    source: "google",
    color: "#4285F4",
    isReadOnly: false,
    detectedFromEmail: true,
    emailDetectionMethod: "smart_parse",
    emailSender: "booking@singaporeair.com",
    emailSnippet: "Your booking is confirmed. Flight SQ321 departing Singapore Changi Terminal 3 at 23:55.",
    description: "Singapore Airlines flight to London Heathrow. Booking ref: ABC123.",
    acceptanceStatus: "pending_review",
  },
];

const MOCK_CONNECTIONS: CalendarConnection[] = [
  {
    id: "conn-google",
    userId: "user-1",
    source: "google",
    connectionType: "both",
    accountEmail: "me@company.com",
    displayName: "Google · Work",
    color: "#4285F4",
    isEnabled: true,
    emailWatchEnabled: true,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    syncStatus: "synced",
    calendars: [
      { id: "cal-google-work", name: "Work", color: "#4285F4", isEnabled: true, isReadOnly: false },
      { id: "cal-google-birthdays", name: "Birthdays", color: "#7986CB", isEnabled: true, isReadOnly: true },
    ],
  },
  {
    id: "conn-apple",
    userId: "user-1",
    source: "apple",
    connectionType: "calendar",
    accountEmail: "me@icloud.com",
    displayName: "Apple · Personal",
    color: "#E8634F",
    isEnabled: true,
    emailWatchEnabled: false,
    lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    syncStatus: "synced",
    calendars: [
      { id: "cal-apple-personal", name: "Personal", color: "#E8634F", isEnabled: true, isReadOnly: false },
    ],
  },
  {
    id: "conn-outlook",
    userId: "user-1",
    source: "outlook",
    connectionType: "calendar",
    accountEmail: "me@outlook.com",
    displayName: "Outlook · Team Shared",
    color: "#2BA4A4",
    isEnabled: true,
    emailWatchEnabled: false,
    lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    syncStatus: "error",
    errorMessage: "Session expired. Tap to reconnect.",
    calendars: [
      { id: "cal-outlook-team", name: "Team Shared", color: "#2BA4A4", isEnabled: true, isReadOnly: true },
    ],
  },
];

const MOCK_SETTINGS: UserSettings = {
  userId: "user-1",
  homeTimezone: "Asia/Singapore",
  showOrganizerTimezone: true,
  defaultCalendarId: "cal-google-work",
  firstDayOfWeek: "monday",
  emailDetectionMode: "ics_only",
  displayName: "Alex",
  email: "me@company.com",
  darkMode: false,
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/** GET /api/events?start=&end=&timezone= */
export async function getEventsForDateRange(_start: Date, _end: Date): Promise<CalendarEvent[]> {
  await delay();
  return MOCK_EVENTS;
}

/** GET /api/events/pending-inbox */
export async function getPendingEmailEvents(): Promise<CalendarEvent[]> {
  await delay();
  return MOCK_PENDING_EVENTS;
}

/** POST /api/events/accept */
export async function acceptEmailEvent(eventId: string, _targetCalendarId: string): Promise<CalendarEvent> {
  await delay(500);
  const evt = MOCK_PENDING_EVENTS.find((e) => e.id === eventId);
  if (!evt) throw new Error("Event not found");
  return { ...evt, acceptanceStatus: "accepted" };
}

/** POST /api/events/dismiss */
export async function dismissEmailEvent(_eventId: string): Promise<void> {
  await delay(500);
}

/** GET /api/calendars */
export async function getCalendarConnections(): Promise<CalendarConnection[]> {
  await delay();
  return MOCK_CONNECTIONS;
}

/** POST /api/calendars/connect/oauth */
export async function initiateOAuthConnection(_source: "google" | "outlook"): Promise<{ redirectUrl: string }> {
  await delay(500);
  return { redirectUrl: "#" };
}

/** POST /api/calendars/connect/apple */
export async function connectAppleCalendar(_appleId: string, _appPassword: string): Promise<CalendarConnection> {
  await delay(800);
  return MOCK_CONNECTIONS[1];
}

/** POST /api/calendars/connect/caldav */
export async function connectCalDAV(_serverUrl: string, _username: string, _password: string): Promise<CalendarConnection> {
  await delay(800);
  return { ...MOCK_CONNECTIONS[0], id: "conn-caldav", source: "caldav", displayName: "CalDAV Server" };
}

/** DELETE /api/calendars/:id */
export async function disconnectCalendar(_connectionId: string): Promise<void> {
  await delay(500);
}

/** POST /api/calendars/:id/sync */
export async function syncNow(_connectionId?: string): Promise<void> {
  await delay(1000);
}

/** PATCH /api/calendars/:id/color */
export async function updateCalendarColor(_connectionId: string, _color: string): Promise<void> {
  await delay(300);
}

/** PATCH /api/calendars/:id/visibility */
export async function toggleCalendarVisibility(_connectionId: string, _enabled: boolean): Promise<void> {
  await delay(300);
}

/** PATCH /api/calendars/:id/email-watch */
export async function toggleEmailWatch(_connectionId: string, _enabled: boolean): Promise<void> {
  await delay(300);
}

/** GET /api/user/settings */
export async function getUserSettings(): Promise<UserSettings> {
  await delay();
  return MOCK_SETTINGS;
}

/** PATCH /api/user/settings */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  await delay(500);
  return { ...MOCK_SETTINGS, ...settings };
}

/** DELETE /api/user/data */
export async function deleteAllUserData(): Promise<void> {
  await delay(1000);
}
