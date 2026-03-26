/**
 * Settings Page — User preferences and account management.
 *
 * Displays the user's profile (avatar, name, email) and configurable
 * options for timezone, display, email detection, and appearance.
 *
 * Each control calls `updateUserSettings()` on change with a try/catch.
 * While the backend is disconnected, the catch block shows a Sonner toast
 * so the user gets immediate feedback. Once the backend is live, changes
 * persist automatically with no component modifications needed.
 *
 * Timezone options are fetched dynamically from the `timezones` table
 * via useTimezones(). No hardcoded timezone entries.
 */

// Below 3 are for using it through API. Right now tasking the settings page to directly reach out to Supabase for better security and less complications.
// import { useUserSettings } from "@/hooks/useUserSettings";
// import { updateUserSettings } from "@/services/api";
// import { useQueryClient } from "@tanstack/react-query";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/useUserSettings";
import { useTimezones } from "@/hooks/useTimezones";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { toast } from "sonner";
import { UserSettings } from "@/types";

/**
 * Attempts to persist a partial settings update.
 * Shows a toast on success or failure for immediate user feedback.
 */
// Consistent with the changes of moving away from API for this page
// async function saveSettingWithFeedback(
//   patch: Partial<UserSettings>,
//   queryClient: ReturnType<typeof useQueryClient>,
// ) {
//   try {
//     await updateUserSettings(patch);
//     // Invalidate cache so the UI reflects the server state
//     queryClient.invalidateQueries({ queryKey: ["user-settings"] });
//     toast.success("Settings updated");
//   } catch {
//     toast.error("Couldn't save — try again later");
//   }
// }
async function saveSettingWithFeedback(
  patch: Record<string, unknown>,
  updateSettings: (patch: Record<string, unknown>) => Promise<void>,
) {
  try {
    await updateSettings(patch);
    toast.success("Settings updated");
  } catch {
    toast.error("Couldn't save — try again later");
  }
}

export default function SettingsView() {
  const { data: settings, isLoading, isError, refetch } = useUserSettings();
  const { data: timezones = [] } = useTimezones();

  //consistent with the changes of moving away from API
  // const queryClient = useQueryClient();
  const updateSettings = useUpdateUserSettings();

  if (isLoading) return null;
  if (isError || !settings) return <div className="p-5"><ErrorState message="Couldn't load your settings" onRetry={refetch} /></div>;

  // Generate initials from display name for the avatar placeholder
  // const initials = settings.displayName.slice(0, 2).toUpperCase();

  // Better way of handling blanks:
  const initials = (settings.displayName ?? "").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Profile header */}
      <header className="px-5 pt-6 pb-6 flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{settings.displayName}</h1>
          <p className="text-sm text-muted-foreground">{settings.email}</p>
        </div>
      </header>

      {/* Settings list */}
      <div className="px-5 space-y-6">
        <SettingRow label="Home Timezone">
          <Select
            defaultValue={settings.homeTimezone}
            /*onValueChange={(value) => saveSettingWithFeedback({ homeTimezone: value }, queryClient)}*/
            onValueChange={(value) => saveSettingWithFeedback({ homeTimezone: value }, updateSettings)}
          >
            <SelectTrigger className="w-48 h-10 rounded-[var(--radius-button)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.tz_tag} value={tz.tz_tag}>
                  {tz.tz_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Show organizer timezone on events">
          <Switch
            defaultChecked={settings.showOrganizerTimezone}
            /*onCheckedChange={(checked) => saveSettingWithFeedback({ showOrganizerTimezone: checked }, queryClient)}*/
            onCheckedChange={(checked) => saveSettingWithFeedback({ showOrganizerTimezone: checked }, updateSettings)}
          />
        </SettingRow>

        <SettingRow label="First day of week">
          <Select
            defaultValue={settings.firstDayOfWeek}
            /*onValueChange={(value) => saveSettingWithFeedback({ firstDayOfWeek: value as UserSettings["firstDayOfWeek"] }, queryClient)}*/
            onValueChange={(value) => saveSettingWithFeedback({ firstDayOfWeek: value as UserSettings["firstDayOfWeek"] }, updateSettings)}
          >
            <SelectTrigger className="w-32 h-10 rounded-[var(--radius-button)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Email detection">
          <Select
            defaultValue={settings.emailDetectionMode}
            /*onValueChange={(value) => saveSettingWithFeedback({ emailDetectionMode: value as UserSettings["emailDetectionMode"] }, queryClient)}*/
            onValueChange={(value) => saveSettingWithFeedback({ emailDetectionMode: value as UserSettings["emailDetectionMode"] }, updateSettings)}
          >
            <SelectTrigger className="w-48 h-10 rounded-[var(--radius-button)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ics_only">Calendar invites only (.ics)</SelectItem>
              <SelectItem value="smart">Also detect from emails</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Dark mode">
          <Switch
            defaultChecked={settings.darkMode}
            /*onCheckedChange={(checked) => saveSettingWithFeedback({ darkMode: checked }, queryClient)}*/
            onCheckedChange={(checked) => saveSettingWithFeedback({ darkMode: checked }, updateSettings)}
          />
        </SettingRow>

        {/* Sign out — no logic wired yet; will trigger auth.signOut() */}
        <div className="pt-4 border-t border-border">
          <Button variant="outline" className="w-full h-14 rounded-[var(--radius-button)] text-destructive border-destructive/30 gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Reusable row layout for a setting label + control pair. */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-[var(--min-tap)]">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}
