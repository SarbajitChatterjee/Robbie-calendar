/**
 * MonthView — The "Month" tab showing a traditional calendar grid.
 *
 * Displays a 7-column grid (Mon–Sun) with event indicator dots on each day.
 * Tapping a day opens a bottom sheet with that day's events.
 * Supports month navigation (prev/next).
 *
 * Design decisions:
 * - Dots are capped at 3 per day: more than 3 become visually indistinguishable at small sizes.
 * - Dots use the event's source color for quick visual identification.
 */

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWeekEvents } from "@/hooks/useEvents";
import { CalendarEvent } from "@/types";
import { EventCard } from "@/components/shared/EventCard";
import { EventDetailSheet } from "@/components/shared/EventDetailSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function MonthView() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: events } = useWeekEvents();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calculate the month boundaries and the full calendar grid range
  const currentMonth = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Grid starts on Monday
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build a 2D array of weeks, each containing 7 days
  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  /**
   * Returns up to 3 unique event colors for a given day.
   * Used to render indicator dots below the day number.
   */
  const getDotsForDay = (d: Date) => {
    if (!events) return [];
    const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), d));
    const sources = [...new Set(dayEvents.map((e) => e.color))];
    return sources.slice(0, 3);
  };

  // Events for the selected day (shown in the bottom sheet)
  const dayEvents = selectedDay && events ? events.filter((e) => isSameDay(parseISO(e.start), selectedDay)) : [];

  return (
    <div className="flex flex-col min-h-full">
      {/* Month navigation header */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h1>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Weekday column headers */}
      <div className="grid grid-cols-7 px-5 pb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar grid — each cell is a day button with optional event dots */}
      <div className="flex-1 px-5 space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0">
            {week.map((d) => {
              const dots = getDotsForDay(d);
              const inMonth = isSameMonth(d, currentMonth);
              const today = isToday(d);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(d)}
                  className={`flex flex-col items-center justify-center py-2 min-h-[3rem] rounded-xl transition-colors ${
                    today ? "bg-[hsl(var(--fuse-primary))] text-white" : inMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground/40"
                  }`}
                >
                  <span className="text-sm font-medium">{format(d, "d")}</span>
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((color, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Day detail drawer — opens when a day cell is tapped */}
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent side="bottom" className="rounded-t-[var(--radius-card)] max-h-[60vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDay ? format(selectedDay, "EEEE, d MMMM") : ""}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4 pb-4">
            {dayEvents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No events this day</p>}
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} onTap={(e) => { setSelectedDay(null); setSelectedEvent(e); }} />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <EventDetailSheet event={selectedEvent} open={!!selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
