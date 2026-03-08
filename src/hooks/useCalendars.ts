import { useQuery } from "@tanstack/react-query";
import { getCalendarConnections } from "@/services/api";

export function useCalendars() {
  return useQuery({
    queryKey: ["calendars"],
    queryFn: getCalendarConnections,
  });
}
