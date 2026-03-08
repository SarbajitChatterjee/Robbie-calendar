import { useState } from "react";
import { format } from "date-fns";
import { Plus, Mail } from "lucide-react";
import { useWeekEvents, usePendingInbox } from "@/hooks/useEvents";
import { useUserSettings } from "@/hooks/useUserSettings";
import { CalendarEvent } from "@/types";
import { EventCard } from "@/components/shared/EventCard";
import { EventDetailSheet } from "@/components/shared/EventDetailSheet";
import { EventListSkeleton } from "@/components/shared/EventSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TimezonePill } from "@/components/shared/TimezoneDisplay";
import { Button } from "@/components/ui/button";
import { parseISO, isToday } from "date-fns";

function groupEvents(events: CalendarEvent[]) {
  const todayEvents = events.filter((e) => {
    const start = parseISO(e.start);
    return isToday(start);
  });

  const allDay = todayEvents.filter((e) => e.isAllDay);
  const morning = todayEvents.filter((e) => !e.isAllDay && parseISO(e.start).getHours() < 12);
  const afternoon = todayEvents.filter((e) => !e.isAllDay && parseISO(e.start).getHours() >= 12 && parseISO(e.start).getHours() < 17);
  const evening = todayEvents.filter((e) => !e.isAllDay && parseISO(e.start).getHours() >= 17);

  return { allDay, morning, afternoon, evening };
}

export default function TodayView() {
  const { data: events, isLoading } = useWeekEvents();
  const { data: pendingEvents } = usePendingInbox();
  const { data: settings } = useUserSettings();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const pendingCount = pendingEvents?.length ?? 0;
  const groups = events ? groupEvents(events) : null;
  const hasEvents = groups && (groups.allDay.length + groups.morning.length + groups.afternoon.length + groups.evening.length > 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 space-y-2">
        <h1 className="text-[28px] font-bold text-foreground">
          Today, {format(new Date(), "EEEE d MMMM")}
        </h1>
        {settings && <TimezonePill timezone={settings.homeTimezone} />}
      </header>

      {/* Email invitation banner */}
      {pendingCount > 0 && (
        <div className="mx-5 mb-4 rounded-[var(--radius-card)] bg-[hsl(38,92%,95%)] border border-[hsl(38,92%,80%)] p-4 flex items-center gap-3">
          <Mail className="w-5 h-5 text-[hsl(var(--status-warning))] flex-shrink-0" />
          <p className="text-sm text-foreground flex-1">
            📨 {pendingCount} new event invitation{pendingCount > 1 ? "s" : ""} found in your email
          </p>
          <Button variant="outline" size="sm" className="rounded-[var(--radius-button)] h-8 text-xs flex-shrink-0">
            Review
          </Button>
        </div>
      )}

      {/* Events */}
      <div className="flex-1 px-5 pb-24 space-y-6">
        {isLoading && <EventListSkeleton />}

        {!isLoading && !hasEvents && (
          <EmptyState
            emoji="☀️"
            title="Nothing scheduled today"
            subtitle="Enjoy your day! Events from your connected calendars will appear here."
          />
        )}

        {groups && (
          <>
            <EventSection title="All Day" events={groups.allDay} onTap={setSelectedEvent} />
            <EventSection title="Morning" events={groups.morning} onTap={setSelectedEvent} />
            <EventSection title="Afternoon" events={groups.afternoon} onTap={setSelectedEvent} />
            <EventSection title="Evening" events={groups.evening} onTap={setSelectedEvent} />
          </>
        )}
      </div>

      {/* FAB */}
      <button className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[hsl(var(--fuse-primary))] text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-30 md:bottom-8">
        <Plus className="w-6 h-6" />
      </button>

      <EventDetailSheet event={selectedEvent} open={!!selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function EventSection({ title, events, onTap }: { title: string; events: CalendarEvent[]; onTap: (e: CalendarEvent) => void }) {
  if (events.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onTap={onTap} />
      ))}
    </section>
  );
}
