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
// import { toggleCalendarVisibility, syncNow } from "@/services/api";
import {
  toggleCalendarVisibility,
  syncNow,
  disconnectCalendar,
  updateCalendarColor,
  startEmailWatch,
  stopEmailWatch,
} from "@/services/api";
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

import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreHorizontal, Mail, Trash2, RefreshCw } from "lucide-react";

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
        <div className="mt-3 flex justify-center">
          <SourceLegend />
        </div>
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
  // const icon = sourceIcons[connection.source];
  // const badge = connectionBadge[connection.connectionType];
  console.log("connection data:", JSON.stringify(connection));
  const icon = sourceIcons[connection.source] ?? { bg: "bg-muted", label: "?" };
  const badge = connectionBadge[connection.connectionType] ?? { label: connection.connectionType, color: "bg-muted text-muted-foreground" };
  const isError = connection.syncStatus === "error";

  // for showing loader animation
  const [isSyncing, setIsSyncing] = useState(false);
  const [watchPending, setWatchPending] = useState(false);

  const qc = useQueryClient();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  // const [colorOpen, setColorOpen] = useState(false);

  const COLOR_PRESETS = [
    "#C8B800", "#0078D4", "#FF3B30", "#34C759",
    "#AF52DE", "#FF9500", "#5AC8FA", "#8E8E93",
  ];

  const canWatchEmail = connection.connectionType !== "calendar";

  const handleColorChange = async (next: string) => {
    try {
      await updateCalendarColor(connection.id, next);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["calendars"] }),
        qc.invalidateQueries({ queryKey: ["events"] }),
      ]);
      toast.success("Color updated");
    } catch {
      toast.error("Couldn't update color");
    }
  };

  const handleEmailWatchToggle = async (next: boolean) => {
    if (watchPending) return;
    setWatchPending(true);
    try {
      if (next) {
        await startEmailWatch(connection.id);
        toast.success("Email watch on — scanning started");
      } else {
        await stopEmailWatch(connection.id);
        toast.success("Email watch off");
      }
      await qc.invalidateQueries({ queryKey: ["calendars"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Couldn't update email watch";
      toast.error(msg);
      await qc.invalidateQueries({ queryKey: ["calendars"] });
    } finally {
      setWatchPending(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectCalendar(connection.id);
      await qc.invalidateQueries({ queryKey: ["calendars"] });
      await qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Calendar disconnected");
    } catch {
      toast.error("Couldn't disconnect — try again");
    } finally {
      setConfirmDisconnect(false);
    }
  };

  const syncLabel = isError
    ? connection.errorMessage || "Error — tap to fix"
    : connection.syncStatus === "syncing"
    ? "Syncing..."
    :connection.lastSyncedAt
    ? `Synced ${formatDistanceToNow(new Date(connection.lastSyncedAt))} ago ✓`
    : "Not synced yet — tap to sync";

  /** Persists the toggle state; shows toast feedback on success/failure. */
  const handleToggle = async (enabled: boolean) => {
    try {
      await toggleCalendarVisibility(connection.id, enabled);
      await Promise.all([
        qc.refetchQueries({ queryKey: ["calendars"], type: "active" }),
        qc.invalidateQueries({ queryKey: ["events"] }),
      ]);
      toast.success(enabled ? "Calendar shown" : "Calendar hidden");
    } catch {
      toast.error("Couldn't update — try again");
      await qc.invalidateQueries({ queryKey: ["calendars"] });
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
          {connection.emailWatchEnabled && connection.connectionType !== "calendar" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(38,92%,88%)] text-[hsl(38,70%,35%)]">
              <Mail className="w-2.5 h-2.5" />
              Watching
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{connection.accountEmail}</p>
        <p className={`text-xs mt-0.5 ${isError ? "text-[hsl(var(--status-error))]" : "text-[hsl(var(--status-success))]"}`}>
          {isError && <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {syncLabel}
        </p>
      </div>
      {/* Color indicator strip */}
      {/* <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: connection.color }} />
      <Switch defaultChecked={connection.isEnabled} onCheckedChange={handleToggle} /> */}

      {/* Color indicator — color is now edited from the menu */}
      <div
        aria-hidden="true"
        className="w-1.5 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: connection.color }}
      />

      {/* Sync — icon button, matches the … menu style */}
      <button
        aria-label={isSyncing ? "Syncing" : "Sync now"}
        disabled={isSyncing}
        onClick={async () => {
          try {
            setIsSyncing(true);
            await syncNow(connection.id);
            await qc.invalidateQueries({ queryKey: ["calendars"] });
            await qc.invalidateQueries({ queryKey: ["events"] });
            toast.success("Sync started");
          } catch {
            toast.error("Sync failed — try again");
          } finally {
            setIsSyncing(false);
          }
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      </button>


      {/* Overflow menu — change color, email watch, disconnect */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="More actions"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="w-64 rounded-[var(--radius-card)] p-2">
          {/* Inline color picker — no nested popover, so no flash */}
          <div className="px-2 pt-1 pb-2">
            <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Calendar color
            </p>
            <div className="grid grid-cols-8 gap-1.5 mb-2">
              {COLOR_PRESETS.map((c) => {
                const selected = connection.color?.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    aria-label={`Set color ${c}`}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                      selected ? "ring-2 ring-foreground ring-offset-1" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="color"
                value={connection.color || "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border border-border"
              />
              Custom color
            </label>
          </div>

          <DropdownMenuSeparator />

          {/* Watch inbox — clear on/off Switch with status label; menu stays open on toggle */}
          {canWatchEmail && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span className="flex flex-col leading-tight">
                  <span>Watch inbox</span>
                  <span className="text-[10px] text-muted-foreground">
                    {watchPending
                      ? (connection.emailWatchEnabled ? "Stopping…" : "Starting scan…")
                      : (connection.emailWatchEnabled ? "On" : "Off")}
                  </span>
                </span>
              </span>
              <Switch
                checked={!!connection.emailWatchEnabled}
                disabled={watchPending}
                onCheckedChange={handleEmailWatchToggle}
                className="scale-75"
              />
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setConfirmDisconnect(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visibility toggle — unchanged */}
      <Switch checked={connection.isEnabled} onCheckedChange={handleToggle} />

      {/* Confirm dialog for disconnect */}
      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect this calendar?"
        description={`We'll remove ${connection.displayName} (${connection.accountEmail}) and stop syncing its events. You can reconnect it later.`}
        confirmLabel="Disconnect"
        destructive
        onConfirm={handleDisconnect}
      />
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
