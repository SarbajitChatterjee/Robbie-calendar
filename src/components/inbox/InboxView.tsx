/**
 * InboxView — The "Inbox" tab for reviewing email-detected events.
 *
 * Shows two sub-tabs:
 * - "Pending Review": events detected from emails awaiting user action
 * - "Already Added": events the user has accepted
 *
 * Accept/dismiss actions are optimistic (local state updates immediately).
 * The service layer calls happen in the background via the API functions.
 */

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { usePendingInbox } from "@/hooks/useEvents";
import { acceptEmailEvent, dismissEmailEvent } from "@/services/api";
import { ErrorState } from "@/components/shared/ErrorState";
import { CalendarEvent } from "@/types";
import { EventDetailSheet } from "@/components/shared/EventDetailSheet";
import { EventListSkeleton } from "@/components/shared/EventSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { MapPin, Link2, Users, Clock } from "lucide-react";
import { toast } from "sonner";

export default function InboxView() {
  const { data: pendingEvents, isLoading, isError, refetch } = usePendingInbox();
  const [activeTab, setActiveTab] = useState<"pending" | "added">("pending");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Track accepted/dismissed IDs locally for optimistic UI updates
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  // Filter events based on local acceptance/dismissal state
  const pending = pendingEvents?.filter((e) => !dismissed.has(e.id) && !accepted.has(e.id)) ?? [];
  const addedEvents = pendingEvents?.filter((e) => accepted.has(e.id)) ?? [];

  const handleAccept = async (id: string) => {
    setAccepted((s) => new Set(s).add(id));
    toast.success("Event added to your calendar");
    try {
      await acceptEmailEvent(id, "default");
    } catch {
      setAccepted((s) => { const next = new Set(s); next.delete(id); return next; });
      toast.error("Failed to add event — please try again");
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissed((s) => new Set(s).add(id));
    toast("Event dismissed");
    try {
      await dismissEmailEvent(id);
    } catch {
      setDismissed((s) => { const next = new Set(s); next.delete(id); return next; });
      toast.error("Failed to dismiss event — please try again");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header with pending count badge */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold text-foreground">
          Event Invitations
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(var(--status-warning))] text-white text-sm font-semibold">
              {pending.length}
            </span>
          )}
        </h1>
      </header>

      {/* Tab switcher: Pending Review / Already Added */}
      <div className="flex px-5 gap-2 mb-4">
        {(["pending", "added"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 h-10 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {tab === "pending" ? "Pending Review" : "Already Added"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-5 pb-24 space-y-4">
        {isLoading && <EventListSkeleton />}
        {!isLoading && isError && <ErrorState message="Couldn't load invitations" onRetry={refetch} />}

        {activeTab === "pending" && !isLoading && (
          <>
            {pending.length === 0 && (
              <EmptyState emoji="👀" title="No new invitations" subtitle="We'll watch your inbox for you." />
            )}
            {pending.map((event) => (
              <PendingCard
                key={event.id}
                event={event}
                onTap={() => setSelectedEvent(event)}
                onAccept={() => handleAccept(event.id)}
                onDismiss={() => handleDismiss(event.id)}
              />
            ))}
          </>
        )}

        {activeTab === "added" && (
          <>
            {addedEvents.length === 0 && (
              <EmptyState emoji="✅" title="No added events yet" subtitle="Events you accept will appear here." />
            )}
            {addedEvents.map((event) => (
              <div key={event.id} className="rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))]">
                <p className="font-semibold text-foreground">{event.title}</p>
                <p className="text-sm text-muted-foreground">{format(parseISO(event.start), "EEE, d MMM · h:mm a")}</p>
                <p className="text-xs text-muted-foreground mt-1">Added to Work calendar</p>
              </div>
            ))}
          </>
        )}
      </div>

      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAccept={(id) => { handleAccept(id); setSelectedEvent(null); }}
        onDismiss={(id) => { handleDismiss(id); setSelectedEvent(null); }}
      />
    </div>
  );
}

/**
 * PendingCard — A rich card for a single pending email-detected event.
 *
 * Shows detection method badge (ICS attachment vs smart detection),
 * event metadata (time, location, meeting link, attendees),
 * and accept/dismiss action buttons.
 */
function PendingCard({ event, onTap, onAccept, onDismiss }: {
  event: CalendarEvent;
  onTap: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const start = parseISO(event.start);
  return (
    <button onClick={onTap} className="w-full text-left rounded-[var(--radius-card)] bg-card p-5 shadow-[0_2px_8px_hsl(var(--shadow-soft))] space-y-3 hover:shadow-[0_4px_16px_hsl(var(--shadow-medium))] transition-shadow">
      {/* Title + detection method badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          event.emailDetectionMethod === "ics_attachment"
            ? "bg-[hsl(217,91%,93%)] text-[hsl(217,91%,40%)]"
            : "bg-[hsl(38,92%,90%)] text-[hsl(38,70%,35%)]"
        }`}>
          {event.emailDetectionMethod === "ics_attachment" ? "📎 Calendar invite" : "✉️ Smart detection"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        From: {event.emailSender} via your Gmail
      </p>

      {/* Metadata grid: time, location, meeting link, attendees */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {format(start, "EEE, d MMM · h:mm a")}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {event.location || "Online"}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Link2 className="w-3.5 h-3.5" />
          {event.meetingLink ? `${event.meetingPlatform || "Meeting"} link found` : "No link"}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {event.attendees?.length || 0} attendees
        </div>
      </div>

      {/* Action buttons — stopPropagation prevents triggering the card's onTap */}
      <div className="flex gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
        <Button
          onClick={onAccept}
          className="flex-1 h-12 rounded-[var(--radius-button)] bg-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success))]/90 text-white"
        >
          Add to Calendar ✓
        </Button>
        <Button
          variant="outline"
          onClick={onDismiss}
          className="flex-1 h-12 rounded-[var(--radius-button)]"
        >
          Dismiss
        </Button>
      </div>
    </button>
  );
}
