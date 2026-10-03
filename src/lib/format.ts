const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const withCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatMoney(amount: number) {
  return Number.isInteger(amount) ? wholeDollars.format(amount) : withCents.format(amount);
}

/** "Sep 30, 2026". Uses UTC so date-only values like "2026-09-30" don't shift a day. */
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 days ago", "yesterday", "just now". */
export function timeAgo(value: string) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** Chat bubble timestamp in the viewer's local time: "3:04 PM". The day shows in the divider above. */
export function formatClockTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function daysBeforeToday(date: Date) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
}

/** Conversation-list timestamp in local time: "3:04 PM", "Yesterday", "Tuesday", or "Sep 10". */
export function formatThreadTime(value: string) {
  const date = new Date(value);
  const days = daysBeforeToday(date);
  if (days <= 0) return formatClockTime(value);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Chat day divider in local time: "Today", "Yesterday", or "Thursday, Sep 10". */
export function formatDayLabel(value: string) {
  const date = new Date(value);
  const days = daysBeforeToday(date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** "Sep 2026" — for "member since" lines. */
export function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** A span of hours as the value and unit of a big stat: "45 min", "2 hrs", "3 days". */
export function formatDuration(hours: number): { value: string; unit: string } {
  if (hours < 1) return { value: String(Math.max(1, Math.round(hours * 60))), unit: "min" };
  if (hours < 48) {
    const rounded = hours < 10 ? Math.round(hours * 2) / 2 : Math.round(hours);
    return { value: String(rounded), unit: rounded === 1 ? "hr" : "hrs" };
  }
  const days = Math.round(hours / 24);
  return { value: String(days), unit: days === 1 ? "day" : "days" };
}

/** Today's date as YYYY-MM-DD (UTC). */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
