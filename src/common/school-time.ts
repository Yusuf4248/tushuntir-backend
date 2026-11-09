/**
 * School-day time settings. Dates and times in the timetable are local school time
 * (APP_TIMEZONE, default Asia/Tashkent); SQL turns them into instants with
 * `(date + time) AT TIME ZONE <zone>`.
 */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

export function appTimezone(): string {
  return process.env.APP_TIMEZONE?.trim() || "Asia/Tashkent";
}

/** Local time a lesson quiz closes on the lesson's day (QUIZ_DEADLINE_TIME, default 22:00). */
export function quizDeadlineTime(): string {
  const value = process.env.QUIZ_DEADLINE_TIME?.trim() || "22:00";
  if (!TIME_OF_DAY.test(value)) {
    throw new Error(`QUIZ_DEADLINE_TIME must be HH:MM, got "${value}"`);
  }
  return value;
}

/** Today's date (YYYY-MM-DD) in the school's time zone. */
export function localDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: appTimezone() }).format(
    at,
  );
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

/** 1 = Monday ... 7 = Sunday for a YYYY-MM-DD date. */
export function isoWeekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
}
