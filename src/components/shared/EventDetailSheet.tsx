/**
 * EventDetailSheet — Full event detail view in a bottom sheet.
 *
 * Shows comprehensive event information: time, timezone comparison,
 * meeting join button, location, attendees, and description.
 * Action buttons change based on event status:
 * - Pending: Accept / Dismiss
 * - Read-only: Copy to my calendar
 * - Editable: Edit / Delete
 *
 * Design decisions:
 * - Attendees are capped at 5 to prevent layout overflow; a "Show all" link handles the rest.
 * - The color strip at the top provides instant visual identification of the source calendar.
 */

import { CalendarEvent } from "@/types";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { MapPin, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "./SourceBadge";
import { JoinButton } from "./JoinButton";
import { TimezoneDisplay } from "./TimezoneDisplay";

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onAccept?: (eventId: string, calendarId: string) => void;
  onDismiss?: (eventId: string) => void;
}

export function EventDetailSheet({ event, open, onClose, onAccept, onDismiss }: EventDetailSheetProps) {
  if (!event) return null;

  const startDate = parseISO(event.start);
  const endDate = parseISO(event.end);
  const duration = differenceInMinutes(endDate, startDate);

  // Format duration as human-readable string (e.g., "1 hour 30 min")
  const durationStr = duration >= 60
    ? `${Math.floor(duration / 60)} hour${duration >= 120 ? "s" : ""}${duration % 60 ? ` ${duration % 60} min` : ""}`
    : `${duration} min`;

  const isPending = event.acceptanceStatus === "pending_review";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[var(--radius-card)] max-h-[90vh] overflow-y-auto p-0">
        {/* Color strip — matches source calendar color */}
        <div className="h-1.5 rounded-t-[var(--radius-card)]" style={{ backgroundColor: event.color }} />

        <div className="p-5 space-y-6">
          {/* Header: title + source badge */}
          <SheetHeader className="space-y-2 p-0">
            <SheetTitle className="text-2xl font-bold text-foreground pr-8">{event.title}</SheetTitle>
            <SourceBadge source={event.source} calendarName={event.calendarName || "Detected from email"} />
          </SheetHeader>

          {/* Time & timezone section */}
          <section className="space-y-2">
            <p className="font-medium text-foreground">{format(startDate, "EEEE, d MMMM yyyy")}</p>
            {!event.isAllDay && (
              <>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
                </p>
                <TimezoneDisplay
                  userTimezone={event.userTimezone}
                  organizerTimezone={event.organizerTimezone}
                />
                <p className="text-xs text-muted-foreground">Duration: {durationStr}</p>
              </>
            )}
            {event.isAllDay && <p className="text-sm text-muted-foreground">All day event</p>}
          </section>

          {/* Join meeting section */}
          {event.meetingLink && (
            <section className="space-y-2">
              <JoinButton meetingLink={event.meetingLink} platform={event.meetingPlatform} />
              {event.meetingId && (
                <p className="text-xs text-muted-foreground">
                  Meeting ID: {event.meetingId}
                  {event.meetingPasscode && ` · Passcode: ${event.meetingPasscode}`}
                </p>
              )}
              {event.detectedFromEmail && (
                <p className="text-xs text-muted-foreground">Link found in your email invitation</p>
              )}
            </section>
          )}

          {/* Location with "Open in Maps" link */}
          {event.location && (
            <section className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">{event.location}</p>
                <button className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  Open in Maps <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </section>
          )}

          {/* Attendees section — capped at 5 to prevent layout overflow */}
          {(event.organizer || event.attendees?.length) && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">People</h4>
              {event.organizer && (
                <PersonRow
                  name={event.organizer.name}
                  email={event.organizer.email}
                  badge="Organizer"
                />
              )}
              {event.attendees?.slice(0, 5).map((a) => (
                <PersonRow
                  key={a.email}
                  name={a.name}
                  email={a.email}
                  rsvp={a.rsvpStatus}
                  isYou={a.isCurrentUser}
                />
              ))}
              {(event.attendees?.length ?? 0) > 5 && (
                <p className="text-xs text-primary cursor-pointer hover:underline">
                  Show all {event.attendees!.length} attendees
                </p>
              )}
            </section>
          )}

          {/* Description + email snippet */}
          {event.description && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">About this event</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
              {event.emailSnippet && (
                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">From your email:</p>
                  <p className="italic">{event.emailSnippet}</p>
                </div>
              )}
            </section>
          )}

          {/* Action buttons — context-dependent */}
          <section className="flex gap-3 pt-2 pb-2">
            {isPending ? (
              <>
                <Button
                  className="flex-1 h-14 text-base rounded-[var(--radius-button)] bg-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success))]/90 text-white"
                  onClick={() => onAccept?.(event.id, "cal-google-work")}
                >
                  Add to Calendar ✓
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-base rounded-[var(--radius-button)]"
                  onClick={() => onDismiss?.(event.id)}
                >
                  Dismiss
                </Button>
              </>
            ) : event.isReadOnly ? (
              <Button variant="outline" className="flex-1 h-14 text-base rounded-[var(--radius-button)]">
                Copy to my calendar
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 h-14 text-base rounded-[var(--radius-button)]">
                  Edit
                </Button>
                <Button variant="destructive" className="flex-1 h-14 text-base rounded-[var(--radius-button)]">
                  Delete
                </Button>
              </>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * PersonRow — Displays a single attendee or organizer.
 *
 * Shows: avatar (initials), name, email, optional role badge, and RSVP status.
 * RSVP colors: green=accepted, red=declined, muted=pending/unknown.
 */
function PersonRow({ name, email, badge, rsvp, isYou }: {
  name: string;
  email: string;
  badge?: string;
  rsvp?: string;
  isYou?: boolean;
}) {
  const rsvpColors: Record<string, string> = {
    accepted: "text-[hsl(var(--status-success))]",
    declined: "text-[hsl(var(--status-error))]",
    pending: "text-muted-foreground",
    unknown: "text-muted-foreground",
  };
  const rsvpLabels: Record<string, string> = {
    accepted: "Accepted ✓",
    declined: "Declined ✗",
    pending: "Pending ·",
    unknown: "",
  };
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {name} {isYou && <span className="text-xs text-muted-foreground">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>
      {badge && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {rsvp && rsvpLabels[rsvp] && (
        <span className={`text-xs font-medium ${rsvpColors[rsvp]}`}>{rsvpLabels[rsvp]}</span>
      )}
    </div>
  );
}
