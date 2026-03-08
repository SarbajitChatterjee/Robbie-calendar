/**
 * useTimezones — TanStack Query hook for fetching timezone reference data.
 *
 * Timezones are static reference data, so staleTime is set to Infinity.
 * Components use this to populate dropdowns and format timezone displays.
 */

import { useQuery } from "@tanstack/react-query";
import { getTimezones } from "@/services/api";

export function useTimezones() {
  return useQuery({
    queryKey: ["timezones"],
    queryFn: getTimezones,
    staleTime: Infinity,
  });
}
