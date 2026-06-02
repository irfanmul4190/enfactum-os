/**
 * Shared formatting utilities for the en·Forge app.
 * Singapore-style currency (S$ with proper grouping) and date formatting.
 */

/** Format SGD currency: S$ 1,250,000 */
export function fmtSGD(value: number | null | undefined, currency?: string | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact currency for KPI cards: S$1.2M, S$350K */
export function fmtSGDCompact(value: number): string {
  if (value >= 1_000_000) return `S$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S$${(value / 1_000).toFixed(0)}K`;
  return fmtSGD(value);
}

/** Format date: 01 Jan 2025 */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format date+time: 01 Jan 2025, 09:00 */
export function fmtDateTime(d: string): string {
  return new Date(d).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time: "2h ago", "Yesterday" */
export function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
}

/** Days remaining until a date */
export function daysRemaining(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (24 * 3600000));
}
