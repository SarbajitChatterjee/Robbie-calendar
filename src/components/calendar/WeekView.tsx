/**
 * WeekView — Modernized 7-day hourly grid.
 *
 * - Sticky header (range + day labels + all-day strip)
 * - 72 px per hour with subtle half-hour dividers
 * - Today column tinted, today pill highlighted
 * - All-day events shown as pill chips in their own strip
 * - Auto-scrolls to ~1h before "now" on the current week
 * - Live current-time pill, ticks every minute
 * - "Today" jump button when not on the current week
 * - Overlap-aware side-by-side event packing (preserved)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parseISO,
  differenceInMinutes,
  setHours,
} from "date-fns";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useWeekEvents } from "@/hooks/useEvents";
import { CalendarEvent } from "@/types";
import { EventDetailSheet } from "@/components/shared/EventDetailSheet";
import { EventListSkeleton } from "@/components/shared/EventSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM
const HOUR_HEIGHT = 72;
const GUTTER = "3.5rem";

export default function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: events, isLoading, isError, refetch } = useWeekEvents();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Tick the current-time line every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStart = addDays(baseWeekStart, weekOffset * 7);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const todayIdx = days.findIndex((d) => isSameDay(d, now));
  const currentTimeTop = (now.getHours() - 7 + now.getMinutes() / 60) * HOUR_HEIGHT;
  const isCurrentWeek = weekOffset === 0;

  // Auto-scroll to ~1h before now when viewing this week
  useEffect(() => {
    if (!scrollRef.current || !isCurrentWeek || isLoading) return;
    const target = Math.max(0, currentTimeTop - HOUR_HEIGHT);
    scrollRef.current.scrollTo({ top: target, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrentWeek, isLoading]);

  const allDay = (events ?? []).filter((e) => e.isAllDay);
  const timed = (events ?? []).filter((e) => !e.isAllDay);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky chrome: header + day labels + all-day strip */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <header className="px-5 pt-6 pb-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex-1 text-center leading-tight">
            <h1 className="text-[17px] font-semibold text-foreground">
              {isCurrentWeek ? "This week" : `Week of ${format(currentWeekStart, "MMM d")}`}
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(currentWeekStart, "MMM d")} – {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </header>

        {/* Day labels */}
        <div
          className="grid pb-2"
          style={{ gridTemplateColumns: `${GUTTER} repeat(7, 1fr)` }}
        >
          <div />
          {days.map((d) => {
            const today = isSameDay(d, now);
            return (
              <div key={d.toISOString()} className="text-center">
                <div
                  className={`text-[11px] uppercase tracking-wide font-medium ${
                    today ? "text-[hsl(var(--fuse-primary))]" : "text-muted-foreground"
                  }`}
                >
                  {format(d, "EEE")}
                </div>
                <div
                  className={`w-8 h-8 mx-auto mt-0.5 rounded-full flex items-center justify-center text-sm font-medium ${
                    today
                      ? "bg-[hsl(var(--fuse-primary))] text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* All-day strip */}
        {allDay.length > 0 && (
          <div
            className="grid border-t border-border/60 bg-muted/20 py-1.5 max-h-[88px] overflow-y-auto"
            style={{ gridTemplateColumns: `${GUTTER} repeat(7, 1fr)` }}
          >
            <div className="text-[10px] text-muted-foreground/70 text-right pr-2 pt-1 uppercase tracking-wide">
              all-day
            </div>
            {days.map((d, i) => (
              <div key={i} className="px-1 space-y-1 min-h-[24px]">
                {allDay
                  .filter((e) => isSameDay(parseISO(e.start), d))
                  .map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="w-full text-left text-[11px] leading-tight truncate rounded-md px-1.5 py-0.5 hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: `${e.color}22`,
                        color: e.color,
                        borderLeft: `2px solid ${e.color}`,
                      }}
                    >
                      {e.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time grid */}
      {isLoading ? (
        <div className="p-5">
          <EventListSkeleton count={3} />
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState message="Couldn't load this week's events" onRetry={refetch} />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto relative">
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `${GUTTER} repeat(7, 1fr)`,
              height: HOURS.length * HOUR_HEIGHT,
            }}
          >
            {/* Today column tint */}
            {isCurrentWeek && todayIdx >= 0 && (
              <div
                aria-hidden
                className="absolute top-0 bottom-0 bg-muted/40 pointer-events-none"
                style={{
                  left: `calc(${GUTTER} + ${todayIdx} * ((100% - ${GUTTER}) / 7))`,
                  width: `calc((100% - ${GUTTER}) / 7)`,
                }}
              />
            )}

            {/* Hour labels */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-[11px] text-muted-foreground/70 text-right pr-2"
                style={{
                  position: "absolute",
                  top: (h - 7) * HOUR_HEIGHT - 6,
                  left: 0,
                  width: GUTTER,
                }}
              >
                {format(setHours(new Date(), h), "h a")}
              </div>
            ))}

            {/* Hour + half-hour grid lines */}
            {HOURS.map((h) => (
              <div key={`h-${h}`}>
                <div
                  className="border-t border-border/60"
                  style={{
                    position: "absolute",
                    top: (h - 7) * HOUR_HEIGHT,
                    left: GUTTER,
                    right: 0,
                  }}
                />
                <div
                  className="border-t border-dashed border-border/30"
                  style={{
                    position: "absolute",
                    top: (h - 7) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    left: GUTTER,
                    right: 0,
                  }}
                />
              </div>
            ))}

            {/* Vertical day separators */}
            {days.map((_, i) =>
              i === 0 ? null : (
                <div
                  key={`v-${i}`}
                  aria-hidden
                  className="absolute top-0 bottom-0 border-l border-border/40"
                  style={{ left: `calc(${GUTTER} + ${i} * ((100% - ${GUTTER}) / 7))` }}
                />
              )
            )}

            {/* Current time line + pill */}
            {isCurrentWeek &&
              currentTimeTop > 0 &&
              currentTimeTop < HOURS.length * HOUR_HEIGHT && (
                <>
                  <div
                    className="absolute h-px bg-[hsl(var(--status-error))] z-10"
                    style={{ top: currentTimeTop, left: GUTTER, right: 0 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-error))] -mt-[3px] -ml-1" />
                  </div>
                  <div
                    className="absolute z-10 text-[10px] font-medium text-[hsl(var(--status-error))] bg-background px-1 rounded"
                    style={{
                      top: currentTimeTop - 8,
                      left: 0,
                      width: GUTTER,
                      textAlign: "right",
                      paddingRight: 6,
                    }}
                  >
                    {format(now, "h:mm a")}
                  </div>
                </>
              )}

            {/* Timed events */}
            {(() => {
              type Positioned = {
                event: CalendarEvent;
                top: number;
                height: number;
                dayIdx: number;
                col: number;
                cols: number;
              };
              const positioned: Positioned[] = [];

              for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
                const dayEvents = timed
                  .filter((e) => isSameDay(parseISO(e.start), days[dayIdx]))
                  .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

                const columns: { end: number }[][] = [];
                const placements: {
                  event: CalendarEvent;
                  col: number;
                  startMs: number;
                  endMs: number;
                }[] = [];

                for (const ev of dayEvents) {
                  const startMs = parseISO(ev.start).getTime();
                  const endMs = parseISO(ev.end).getTime();
                  let placed = false;
                  for (let c = 0; c < columns.length; c++) {
                    const last = columns[c][columns[c].length - 1];
                    if (last.end <= startMs) {
                      columns[c].push({ end: endMs });
                      placements.push({ event: ev, col: c, startMs, endMs });
                      placed = true;
                      break;
                    }
                  }
                  if (!placed) {
                    columns.push([{ end: endMs }]);
                    placements.push({ event: ev, col: columns.length - 1, startMs, endMs });
                  }
                }

                for (const p of placements) {
                  let cols = 1;
                  for (const other of placements) {
                    if (other.startMs < p.endMs && other.endMs > p.startMs) {
                      cols = Math.max(cols, other.col + 1);
                    }
                  }
                  const start = parseISO(p.event.start);
                  const top = (start.getHours() - 7 + start.getMinutes() / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    (differenceInMinutes(parseISO(p.event.end), start) / 60) * HOUR_HEIGHT,
                    28
                  );
                  positioned.push({ event: p.event, top, height, dayIdx, col: p.col, cols });
                }
              }

              return positioned.map(({ event, top, height, dayIdx, col, cols }) => {
                const start = parseISO(event.start);
                const compact = height < 44;
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`absolute rounded-[10px] text-left overflow-hidden transition-all duration-150 ease-out hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fuse-primary))]/40 ${
                      compact ? "px-1.5 py-0.5" : "px-2 py-1.5"
                    }`}
                    style={{
                      top,
                      height,
                      left: `calc(${GUTTER} + ${dayIdx} * ((100% - ${GUTTER}) / 7) + ${col} * ((100% - ${GUTTER}) / 7 / ${cols}) + 3px)`,
                      width: `calc((100% - ${GUTTER}) / 7 / ${cols} - 6px)`,
                      backgroundImage: `linear-gradient(180deg, ${event.color}1F, ${event.color}0A)`,
                      boxShadow: `inset 3px 0 0 0 ${event.color}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p
                        className="font-medium text-[12px] leading-[1.15] truncate flex-1"
                        style={{ color: event.color }}
                      >
                        {event.title}
                      </p>
                      {event.meetingLink && (
                        <Video className="w-3 h-3 mt-[2px] text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {!compact && (
                      <p className="text-[11px] text-muted-foreground leading-[1.15] truncate mt-0.5">
                        {format(start, "h:mm a")}
                      </p>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
