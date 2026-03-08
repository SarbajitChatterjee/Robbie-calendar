/**
 * useUserSettings — Fetches the current user's preferences.
 *
 * Returns settings like home timezone, display preferences,
 * email detection mode, and dark mode flag.
 */

import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "@/services/api";

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  });
}
