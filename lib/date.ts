/**
 * Parse a UTC timestamp from the database.
 *
 * SQLite's datetime('now') returns UTC without a 'Z' suffix (e.g. "2026-04-01 22:37:50").
 * JavaScript's new Date() parses strings without timezone as LOCAL time, causing incorrect offsets.
 * This function appends 'Z' if missing so JS correctly interprets it as UTC.
 */
export function parseUTC(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  const ts = timestamp.endsWith("Z") || timestamp.includes("+") || timestamp.includes("T") && timestamp.match(/[+-]\d{2}:\d{2}$/)
    ? timestamp
    : timestamp.replace(" ", "T") + "Z";
  return new Date(ts);
}

/**
 * Format a UTC database timestamp to local display string.
 */
export function formatDate(timestamp: string | null | undefined): string {
  const d = parseUTC(timestamp);
  if (!d) return "—";
  return d.toLocaleDateString();
}

/**
 * Format a UTC database timestamp to local date+time display string.
 */
export function formatDateTime(timestamp: string | null | undefined): string {
  const d = parseUTC(timestamp);
  if (!d) return "—";
  return d.toLocaleString();
}

/**
 * Format a UTC database timestamp to local time only.
 */
export function formatTime(timestamp: string | null | undefined): string {
  const d = parseUTC(timestamp);
  if (!d) return "—";
  return d.toLocaleTimeString();
}

/**
 * Format a UTC timestamp with custom options.
 */
export function formatDateCustom(
  timestamp: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US",
): string {
  const d = parseUTC(timestamp);
  if (!d) return "—";
  return d.toLocaleDateString(locale, options);
}

/**
 * Get milliseconds from a UTC timestamp.
 */
export function getTimeMs(timestamp: string | null | undefined): number {
  const d = parseUTC(timestamp);
  return d ? d.getTime() : 0;
}
