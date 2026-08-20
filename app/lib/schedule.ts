// Shared helpers for working with a student's preferred study schedule
// (the days + time slots picked on the request form) and weekly attendance.

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Parses a comma-separated preferred-days string into clean full day names. */
export function parsePreferredDays(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

/** Returns the full day name (e.g. "Monday") for a given date, in local time. */
export function dayNameFromDate(date: Date): string {
  // getDay(): 0 = Sunday ... 6 = Saturday
  return DAYS_OF_WEEK[(date.getDay() + 6) % 7];
}

export function isPreferredDay(preferredDays?: string | null, date?: Date | null): boolean {
  if (!date) return false;
  const days = parsePreferredDays(preferredDays);
  if (days.length === 0) return true;
  return days.includes(dayNameFromDate(date));
}

/** Parses a YYYY-MM-DD string as a local-time date (not UTC). */
export function parseLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** The Monday-Sunday week that contains the given date (local time). */
export function weekRange(anchor: Date): { start: Date; end: Date; days: Date[] } {
  const start = new Date(anchor);
  const mondayOffset = (anchor.getDay() + 6) % 7; // days since Monday
  start.setHours(0, 0, 0, 0);
  start.setDate(anchor.getDate() - mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  const end = new Date(days[6]);
  end.setHours(23, 59, 59, 999);

  return { start, end, days };
}

/** Formats a date as an ISO date string (YYYY-MM-DD) in local time. */
export function toISODate(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** The Monday of the week containing today (local time). */
export function currentWeekStart(): Date {
  return weekRange(new Date()).start;
}

/** Picks the time slot for a given day out of a "Day: from - to, Day: from - to" string. */
export function timeSlotForDay(preferredTime?: string | null, dayName?: string): string | null {
  if (!preferredTime || !dayName) return null;
  const re = new RegExp(`${dayName}:\\s*([0-9]{1,2}:[0-9]{2})\\s*-\\s*([0-9]{1,2}:[0-9]{2})`, "i");
  const match = preferredTime.match(re);
  if (!match) return null;
  return `${match[1]} - ${match[2]}`;
}

export interface DayTimeSlot {
  day: string;
  from: string;
  to: string;
}

/** Parses a "Day: from - to, ..." string into an array of slots (ignores unparseable entries). */
export function parseTimeSlots(preferredTime?: string | null): DayTimeSlot[] {
  if (!preferredTime) return [];
  const slots: DayTimeSlot[] = [];
  for (const day of DAYS_OF_WEEK) {
    const slot = timeSlotForDay(preferredTime, day);
    if (!slot) continue;
    const [from, to] = slot.split("-").map((t) => t.trim());
    if (from && to) slots.push({ day, from, to });
  }
  return slots;
}

/** Builds a "Day: from - to, ..." string (matching the stored format) from an array of slots. */
export function buildPreferredTime(slots: DayTimeSlot[]): string {
  const clean = slots
    .filter((s) => s.day && s.from && s.to)
    .map((s) => `${s.day}: ${s.from} - ${s.to}`);
  return clean.join(", ");
}

/** The end of a calendar day (23:59:59.999) in local time. */
function endOfDay(iso: string): Date {
  const end = parseLocalISODate(iso);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * A day's attendance can be edited for 24 hours after that day ends. Once that
 * window passes, the day is locked and can no longer be marked or changed.
 */
export function isDayLocked(iso: string): boolean {
  return Date.now() > endOfDay(iso).getTime() + 24 * 60 * 60 * 1000;
}
