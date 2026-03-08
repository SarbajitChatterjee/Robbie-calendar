import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, differenceInMinutes, setHours } from "date-fns";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useWeekEvents } from "@/hooks/useEvents";
import { CalendarEvent } from "@/types";
import { EventDetailSheet } from "@/components/shared/EventDetailSheet";
import { EventListSkeleton } from "@/components/shared/EventSkeleton";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
const HOUR_HEIGHT = 60;

export default function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: events, isLoading } = useWeekEvents();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStart = addDays(baseWeekStart, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const now = new Date();
  const currentTimeTop = (now.getHours() - 7 + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {format(currentWeekStart, "MMM d")} – {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
        </h1>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Day labels */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] px-2 pb-2 border-b border-border">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className={`text-center text-xs font-medium ${isSameDay(d, now) ? "text-[hsl(var(--fuse-primary))]" : "text-muted-foreground"}`}>
            <div>{format(d, "EEE")}</div>
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm ${isSameDay(d, now) ? "bg-[hsl(var(--fuse-primary))] text-white" : ""}`}>
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      {isLoading ? (
        <div className="p-5"><EventListSkeleton count={2} /></div>
      ) : (
        <div className="flex-1 overflow-auto relative">
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
            {/* Hour labels */}
            {HOURS.map((h) => (
              <div key={h} className="col-start-1 text-xs text-muted-foreground text-right pr-2 -mt-2" style={{ gridRow: "auto", position: "absolute", top: (h - 7) * HOUR_HEIGHT }}>
                {format(setHours(new Date(), h), "h a")}
              </div>
            ))}

            {/* Grid lines */}
            {HOURS.map((h) => (
              <div key={`line-${h}`} className="col-span-full border-t border-border/50" style={{ position: "absolute", top: (h - 7) * HOUR_HEIGHT, left: "3rem", right: 0 }} />
            ))}

            {/* Current time line */}
            {weekOffset === 0 && currentTimeTop > 0 && currentTimeTop < HOURS.length * HOUR_HEIGHT && (
              <div className="absolute left-12 right-0 h-0.5 bg-[hsl(var(--status-error))] z-10" style={{ top: currentTimeTop }}>
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-error))] -mt-[3px] -ml-1" />
              </div>
            )}

            {/* Events */}
            {events?.filter((e) => !e.isAllDay).map((event) => {
              const start = parseISO(event.start);
              const dayIdx = days.findIndex((d) => isSameDay(d, start));
              if (dayIdx === -1) return null;
              const top = (start.getHours() - 7 + start.getMinutes() / 60) * HOUR_HEIGHT;
              const height = Math.max(differenceInMinutes(parseISO(event.end), start) / 60 * HOUR_HEIGHT, 20);

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="absolute rounded-lg px-1.5 py-1 text-left text-xs overflow-hidden hover:opacity-90 transition-opacity"
                  style={{
                    top,
                    height,
                    left: `calc(3rem + ${dayIdx} * ((100% - 3rem) / 7) + 2px)`,
                    width: `calc((100% - 3rem) / 7 - 4px)`,
                    backgroundColor: event.color + "22",
                    borderLeft: `3px solid ${event.color}`,
                  }}
                >
                  <p className="font-medium truncate" style={{ color: event.color }}>{event.title}</p>
                  <p className="text-muted-foreground truncate">{format(start, "h:mm a")}</p>
                  {event.meetingLink && <Video className="w-3 h-3 mt-0.5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <EventDetailSheet event={selectedEvent} open={!!selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
