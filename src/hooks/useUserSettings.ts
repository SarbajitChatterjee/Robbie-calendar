/**
 * useUserSettings — Fetches the current user's preferences.
 *
 * Returns settings like home timezone, display preferences,
 * email detection mode, and dark mode flag.
 */

//Moving away from API based for userSettings to reach out to DB directly.This will help in preserving more security and less complexities.
// import { useQuery } from "@tanstack/react-query";
// import { getUserSettings } from "@/services/api";

// export function useUserSettings() {
//   return useQuery({
//     queryKey: ["user-settings"],
//     queryFn: getUserSettings,
//   });
// }

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("NO_SETTINGS_ROW");
      return data;
    },
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return async (patch: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("user_settings")
      .update(patch)
      .eq("user_id", session.user.id);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["user-settings"] });
  };
}
