/**
 * useEvents — Data-fetching hooks for calendar events.
 *
 * Wraps TanStack Query and overlays the *live* connection color on every
 * event so color changes in CalendarsView reflect instantly without waiting
 * for a backend re-sync.
 */

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEventsForDateRange, getPendingEmailEvents } from "@/services/api";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { CalendarEvent, CalendarConnection } from "@/types";

/**
 * Overlay the parent connection's current color onto each event.
 * Reads the ["calendars"] cache directly — no extra fetch.
 */
function useColoredEvents(events: CalendarEvent[] | undefined): CalendarEvent[] | undefined {
  const qc = useQueryClient();
  const connections = qc.getQueryData<CalendarConnection[]>(["calendars"]);

  return useMemo(() => {
    if (!events) return events;
    if (!connections || connections.length === 0) return events;

    const byId = new Map<string, string>();
    const byEmail = new Map<string, string>();
    for (const c of connections) {
      if (c.color) {
        if (c.id) byId.set(c.id, c.color);
        if (c.accountEmail) byEmail.set(c.accountEmail.toLowerCase(), c.color);
      }
    }

    return events.map((e) => {
      const next =
        byId.get(e.calendarId) ??
        (e.accountEmail ? byEmail.get(e.accountEmail.toLowerCase()) : undefined) ??
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
