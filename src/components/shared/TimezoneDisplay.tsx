import { Globe } from "lucide-react";

interface TimezoneDisplayProps {
  userTimezone: string;
  organizerTimezone?: string;
  showOrganizer?: boolean;
  compact?: boolean;
}

const tzAbbreviations: Record<string, string> = {
  "Asia/Singapore": "SGT",
  "Europe/Berlin": "CET",
  "America/New_York": "EST",
  "America/Los_Angeles": "PST",
  "Europe/London": "GMT",
  "Asia/Tokyo": "JST",
};

const tzOffsets: Record<string, string> = {
  "Asia/Singapore": "UTC+8",
  "Europe/Berlin": "UTC+1",
  "America/New_York": "UTC-5",
  "America/Los_Angeles": "UTC-8",
  "Europe/London": "UTC+0",
  "Asia/Tokyo": "UTC+9",
};

function formatTz(tz: string) {
  const abbr = tzAbbreviations[tz] || tz.split("/").pop()?.replace("_", " ") || tz;
  const offset = tzOffsets[tz] || "";
  return { abbr, offset, full: offset ? `${abbr} (${offset})` : abbr };
}

export function TimezoneDisplay({ userTimezone, organizerTimezone, showOrganizer = true, compact = false }: TimezoneDisplayProps) {
  const user = formatTz(userTimezone);
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
          Organizer's time: {formatTz(organizerTimezone!).full}
        </div>
      )}
    </div>
  );
}

export function TimezonePill({ timezone }: { timezone: string }) {
  const { full } = formatTz(timezone);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <Globe className="w-3 h-3" />
      Your time: {full}
    </span>
  );
}
