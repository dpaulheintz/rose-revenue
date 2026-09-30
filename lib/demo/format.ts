import { toMs, type Ymd } from "./dates";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const moneyK = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 10_000 ? `$${(n / 1000).toFixed(1)}k` : money(n);
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
export const signedPct = (n: number) => `${n >= 0 ? "▲" : "▼"} ${Math.abs(n * 100).toFixed(1)}%`;

export function shortDate(d: Ymd) {
  const dt = new Date(toMs(d));
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}
export function dayDate(d: Ymd) {
  const dt = new Date(toMs(d));
  return `${WEEKDAYS[dt.getUTCDay()]} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}
export function monthLabel(ym: string, withYear = false) {
  const m = MONTHS[+ym.slice(5, 7) - 1];
  return withYear ? `${m} ${ym.slice(0, 4)}` : m;
}
export const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
