// Shared numbers: Today, Jobs, Money and Reviews all read these, so they agree.

import { addDays, addMonths, diffDays, monthKey, weekStart, type Ymd } from "@demos/kit/data/dates";
import { JOB_TYPES, MILE_RATE, type AtData, type Customer, type Estimate, type Expense, type Invoice, type Job } from "./data";

export type Live = {
  paid: Record<string, { on: Ymd; method: Invoice["method"] }>; // job id → payment taken here
  asked: Record<string, Ymd>; // job id → review request sent here
  done: Record<string, true>; // jobs finished here (parts come off the truck)
  moved: Record<string, { date: Ymd; time: string }>;
  jobs: Job[];
  estimates: Estimate[];
  estStatus: Record<string, { status: Estimate["status"]; chosen?: number }>;
  expenses: Expense[];
  reminded: Record<string, Ymd>;
};
export const emptyLive: Live = { paid: {}, asked: {}, done: {}, moved: {}, jobs: [], estimates: [], estStatus: {}, expenses: [], reminded: {} };

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: Ymd) => `${M[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;
export const monthName = (ym: string) => M[+ym.slice(5, 7) - 1];

/** Minutes after midnight; a workday runs 7:00 to 6:00, so 1:00-6:59 is afternoon. */
export const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return (h < 7 ? h + 12 : h) * 60 + m; };

export function world(d: AtData, st: Live) {
  const jobs = [...d.jobs, ...st.jobs].map((j) => {
    const m = st.moved[j.id];
    const done = j.done || !!st.done[j.id];
    const p = st.paid[j.id];
    const invoice = j.invoice ?? (done ? { id: `INV-${j.id.slice(2)}`, amount: j.price, issued: d.today, due: addDays(d.today, 14) } : undefined);
    return { ...j, ...(m ?? {}), done, invoice: invoice && p ? { ...invoice, paid: p.on, method: p.method } : invoice, review: st.asked[j.id] && !j.review ? { asked: st.asked[j.id] } : j.review };
  }).sort((a, b) => (a.date === b.date ? clock(a.time) - clock(b.time) : a.date < b.date ? -1 : 1));
  const estimates = [...st.estimates, ...d.estimates].map((e) => ({ ...e, ...(st.estStatus[e.id] ?? {}) }));
  const expenses = [...d.expenses, ...st.expenses];
  const stock = d.stock.map((p) => ({ ...p, onTruck: p.onTruck - jobs.filter((j) => st.done[j.id]).reduce((s, j) => s + j.parts.filter((x) => x.part === p.id).reduce((t, x) => t + x.qty, 0), 0) }));
  return { jobs, estimates, expenses, stock };
}
export type World = ReturnType<typeof world>;
export type WJob = World["jobs"][number];

export const invoiceState = (today: Ymd, i: Invoice) => (i.paid ? "Paid" : diffDays(today, i.due) > 0 ? "Overdue" : "Unpaid");

export function today(d: AtData, w: World) {
  const mon = weekStart(d.today);
  const route = w.jobs.filter((j) => j.date === d.today);
  const collected = w.jobs.filter((j) => j.invoice?.paid && j.invoice.paid >= mon && j.invoice.paid <= d.today).reduce((s, j) => s + j.invoice!.amount, 0);
  const unpaid = w.jobs.filter((j) => j.invoice && !j.invoice.paid);
  const waiting = w.estimates.filter((e) => e.status === "Sent" || e.status === "Viewed");
  const low = w.stock.filter((p) => p.onTruck < p.min || (p.min > 0 && p.onTruck <= 0));
  const month = monthKey(d.today);
  const reviews = w.jobs.filter((j) => j.review?.on && monthKey(j.review.on) === month);
  const next = w.jobs.find((j) => j.date > d.today);
  return { route, collected, unpaid, waiting, low, reviews, next };
}

export function money(d: AtData, w: World) {
  const months = Array.from({ length: 12 }, (_, i) => addMonths(monthKey(d.today), i - 11));
  const done = w.jobs.filter((j) => j.done);
  const byMonth = months.map((m) => {
    const js = done.filter((j) => monthKey(j.date) === m);
    const ex = w.expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
    const miles = js.reduce((s, j) => s + j.miles * 2, 0);
    const revenue = js.reduce((s, j) => s + j.price, 0);
    return { month: m, revenue, expenses: ex, miles, profit: revenue - ex };
  });
  const byType = JOB_TYPES.map((t) => ({ key: t.key, label: t.label, revenue: done.filter((j) => j.type === t.key && j.date > addDays(d.today, -365)).reduce((s, j) => s + j.price, 0) }));
  const qStart = `${d.today.slice(0, 5)}${String(Math.floor((+d.today.slice(5, 7) - 1) / 3) * 3 + 1).padStart(2, "0")}-01`;
  const q = done.filter((j) => j.date >= qStart);
  const qRevenue = q.reduce((s, j) => s + j.price, 0);
  const qExpenses = w.expenses.filter((e) => e.date >= qStart).reduce((s, e) => s + e.amount, 0);
  const qMiles = q.reduce((s, j) => s + j.miles * 2, 0);
  const qProfit = qRevenue - qExpenses - qMiles * MILE_RATE; // the mileage deduction lowers taxable profit
  return { byMonth, byType, qStart, qRevenue, qExpenses, qMiles, qProfit, setAside: Math.max(0, qProfit * 0.25) };
}

export function reviews(d: AtData, w: World) {
  const asked = w.jobs.filter((j) => j.review);
  const got = asked.filter((j) => j.review!.rating);
  const ready = w.jobs.filter((j) => j.invoice?.paid && !j.review && diffDays(d.today, j.invoice.paid) <= 21).reverse();
  const byMonth = Array.from({ length: 12 }, (_, i) => addMonths(monthKey(d.today), i - 11)).map((m) => {
    const r = got.filter((j) => monthKey(j.review!.on!) === m);
    return { month: m, count: r.length, avg: r.length ? r.reduce((s, j) => s + j.review!.rating!, 0) / r.length : 0 };
  });
  const avg = got.length ? got.reduce((s, j) => s + j.review!.rating!, 0) / got.length : 0;
  return { asked, got, ready, byMonth, avg };
}

export function tuneups(d: AtData, w: World, customers: Customer[]) {
  const last = new Map(d.lastService);
  for (const j of w.jobs) if (j.done && (last.get(j.customer) ?? "") < j.date) last.set(j.customer, j.date);
  const due = customers.filter((c) => !c.commercial && diffDays(d.today, last.get(c.id)!) > 365).map((c) => ({ c, last: last.get(c.id)! })).sort((a, b) => (a.last < b.last ? -1 : 1));
  return { due, last, ifQuarter: Math.round(due.length / 4) * 119 };
}
