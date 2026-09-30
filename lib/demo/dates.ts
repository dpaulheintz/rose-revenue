// Calendar-date math on "YYYY-MM-DD" strings, done in UTC so results never
// depend on the viewer's or server's time zone.

export type Ymd = string;

const DAY = 86400000;

export const toMs = (d: Ymd) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const fromMs = (ms: number): Ymd => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: Ymd, n: number): Ymd => fromMs(toMs(d) + n * DAY);
export const diffDays = (a: Ymd, b: Ymd) => Math.round((toMs(a) - toMs(b)) / DAY); // a - b
/** 0 = Sunday … 6 = Saturday */
export const weekday = (d: Ymd) => new Date(toMs(d)).getUTCDay();
export const monthKey = (d: Ymd) => d.slice(0, 7); // "YYYY-MM"
export const monthIndex = (d: Ymd) => +d.slice(5, 7) - 1; // 0..11
export const daysInMonth = (ym: string) => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
export const firstOfMonth = (d: Ymd): Ymd => `${d.slice(0, 7)}-01`;
export function addMonths(ym: string, n: number) {
  const dt = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1));
  return dt.toISOString().slice(0, 7);
}
/** Monday of the week containing d */
export const weekStart = (d: Ymd): Ymd => addDays(d, -((weekday(d) + 6) % 7));
export function eachDay(from: Ymd, to: Ymd): Ymd[] {
  const out: Ymd[] = [];
  for (let ms = toMs(from); ms <= toMs(to); ms += DAY) out.push(fromMs(ms));
  return out;
}

/** Today's date in a given time zone, as YYYY-MM-DD. Server-side only. */
export function todayIn(timeZone: string, now = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Next occurrence (on or after `from`) of a month/day. */
export function nextOccurrence(from: Ymd, month: number, day: number): Ymd {
  const y = +from.slice(0, 4);
  const cand = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return cand >= from ? cand : `${y + 1}${cand.slice(4)}`;
}
