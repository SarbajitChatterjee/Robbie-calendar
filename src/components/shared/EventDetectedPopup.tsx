/**
 * EventDetectedPopup — Toast-style notification for newly detected events.
 *
 * Slides in bottom-right (or full-width on mobile) when the detection hook
 * finds a pending email-derived event. The user can accept it into a specific
 * calendar, dismiss it, or defer to the Inbox tab. Auto-dismisses to "check
 * later" after 12 seconds via the animated progress bar at the top.
 */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { X, MapPin, Video } from "lucide-react";
import { CalendarEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { useCalendars } from "@/hooks/useCalendars";

interface EventDetectedPopupProps {
  event: CalendarEvent;
  queueCount: number;
  onAccept: (targetCalendarId: string) => Promise<void>;
  onCheckLater: () => void;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 12000;

export default function EventDetectedPopup({
  event,
  queueCount,
  onAccept,
  onCheckLater,
  onDismiss,
}: EventDetectedPopupProps) {
  const { data: connections } = useCalendars();
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [barWidth, setBarWidth] = useState("100%");

  // Reset transient state whenever a new event takes the popup slot.
  useEffect(() => {
    setShowCalendarPicker(false);
    setIsAccepting(false);
    setBarWidth("100%");
  }, [event.id]);

  // Kick off the progress bar shrink + auto-dismiss timer.
  useEffect(() => {
    const startTimer = setTimeout(() => setBarWidth("0%"), 50);
    const autoTimer = setTimeout(() => onCheckLater(), AUTO_DISMISS_MS);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(autoTimer);
    };
  }, [event.id, onCheckLater]);

  const isIcs = event.emailDetectionMethod === "ics_attachment";
  const pillText = isIcs
    ? "✦ Robbie found a calendar invite"
    : "✦ Robbie interpreted an email";
  const pillClasses = isIcs
    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
    : "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400";

  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayLabel = format(start, "EEEE, d MMM");
  const timeLabel = event.isAllDay
    ? `${dayLabel} · All day`
    : `${dayLabel} · ${format(start, "h:mm")} – ${format(end, "h:mm a")}`;

  const showOrganizerTz =
    !event.isAllDay &&
    event.organizerTimezone &&
    event.userTimezone &&
    event.organizerTimezone !== event.userTimezone;
  const organizerTimeLabel = showOrganizerTz
    ? `Organizer's time: ${start.toLocaleString("en-US", {
        timeZone: event.organizerTimezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} (${event.organizerTimezone.split("/").pop()})`
    : null;

  const enabledConnections = (connections ?? []).filter((c) => c.isEnabled);

  const handlePick = async (connectionId: string) => {
    setIsAccepting(true);
    try {
      await onAccept(connectionId);
    } catch {
      setIsAccepting(false);
      setShowCalendarPicker(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-50 inset-x-3 bottom-4 md:inset-auto md:right-6 md:bottom-6 md:w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Auto-dismiss progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary ease-linear"
            style={{
              width: barWidth,
              transitionProperty: "width",
              transitionDuration: `${AUTO_DISMISS_MS}ms`,
              transitionTimingFunction: "linear",
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Detection pill */}
        <div className="flex justify-center mt-3">
          <span
            className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${pillClasses}`}
          >
            {pillText}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 pt-2">
          <h3 className="font-semibold text-base text-foreground line-clamp-2 mb-1">
            {event.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-0">{timeLabel}</p>
          {organizerTimeLabel && (
            <p className="text-xs text-muted-foreground mb-2">{organizerTimeLabel}</p>
          )}
          {!organizerTimeLabel && <div className="mb-2" />}

          {event.meetingLink ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {event.meetingPlatform
                  ? `${event.meetingPlatform[0].toUpperCase()}${event.meetingPlatform.slice(1)} meeting`
                  : "Online meeting"}
              </span>
            </div>
          ) : event.location ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          ) : null}

          {event.emailDetectionMethod === "smart_parse" && (
            <p className="text-xs text-muted-foreground/70 italic mt-1">
              Details interpreted from email — please verify before joining
            </p>
          )}

          {queueCount > 1 && (
            <button
              type="button"
              onClick={onCheckLater}
              className="block text-xs text-muted-foreground underline mt-2 hover:text-foreground transition-colors"
            >
              +{queueCount - 1} more found in your inbox
            </button>
          )}

          {/* Footer */}
          <div className="mt-4">
            {!showCalendarPicker ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={onCheckLater}
                >
                  Check in Inbox
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 rounded-xl"
                  disabled={isAccepting}
                  onClick={() => setShowCalendarPicker(true)}
                >
                  {isAccepting ? "Adding..." : "Add to Calendar ✓"}
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Add to which calendar?
                </p>
                <div className="max-h-44 overflow-y-auto -mx-1 px-1">
                  {enabledConnections.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No enabled calendars available.
                    </p>
                  ) : (
                    enabledConnections.map((conn) => (
                      <button
                        key={conn.id}
                        type="button"
                        disabled={isAccepting}
                        onClick={() => handlePick(conn.id)}
                        className="w-full text-left flex items-center gap-2 hover:bg-muted rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: conn.color }}
                        />
                        <span className="text-sm text-foreground truncate">
                          {conn.displayName}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendarPicker(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
