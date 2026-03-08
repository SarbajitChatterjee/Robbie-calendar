import { useQuery } from "@tanstack/react-query";
import { getEventsForDateRange, getPendingEmailEvents } from "@/services/api";
import { startOfWeek, endOfWeek } from "date-fns";

export function useWeekEvents() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["events", "week", start.toISOString(), end.toISOString()],
    queryFn: () => getEventsForDateRange(start, end),
  });
}

export function usePendingInbox() {
  return useQuery({
    queryKey: ["events", "pending-inbox"],
    queryFn: getPendingEmailEvents,
  });
}
