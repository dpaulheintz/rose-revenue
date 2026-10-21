// Read-only views over the shop "book" (generated data + whatever the visitor
// changed). Every module computes money from these, so a number shown on
// Money, Jobs, Job costing and Sales is the same number.

import { addDays, diffDays, monthKey, weekStart, type Ymd } from "../dates";
import type { ChangeOrder, Estimate, EstimateOption, Invoice, Job, Payment, ShopData, ShopSeed } from "./types";

export type Book = ShopData; // same shape; the provider merges visitor changes in

export const sum = <T,>(xs: readonly T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------ estimates ----------------------------- */

export function optionTotals(o: EstimateOption, taxRate: number) {
  const subtotal = sum(o.lines, (l) => l.qty * l.price);
  const materials = sum(o.lines.filter((l) => l.kind === "Materials"), (l) => l.qty * l.price);
  const cost = sum(o.lines, (l) => l.qty * l.cost);
  const tax = materials * taxRate;
  return { subtotal: r2(subtotal), materials: r2(materials), tax: r2(tax), total: r2(subtotal + tax), cost: r2(cost), margin: subtotal ? (subtotal - cost) / subtotal : 0 };
}
export const estimateTotal = (e: Estimate, taxRate: number) => optionTotals(e.options[e.chosen], taxRate).total;

/* ------------------------------- invoices ----------------------------- */

export type InvoiceStatus = "Draft" | "Sent" | "Viewed" | "Partially paid" | "Paid" | "Overdue";
export const INVOICE_STATUSES: InvoiceStatus[] = ["Draft", "Sent", "Viewed", "Partially paid", "Paid", "Overdue"];

export function paymentsByInvoice(b: Book) {
  const m = new Map<string, Payment[]>();
  for (const p of b.payments) (m.get(p.invoice) ?? m.set(p.invoice, []).get(p.invoice)!).push(p);
  return m;
}

export function invoiceView(b: Book) {
  const pays = paymentsByInvoice(b);
  return b.invoices.map((i) => {
    const paid = r2(sum(pays.get(i.id) ?? [], (p) => p.amount));
    const balance = r2(i.amount - paid);
    const status: InvoiceStatus = i.draft ? "Draft" : balance <= 0.005 ? "Paid" : i.due < b.anchor ? "Overdue" : paid > 0 ? "Partially paid" : i.viewed ? "Viewed" : "Sent";
    return { ...i, paid, balance: Math.max(0, balance), status, age: diffDays(b.anchor, i.issued), late: Math.max(0, diffDays(b.anchor, i.due)), payments: pays.get(i.id) ?? [] };
  });
}
export type InvoiceRow = ReturnType<typeof invoiceView>[number];

export function aging(rows: InvoiceRow[]) {
  const open = rows.filter((r) => r.balance > 0 && r.status !== "Draft");
  const buckets = [
    { label: "0–30", min: 0, max: 30 },
    { label: "31–60", min: 31, max: 60 },
    { label: "61–90", min: 61, max: 90 },
    { label: "90+", min: 91, max: 99999 },
  ];
  return buckets.map((bk) => {
    const xs = open.filter((r) => r.age >= bk.min && r.age <= bk.max);
    return { ...bk, count: xs.length, amount: r2(sum(xs, (r) => r.balance)) };
  });
}

/* --------------------------------- jobs ------------------------------- */

export const approvedCOs = (b: Book, job: string) => b.changeOrders.filter((c) => c.job === job && c.status === "Approved");
export const jobTotal = (b: Book, j: Job) => r2(j.contract + sum(approvedCOs(b, j.id), (c) => c.amount));

export type JobFinance = ReturnType<typeof jobFinance>;
/** Budget vs. actual for one job. Actuals count what has happened (through yesterday). */
export function jobFinance(b: Book, seed: ShopSeed, j: Job, rows?: InvoiceRow[]) {
  const y = addDays(b.anchor, -1);
  const inv = (rows ?? invoiceView(b)).filter((i) => i.job === j.id);
  const total = jobTotal(b, j);
  const billed = r2(sum(inv, (i) => i.amount));
  const paid = r2(sum(inv, (i) => i.paid));
  const materials = r2(sum(b.pos.filter((p) => p.job === j.id && p.date <= y), (p) => p.amount) + sum(b.receipts.filter((r) => r.job === j.id && r.date <= y), (r) => r.amount));
  const subs = r2(sum(b.subBills.filter((s) => s.job === j.id && s.date <= y), (s) => s.amount));
  const entries = b.time.filter((t) => t.job === j.id);
  const cost = new Map(seed.workers.map((w) => [w.id, w.cost]));
  const laborHours = sum(entries, (t) => t.hours);
  const laborCost = r2(sum(entries, (t) => t.hours * (cost.get(t.worker) ?? 35)));
  const coCost = sum(approvedCOs(b, j.id), (c) => c.cost);
  const budget = { materials: j.budget.materials, subs: j.budget.subs, laborCost: j.budget.laborCost, laborHours: j.budget.laborHours, total: r2(j.budget.materials + j.budget.subs + j.budget.laborCost) };
  const actual = { materials, subs, laborCost, laborHours, total: r2(materials + subs + laborCost) };
  const done = j.status === "Complete" || j.status === "Paid";
  // Share of the work done, by scheduled crew days.
  const progress = done ? 1 : j.days.length ? j.days.filter((d) => d < b.anchor).length / j.days.length : 0;
  // What should be spent by now: materials are bought early, subs bill late, labor tracks crew days.
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const exp = done
    ? { materials: budget.materials, subs: budget.subs, laborCost: budget.laborCost }
    : { materials: budget.materials * (progress > 0 ? clamp01(0.35 + 1.2 * progress) : 0), subs: budget.subs * clamp01((progress - 0.4) / 0.5), laborCost: budget.laborCost * progress };
  const expected = exp.materials + exp.subs + exp.laborCost;
  const variance = actual.total - expected; // + = running over
  // Over = a real overrun: labor past its pace, materials past budget, or the whole job past budget.
  const over = done
    ? actual.total > budget.total * 1.05
    : (progress >= 0.2 && actual.laborCost > exp.laborCost * 1.12 && actual.laborCost - exp.laborCost > 250) || actual.materials > budget.materials * 1.1 || actual.total > budget.total * 1.05;
  const profit = r2(total - (done ? actual.total : budget.total + Math.max(0, variance)));
  return { total, billed, paid, unbilled: r2(total - billed), balance: r2(billed - paid), budget, actual, progress, expected: r2(expected), exp, variance: r2(variance), over, profit, margin: total ? profit / total : 0, coCost: r2(coCost), done };
}

/* ------------------------------- customers ---------------------------- */

export function customerView(b: Book, rows: InvoiceRow[]) {
  const byCustomer = new Map<string, Job[]>();
  for (const j of b.jobs) (byCustomer.get(j.customer) ?? byCustomer.set(j.customer, []).get(j.customer)!).push(j);
  return b.customers.map((c) => {
    const jobs = (byCustomer.get(c.id) ?? []).slice().sort((a, b2) => (a.start < b2.start ? 1 : -1));
    const inv = rows.filter((r) => r.customer === c.id);
    const paid = sum(inv, (i) => i.paid);
    const open = sum(inv.filter((i) => i.status !== "Draft"), (i) => i.balance);
    const done = jobs.filter((j) => j.start < b.anchor);
    return { c, jobs, invoices: inv, ltv: Math.round(c.priorSpend + paid), paid: r2(paid), open: r2(open), lastJob: done[0]?.start ?? null, nextJob: jobs.filter((j) => j.start >= b.anchor).at(-1)?.start ?? null };
  });
}
export type CustomerRow = ReturnType<typeof customerView>[number];

/* --------------------------------- sales ------------------------------ */

export function monthly(b: Book, rows: InvoiceRow[]) {
  return b.months.map((m) => ({
    month: m,
    invoiced: r2(sum(rows.filter((r) => monthKey(r.issued) === m && !r.draft), (r) => r.amount)),
    collected: r2(sum(b.payments.filter((p) => monthKey(p.date) === m), (p) => p.amount)),
  }));
}

/** Finished jobs in the window, with revenue + profit. */
export function closedJobs(b: Book, seed: ShopSeed, rows: InvoiceRow[]) {
  return b.jobs
    .filter((j) => (j.status === "Complete" || j.status === "Paid") && j.end >= b.windowStart)
    .map((j) => ({ j, f: jobFinance(b, seed, j, rows) }));
}

export function byJobType(b: Book, seed: ShopSeed, rows: InvoiceRow[]) {
  const closed = closedJobs(b, seed, rows);
  return seed.jobTypes
    .map((t) => {
      const xs = closed.filter((x) => x.j.type === t.key);
      const revenue = sum(xs, (x) => x.f.total);
      const profit = sum(xs, (x) => x.f.profit);
      return { t, jobs: xs.length, revenue: r2(revenue), profit: r2(profit), margin: revenue ? profit / revenue : 0, avg: xs.length ? revenue / xs.length : 0 };
    })
    .filter((r) => r.jobs > 0)
    .sort((a, b2) => b2.revenue - a.revenue);
}

export function winRate(b: Book) {
  const decided = b.estimates.filter((e) => e.decided && e.decided >= b.windowStart && ["Approved", "Declined", "Expired"].includes(e.status));
  const won = decided.filter((e) => e.status === "Approved");
  return { decided: decided.length, won: won.length, rate: decided.length ? won.length / decided.length : 0 };
}

/* ------------------------------ crew time ----------------------------- */

export function weekHours(b: Book, seed: ShopSeed, monday: Ymd) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return seed.workers.map((w) => {
    const es = b.time.filter((t) => t.worker === w.id && t.date >= monday && t.date <= days[6]);
    return { w, days: days.map((d) => sum(es.filter((e) => e.date === d), (e) => e.hours)), job: sum(es.filter((e) => e.job), (e) => e.hours), total: sum(es, (e) => e.hours), entries: es };
  });
}

export const thisWeek = (b: Book) => weekStart(b.anchor);

/* --------------------------- schedule helpers ------------------------- */

export const crewOn = (b: Book, day: Ymd) => b.jobs.filter((j) => j.days.includes(day));

export const fmtDays = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : n === -1 ? "yesterday" : n > 0 ? `in ${n} days` : `${-n} days ago`);

export function coFor(b: Book, job: string): ChangeOrder[] {
  return b.changeOrders.filter((c) => c.job === job);
}

export function invoicesFor(rows: InvoiceRow[], job: string): InvoiceRow[] {
  return rows.filter((i) => i.job === job);
}

export const isOpenInvoice = (i: Invoice & { balance: number; draft: boolean }) => i.balance > 0 && !i.draft;
