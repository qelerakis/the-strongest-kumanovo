/**
 * Format a number as Macedonian Denar currency string.
 * Example: formatMKD(1500) => "1,500 MKD"
 */
export function formatMKD(amount: number): string {
  return `${amount.toLocaleString("en-US")} MKD`;
}

/**
 * Format an ISO date string (YYYY-MM-DD) for display.
 * Returns a human-readable date like "25 Feb 2026".
 */
export function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a 24h time string to 12h AM/PM format.
 * Example: formatTime("18:30") => "6:30 PM"
 */
export function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Get the current month in "YYYY-MM" format.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Merge class names, filtering out falsy values.
 * Example: cn("base", isActive && "active", null) => "base active"
 */
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Get an array of "YYYY-MM" strings between two dates (inclusive).
 * Example: getMonthsBetween("2025-10-15", "2026-01-05") => ["2025-10", "2025-11", "2025-12", "2026-01"]
 */
export function getMonthsBetween(
  startDate: string,
  endDate: string
): string[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  const months: string[] = [];

  let year = start.getFullYear();
  let month = start.getMonth();

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(
      `${year}-${String(month + 1).padStart(2, "0")}`
    );
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return months;
}
