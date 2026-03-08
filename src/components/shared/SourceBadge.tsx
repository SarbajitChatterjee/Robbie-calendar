/**
 * SourceBadge — A colored pill showing the calendar source provider.
 *
 * Displays the provider name (Google, Apple, Outlook, etc.) alongside
 * the calendar name, with provider-specific background colors.
 * Used in EventCard and EventDetailSheet for source identification.
 */

import { CalendarEvent } from "@/types";

interface SourceBadgeProps {
  source: CalendarEvent["source"];
  calendarName: string;
  className?: string;
}

/** Visual config per source: display label and Tailwind color classes. */
const sourceConfig: Record<string, { label: string; bgClass: string }> = {
  google: { label: "Google", bgClass: "bg-[hsl(217,91%,93%)] text-[hsl(217,91%,40%)]" },
  apple: { label: "Apple", bgClass: "bg-[hsl(0,75%,93%)] text-[hsl(0,75%,40%)]" },
  outlook: { label: "Outlook", bgClass: "bg-[hsl(174,58%,90%)] text-[hsl(174,58%,30%)]" },
  caldav: { label: "CalDAV", bgClass: "bg-[hsl(262,52%,93%)] text-[hsl(262,52%,40%)]" },
  gmail: { label: "Gmail", bgClass: "bg-[hsl(4,90%,93%)] text-[hsl(4,90%,40%)]" },
};

export function SourceBadge({ source, calendarName, className = "" }: SourceBadgeProps) {
  const config = sourceConfig[source] || sourceConfig.google;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgClass} ${className}`}>
      <SourceIcon source={source} />
      {config.label} · {calendarName}
    </span>
  );
}

/** Small colored circle icon representing a calendar source. */
function SourceIcon({ source }: { source: string }) {
  const size = "w-3 h-3";
  switch (source) {
    case "google":
      return <div className={`${size} rounded-full bg-[hsl(217,91%,60%)]`} />;
    case "apple":
      return <div className={`${size} rounded-full bg-[hsl(0,75%,65%)]`} />;
    case "outlook":
      return <div className={`${size} rounded-full bg-[hsl(174,58%,45%)]`} />;
    default:
      return <div className={`${size} rounded-full bg-muted-foreground`} />;
  }
}
