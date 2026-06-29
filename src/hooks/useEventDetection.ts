/**
 * useEventDetection — Realtime detector for email-derived calendar events.
 *
 * Subscribes to INSERTs on `public.events` via Supabase Realtime and queues
 * any rows where `acceptance_status === "pending_review"` and
 * `detected_from_email === true`. Exposes the queue head plus accept/dismiss/
 * snooze actions so a popup can react to incoming detections.
 *
 * In dev, two mock events are injected (3s + 5s after mount) so the popup +
 * queue flow can be exercised without backend support.
 */

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { acceptEmailEvent, dismissEmailEvent } from "@/services/api";
import { CalendarEvent } from "@/types";

type DbEventRow = {
  acceptance_status?: string;
  detected_from_email?: boolean;
  [key: string]: unknown;
};

export function useEventDetection() {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<CalendarEvent[]>([]);

  const enqueue = useCallback(
    (evt: CalendarEvent) => {
      setQueue((prev) => {
        if (prev.some((e) => e.id === evt.id)) return prev;
        return [...prev, evt];
      });
      queryClient.invalidateQueries({ queryKey: ["events", "pending-inbox"] });
    },
    [queryClient],
  );

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("email-detections")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "events" },
        (payload: { new: DbEventRow }) => {
          const row = payload.new;
          if (
            row?.acceptance_status === "pending_review" &&
            row?.detected_from_email === true
          ) {
            enqueue(row as unknown as CalendarEvent);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enqueue]);

  // Dev-only mock data so the popup + queue can be exercised end-to-end.
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const MOCK_ICS: CalendarEvent = {
      id: "mock-detect-001",
      title: "Q3 Planning Workshop",
      start: new Date(Date.now() + 86400000 * 3).toISOString(),
      end: new Date(Date.now() + 86400000 * 3 + 10800000).toISOString(),
      isAllDay: false,
      organizerTimezone: "America/New_York",
      userTimezone: "Asia/Singapore",
      source: "google",
      calendarId: "mock-cal-001",
      calendarName: "Gmail",
      accountEmail: "user@gmail.com",
      color: "#4285F4",
      isReadOnly: false,
      detectedFromEmail: true,
      emailDetectionMethod: "ics_attachment",
      emailSender: "manager@company.com",
      acceptanceStatus: "pending_review",
      attendees: [],
    };

    const MOCK_SMART: CalendarEvent = {
      id: "mock-detect-002",
      title: "Flight SQ321 Singapore → London",
      start: new Date(Date.now() + 86400000 * 6 + 86100000).toISOString(),
      end: new Date(Date.now() + 86400000 * 7 + 50400000).toISOString(),
      isAllDay: false,
      organizerTimezone: "Asia/Singapore",
      userTimezone: "Asia/Singapore",
      source: "google",
      calendarId: "mock-cal-001",
      calendarName: "Gmail",
      accountEmail: "user@gmail.com",
      color: "#4285F4",
      isReadOnly: false,
      detectedFromEmail: true,
      emailDetectionMethod: "smart_parse",
      emailSender: "bookings@singaporeair.com",
      acceptanceStatus: "pending_review",
      attendees: [],
    };

    const t1 = setTimeout(() => enqueue(MOCK_ICS), 3000);
    const t2 = setTimeout(() => enqueue(MOCK_SMART), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enqueue]);

  const currentEvent = queue[0] ?? null;

  const acceptCurrent = useCallback(
    async (targetCalendarId: string) => {
      if (!currentEvent) return;
      try {
        await acceptEmailEvent(currentEvent.id, targetCalendarId);
        setQueue((prev) => prev.slice(1));
        queryClient.invalidateQueries({ queryKey: ["events", "pending-inbox"] });
      } catch (err) {
        throw err;
      }
    },
    [currentEvent, queryClient],
  );

  const dismissCurrent = useCallback(async () => {
    if (!currentEvent) return;
    try {
      await dismissEmailEvent(currentEvent.id);
    } finally {
      setQueue((prev) => prev.slice(1));
      queryClient.invalidateQueries({ queryKey: ["events", "pending-inbox"] });
    }
  }, [currentEvent, queryClient]);

  const snoozeAll = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    currentEvent,
    queueCount: queue.length,
    acceptCurrent,
    dismissCurrent,
    snoozeAll,
  };
}
