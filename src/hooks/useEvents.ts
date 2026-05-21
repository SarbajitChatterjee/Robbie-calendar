/**
 * useEvents — Data-fetching hooks for calendar events.
 *
 * Wraps TanStack Query and overlays the *live* connection color on every
 * event so color changes in CalendarsView reflect instantly without waiting
 * for a backend re-sync.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEventsForDateRange, getPendingEmailEvents } from "@/services/api";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { CalendarEvent, CalendarConnection } from "@/types";
import { useCalendars } from "@/hooks/useCalendars";

/**
 * Overlay the parent connection's current color onto each event.
 * Reads the ["calendars"] cache directly — no extra fetch.
 */
function useColoredEvents(events: CalendarEvent[] | undefined): CalendarEvent[] | undefined {
  const { data: connections } = useCalendars();

  return useMemo(() => {
    if (!events) return events;
    if (!connections || connections.length === 0) return events;

    const colorById = new Map<string, string>();
    const colorByEmail = new Map<string, string>();
    const enabledById = new Map<string, boolean>();
    const enabledByEmail = new Map<string, boolean>();
    for (const c of connections) {
      if (c.id) {
        if (c.color) colorById.set(c.id, c.color);
        enabledById.set(c.id, c.isEnabled);
      }
      for (const sub of c.calendars ?? []) {
        if (sub.color) colorById.set(sub.id, sub.color);
        enabledById.set(sub.id, c.isEnabled && sub.isEnabled);
      }
      if (c.accountEmail) {
        const key = c.accountEmail.toLowerCase();
        if (c.color) colorByEmail.set(key, c.color);
        // If any matching connection is enabled, treat as enabled
        enabledByEmail.set(key, (enabledByEmail.get(key) ?? false) || c.isEnabled);
      }
    }

    const filtered = events.filter((e) => {
      const byId = enabledById.get(e.calendarId);
      if (byId !== undefined) return byId;
      const email = e.accountEmail?.toLowerCase();
      const byEmail = email ? enabledByEmail.get(email) : undefined;
      if (byEmail !== undefined) return byEmail;
      return true; // unknown mapping → don't hide
    });

    return filtered.map((e) => {
      const next =
        colorById.get(e.calendarId) ??
        (e.accountEmail ? colorByEmail.get(e.accountEmail.toLowerCase()) : undefined) ??
        e.color;
      return next === e.color ? e : { ...e, color: next };
    });
  }, [events, connections]);
}

export function useWeekEvents() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  const query = useQuery({
    queryKey: ["events", "week", start.toISOString(), end.toISOString()],
    queryFn: () => getEventsForDateRange(start, end),
  });
  return { ...query, data: useColoredEvents(query.data) };
}

export function usePendingInbox() {
  const query = useQuery({
    queryKey: ["events", "pending-inbox"],
    queryFn: getPendingEmailEvents,
  });
  return { ...query, data: useColoredEvents(query.data) };
}

export function useMonthEvents(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const query = useQuery({
    queryKey: ["events", "month", start.toISOString()],
    queryFn: () => getEventsForDateRange(start, end),
  });
  return { ...query, data: useColoredEvents(query.data) };
}
