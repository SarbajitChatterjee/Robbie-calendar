/**
 * CalendarsView — The "Calendars" tab for managing connected accounts.
 *
 * Organized into three sections:
 * A. Connected Calendars — shows existing connections with sync status and toggle
 * B. Add a Source — cards for connecting new providers (Google, Apple, Outlook, etc.)
 * C. Privacy & Data — collapsible section explaining data handling + danger zone actions
 *
 * The connection toggle calls `toggleCalendarVisibility()` and provides
 * immediate toast feedback. When the backend is live, it persists the change;
 * while disconnected, the error toast lets the user know.
 */

import { useState } from "react";
import { useCalendars } from "@/hooks/useCalendars";
import { toggleCalendarVisibility } from "@/services/api";
import { CalendarConnection } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EventListSkeleton } from "@/components/shared/EventSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { ChevronRight, AlertTriangle, Plus, Server } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { initiateOAuthConnection } from "@/services/api";

/** Icon config for each calendar source type. */
const sourceIcons: Record<string, { bg: string; label: string }> = {
  google: { bg: "bg-[hsl(217,91%,93%)]", label: "G" },
  apple: { bg: "bg-[hsl(0,75%,93%)]", label: "🍎" },
  outlook: { bg: "bg-[hsl(174,58%,90%)]", label: "O" },
  caldav: { bg: "bg-[hsl(262,52%,93%)]", label: "S" },
  gmail: { bg: "bg-[hsl(4,90%,93%)]", label: "M" },
};

/** Badge labels for connection types (calendar only, email watch, or both). */
const connectionBadge: Record<string, { label: string; color: string }> = {
  calendar: { label: "Calendar", color: "bg-[hsl(217,91%,90%)] text-[hsl(217,91%,40%)]" },
  email_watch: { label: "Email Watch", color: "bg-[hsl(38,92%,88%)] text-[hsl(38,70%,35%)]" },
  both: { label: "Both", color: "bg-[hsl(262,52%,90%)] text-[hsl(262,52%,40%)]" },
};

export default function CalendarsView() {
  const { data: connections, isLoading, isError, refetch } = useCalendars();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-full pb-24">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold text-foreground">Calendars</h1>
      </header>

      {/* Section A: Connected calendar accounts */}
      <section className="px-5 space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Connected Calendars</h2>
        {isLoading && <EventListSkeleton count={3} />}
        {!isLoading && isError && <ErrorState message="Couldn't load your calendars" onRetry={refetch} />}
        {connections?.map((conn) => <ConnectionRow key={conn.id} connection={conn} />)}
      </section>

      {/* Section B: Add new source cards */}
      <section className="px-5 space-y-3 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Add a Source</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* <SourceCard icon="G" name="Google Calendar" subtitle="Sign in with Google" badge="Calendar + Email Watch" iconBg="bg-[hsl(217,91%,93%)]" /> */}
          <SourceCard icon="G" name="Google Calendar" subtitle="Sign in with Google" badge="Calendar + Email Watch" iconBg="bg-[hsl(217,91%,93%)]"
            onClick={async () => {
              try {
                  const { redirect_auth_url } = await initiateOAuthConnection("google");
                  window.location.href = redirect_auth_url;
              } catch (error) {
                  toast.error("Failed to connect Google Calendar. Please check or try again later");
              }
          }}/>
          <SourceCard icon="O" name="Microsoft Outlook" subtitle="Sign in with Microsoft" badge="Calendar + Email Watch" iconBg="bg-[hsl(174,58%,90%)]" />
          <SourceCard icon="A" name="Apple iCloud" subtitle="App-Specific Password" badge="Calendar only" iconBg="bg-[hsl(0,75%,93%)]" />
          <SourceCard icon="M" name="Gmail" subtitle="Watch for invitations" badge="Email detection only" iconBg="bg-[hsl(4,90%,93%)]" />
          <SourceCard icon={<Server className="w-5 h-5 text-muted-foreground" />} name="CalDAV / Other" subtitle="Connect any server" iconBg="bg-muted" />
          <div className="rounded-[var(--radius-card)] border border-dashed border-border p-4 flex flex-col items-center justify-center text-center opacity-50">
            <Plus className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">More coming soon</p>
          </div>
        </div>
      </section>

      {/* Section C: Privacy & data management */}
      <section className="px-5">
        <Collapsible open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <CollapsibleTrigger className="w-full rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))] flex items-center justify-between">
            <span className="font-semibold text-foreground">What we do with your data 🔒</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${privacyOpen ? "rotate-90" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-b-[var(--radius-card)] bg-card px-4 pb-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))] space-y-2 text-sm text-muted-foreground">
            <p>• We store encrypted connection keys so we can fetch your events.</p>
            <p>• Your actual events and emails are never saved to our servers.</p>
            <p>• We read only enough of each email to detect event invitations.</p>
            <p>• You can disconnect any source or delete everything at any time.</p>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" size="sm" className="rounded-[var(--radius-button)]">Download my data</Button>
              <Button variant="outline" size="sm" className="rounded-[var(--radius-button)] text-destructive border-destructive/30">Delete everything</Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}

/**
 * ConnectionRow — Displays a single connected calendar account.
 *
 * Shows: source icon, display name, account email, sync status (with
 * relative timestamp), connection type badge, color indicator, and
 * an enable/disable toggle switch.
 *
 * The toggle calls `toggleCalendarVisibility()` with optimistic feedback.
 */
function ConnectionRow({ connection }: { connection: CalendarConnection }) {
  const icon = sourceIcons[connection.source];
  const badge = connectionBadge[connection.connectionType];
  const isError = connection.syncStatus === "error";
  const syncLabel = isError
    ? connection.errorMessage || "Error — tap to fix"
    : connection.syncStatus === "syncing"
    ? "Syncing..."
    : `Synced ${formatDistanceToNow(new Date(connection.lastSyncedAt))} ago ✓`;

  /** Persists the toggle state; shows toast feedback on success/failure. */
  const handleToggle = async (enabled: boolean) => {
    try {
      await toggleCalendarVisibility(connection.id, enabled);
      toast.success(enabled ? "Calendar shown" : "Calendar hidden");
    } catch {
      toast.error("Couldn't update — try again");
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))] flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full ${icon.bg} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
        {icon.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{connection.displayName}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{connection.accountEmail}</p>
        <p className={`text-xs mt-0.5 ${isError ? "text-[hsl(var(--status-error))]" : "text-[hsl(var(--status-success))]"}`}>
          {isError && <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {syncLabel}
        </p>
      </div>
      {/* Color indicator strip */}
      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: connection.color }} />
      <Switch defaultChecked={connection.isEnabled} onCheckedChange={handleToggle} />
    </div>
  );
}

/** SourceCard — A clickable card for adding a new calendar source. */
function SourceCard({ icon, name, subtitle, badge, iconBg, onClick }: {
  icon: string | React.ReactNode;
  name: string;
  subtitle: string;
  badge?: string;
  iconBg: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))] flex flex-col items-center text-center space-y-2 hover:shadow-[0_4px_16px_hsl(var(--shadow-medium))] transition-shadow min-h-[var(--min-tap)]">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-sm font-bold`}>
        {icon}
      </div>
      <p className="font-medium text-sm text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {badge && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}
