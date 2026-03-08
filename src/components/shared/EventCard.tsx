import { CalendarEvent } from "@/types";
import { format, parseISO } from "date-fns";
import { MapPin, Mail } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { JoinButton } from "./JoinButton";

interface EventCardProps {
  event: CalendarEvent;
  onTap?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onTap }: EventCardProps) {
  const startDate = parseISO(event.start);
  const endDate = parseISO(event.end);
  const timeStr = event.isAllDay
    ? "All Day"
    : `${format(startDate, "h:mm")} – ${format(endDate, "h:mm a")}`;

  const showOrganizerTz = event.organizerTimezone !== event.userTimezone;
  const hasError = event.source === "outlook"; // mock: Outlook in error state

  return (
    <button
      onClick={() => onTap?.(event)}
      className="w-full text-left flex gap-3 rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))] hover:shadow-[0_4px_16px_hsl(var(--shadow-medium))] transition-shadow min-h-[var(--min-tap)] relative group"
    >
      {/* Color bar */}
      <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[18px] leading-tight text-foreground truncate">
            {event.title}
          </h3>
          {event.detectedFromEmail && (
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Time */}
        <p className="text-sm text-muted-foreground">{timeStr}</p>

        {/* Organizer timezone */}
        {showOrganizerTz && !event.isAllDay && (
          <p className="text-xs text-muted-foreground/70">
            Organizer's time: {event.organizerTimezone.split("/").pop()?.replace("_", " ")}
          </p>
        )}

        {/* Source + Location row */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <SourceBadge source={event.source} calendarName={event.calendarName} />
          {event.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
        </div>

        {/* Warning for errored source */}
        {hasError && (
          <p className="text-xs text-[hsl(var(--status-warning))] mt-1">
            ⚠ Calendar connection issue — event may be outdated
          </p>
        )}
      </div>

      {/* Join button */}
      {event.meetingLink && event.meetingPlatform && (
        <div className="flex-shrink-0 self-center">
          <JoinButton meetingLink={event.meetingLink} platform={event.meetingPlatform} compact />
        </div>
      )}
    </button>
  );
}
