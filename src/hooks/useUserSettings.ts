import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "@/services/api";

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  });
}
