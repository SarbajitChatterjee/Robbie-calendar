/**
 * useEvents — Data-fetching hooks for calendar events.
 *
 * These hooks wrap TanStack Query to provide caching, deduplication,
 * and automatic background refetching for event data.
 */

import { useQuery } from "@tanstack/react-query";
import { getEventsForDateRange, getPendingEmailEvents } from "@/services/api";
import { startOfWeek, endOfWeek } from "date-fns";

/**
 * Fetches all confirmed events for the current week (Monday–Sunday).
 * Used by TodayView, WeekView, and MonthView.
 */
export function useWeekEvents() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["events", "week", start.toISOString(), end.toISOString()],
    queryFn: () => getEventsForDateRange(start, end),
  });
}

/**
 * Fetches email-detected events that are pending user review.
 * Used by InboxView and the pending-count banner in TodayView.
 */
export function usePendingInbox() {
  return useQuery({
    queryKey: ["events", "pending-inbox"],
    queryFn: getPendingEmailEvents,
  });
}
