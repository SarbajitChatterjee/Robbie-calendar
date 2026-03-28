/**
 * TimezoneDisplay — Shows timezone information with optional comparison.
 *
 * Two modes:
 * - Full: Shows user's timezone and (if different) the organizer's timezone below it.
 * - Compact: Single-line inline display with a globe icon.
 *
 * Also exports TimezonePill — a standalone rounded pill showing the user's timezone,
 * used in the TodayView header.
 *
 * All timezone data is resolved dynamically from the `timezones` DB table
 * via useTimezones(). No hardcoded abbreviation or offset maps.
 */

import { Globe } from "lucide-react";
import { useTimezones } from "@/hooks/useTimezones";
import { formatTimezoneDisplay } from "@/lib/timezone-utils";
import { useEffect, useState } from "react";

interface TimezoneDisplayProps {
  userTimezone: string;
  organizerTimezone?: string;
  showOrganizer?: boolean;
  compact?: boolean;
}

export function TimezoneDisplay({ userTimezone, organizerTimezone, showOrganizer = true, compact = false }: TimezoneDisplayProps) {
  const { data: timezones = [] } = useTimezones();
  const user = formatTimezoneDisplay(userTimezone, timezones);
  const isDifferent = organizerTimezone && organizerTimezone !== userTimezone;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Globe className="w-3 h-3" />
        {user.full}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        Your time: {user.full}
      </div>
      {isDifferent && showOrganizer && (
        <div className="text-xs text-muted-foreground/70 ml-5">
          Organizer's time: {formatTimezoneDisplay(organizerTimezone!, timezones).full}
        </div>
      )}
    </div>
  );
}

// TimezonePill — Compact rounded pill showing the user's selected static timezone. Used in view headers.
// export function TimezonePill({ timezone }: { timezone: string }) {
//   const { data: timezones = [] } = useTimezones();
//   const { full } = formatTimezoneDisplay(timezone, timezones);
//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
//       <Globe className="w-3 h-3" />
//       Your time: {full}
//     </span>
//   );
// }

// Gets the actual timezone with the UTC interval and keeps it dynamic. 
// Any change manually would result it to change to accurately display the user's selected time+zon.
export function TimezonePill({ timezone }: { timezone: string }) {
  const { data: timezones = [] } = useTimezones();
  const { full } = formatTimezoneDisplay(timezone, timezones);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: timezone.replace(/^\(UTC[^)]+\)\s*/, ""), // strips "(UTC+05:30) " prefix
        }).format(new Date())
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground tabular-nums">
      <Globe className="w-3 h-3" />
      {full} · {time}
    </span>
  );
}