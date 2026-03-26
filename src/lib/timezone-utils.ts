/**
 * Timezone Utilities — Parsing and formatting helpers for DB-driven timezone records.
 *
 * All timezone data comes from the `timezones` table. These utilities convert
 * Postgres interval strings into display-friendly labels and provide lookup helpers.
 */

import type { Timezone } from "@/types";

/**
 * Parses a Postgres interval string (e.g. "08:00:00", "-05:00:00") into total minutes.
 * Returns 0 for unparseable values.
 */
export function parseUtcOffset(interval: string): number {
  const match = interval.match(/^(-?)(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Returns a UTC offset label like "UTC+8" or "UTC-5" from a Timezone record.
 * Handles half-hour offsets (e.g. "UTC+5:30").
 */
export function getOffsetLabel(tz: Timezone): string {
  const totalMinutes = parseUtcOffset(tz.utc_offset);
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return mins > 0 ? `UTC${sign}${hours}:${String(mins).padStart(2, "0")}` : `UTC${sign}${hours}`;
}

/**
 * Looks up a Timezone record by IANA key (e.g. "Asia/Singapore").
 * Returns undefined if not found in the provided list.
 */
export function findTimezone(ianaKey: string, timezones: Timezone[]): Timezone | undefined {
  return timezones.find((tz) => tz.tz_tag === ianaKey);
}

/**
 * Extracts a short display label from an IANA key when the timezone isn't in the DB.
 * e.g. "America/New_York" → "New York"
 */
export function fallbackLabel(ianaKey: string): string {
  return ianaKey.split("/").pop()?.replace(/_/g, " ") || ianaKey;
}

/**
 * Formats a timezone for display: returns abbreviation and offset string.
 * Uses the `name` field from the DB record, or falls back to the city name from the IANA key.
 */
export function formatTimezoneDisplay(ianaKey: string, timezones: Timezone[]): { abbr: string; offset: string; full: string } {
  const tz = findTimezone(ianaKey, timezones);
  if (tz) {
    const offset = getOffsetLabel(tz);
    // Extract abbreviation from name — e.g. "Singapore (SGT, UTC+8)" → "SGT"
    const abbrMatch = tz.tz_name.match(/\((\w+),/);
    const abbr = abbrMatch ? abbrMatch[1] : tz.tz_location;
    return { abbr, offset, full: `${abbr} (${offset})` };
  }
  // Fallback for timezones not in the DB
  const label = fallbackLabel(ianaKey);
  return { abbr: label, offset: "", full: label };
}
