/**
 * useCalendars — Fetches the user's connected calendar accounts.
 *
 * Returns an array of CalendarConnection objects, each representing
 * a linked provider (Google, Apple, Outlook, CalDAV) with sync status.
 */

import { useQuery } from "@tanstack/react-query";
import { getCalendarConnections } from "@/services/api";

export function useCalendars() {
  return useQuery({
    queryKey: ["calendars"],
    queryFn: getCalendarConnections,
  });
}
