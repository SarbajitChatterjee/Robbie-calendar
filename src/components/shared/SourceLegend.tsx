/**
 * SourceLegend — pill row showing the 4 supported providers with the color
 * the backend has assigned to that source. Reads from useCalendars(); for
 * each source we take the color of the first connection of that source.
 * Providers with no connection render a muted placeholder dot.
 */

import { useCalendars } from "@/hooks/useCalendars";
import type { CalendarConnection } from "@/types";

type SourceKey = CalendarConnection["source"];

const SOURCES: ReadonlyArray<{ key: SourceKey; label: string }> = [
  { key: "google",  label: "Google"  },
  { key: "outlook", label: "Outlook" },
  { key: "apple",   label: "Apple"   },
  { key: "caldav",  label: "CalDAV"  },
];

interface SourceLegendProps {
  className?: string;
}

export function SourceLegend({ className = "" }: SourceLegendProps) {
  const { data: connections } = useCalendars();

  // First connection's color per source (backend is source of truth)
  const colorBySource = new Map<SourceKey, string>();
  for (const c of connections ?? []) {
    if (!colorBySource.has(c.source) && c.color) {
      colorBySource.set(c.source, c.color);
    }
  }

  return (
    <div
      className={
        "inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 " +
        "rounded-full bg-card/60 backdrop-blur-sm border border-border/50 " +
        "px-5 py-2.5 shadow-[0_2px_8px_hsl(var(--shadow-soft))] " +
        className
      }
    >
      {SOURCES.map(({ key, label }) => {
        const color = colorBySource.get(key);
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={
                "h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-foreground/10 " +
                (color ? "" : "bg-muted")
              }
              style={color ? { backgroundColor: color } : undefined}
              aria-hidden="true"
              title={color ? `${label} (${color})` : `${label} — not connected`}
            />
            <span className="text-sm font-medium text-foreground/90 tracking-tight">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}