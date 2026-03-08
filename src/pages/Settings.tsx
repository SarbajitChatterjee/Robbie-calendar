/**
 * Settings Page — User preferences and account management.
 *
 * Displays the user's profile (avatar, name, email) and configurable
 * options for timezone, display, email detection, and appearance.
 * Settings are loaded via useUserSettings() and will be persisted
 * via updateUserSettings() when backend is wired.
 *
 * Timezone options are fetched dynamically from the `timezones` DB table
 * via useTimezones(). No hardcoded timezone entries.
 */

import { useUserSettings } from "@/hooks/useUserSettings";
import { useTimezones } from "@/hooks/useTimezones";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";

export default function SettingsView() {
  const { data: settings } = useUserSettings();
  const { data: timezones = [] } = useTimezones();

  if (!settings) return null;

  // Generate initials from display name for the avatar placeholder
  const initials = settings.displayName.slice(0, 2).toUpperCase();

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
          <Select defaultValue={settings.homeTimezone}>
            <SelectTrigger className="w-48 h-10 rounded-[var(--radius-button)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.iana_key} value={tz.iana_key}>
                  {tz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Show organizer timezone on events">
          <Switch defaultChecked={settings.showOrganizerTimezone} />
        </SettingRow>

        <SettingRow label="First day of week">
          <Select defaultValue={settings.firstDayOfWeek}>
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
          <Select defaultValue={settings.emailDetectionMode}>
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
          <Switch defaultChecked={settings.darkMode} />
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
