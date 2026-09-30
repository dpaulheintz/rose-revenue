// Derived views over the master dataset. Every screen reads these, so a
// number shown in two places is literally the same computation.

import type { DemoConfig, KpiDef, KpiKey, USState } from "@/demos/types";
import type { Account, Dataset, MaintenanceItem, RanchDay, Visit } from "./generate";
import { addDays, daysInMonth, diffDays, monthKey, type Ymd } from "./dates";
import { hash } from "./rng";

const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
const between = (d: Ymd, from: Ymd, to: Ymd) => d >= from && d <= to;

/* ------------------------------- sales ------------------------------- */

export type MonthSales = { month: string; tx: number; oos: number; bottleShop: number; txCases: number; oosCases: number; total: number };

export function salesByMonth(ds: Dataset): MonthSales[] {
  return ds.months.map((m) => {
    const os = ds.orders.filter((o) => monthKey(o.date) === m);
    const txO = os.filter((o) => o.state === "TX");
    const oosO = os.filter((o) => o.state !== "TX");
    const tx = sum(txO, (o) => o.revenue);
    const oos = sum(oosO, (o) => o.revenue);
    const bottleShop = sum(ds.ranchDays.filter((r) => monthKey(r.date) === m), (r) => r.bottleShop);
    return { month: m, tx, oos, bottleShop, txCases: sum(txO, (o) => o.cases), oosCases: sum(oosO, (o) => o.cases), total: tx + oos + bottleShop };
  });
}

/** Month-to-date spirits revenue vs. the same days last month. */
export function monthToDate(ds: Dataset) {
  const current = salesByMonth(ds).at(-1)!;
  const yesterday = addDays(ds.anchor, -1);
  const prevMonth = ds.months[10];
  const dayCount = Math.min(+yesterday.slice(8, 10), daysInMonth(prevMonth));
  const prevTo: Ymd = `${prevMonth}-${String(dayCount).padStart(2, "0")}`;
  const prevFrom: Ymd = `${prevMonth}-01`;
  const sameDaysLast =
    sum(ds.orders.filter((o) => between(o.date, prevFrom, prevTo)), (o) => o.revenue) +
    sum(ds.ranchDays.filter((r) => between(r.date, prevFrom, prevTo)), (r) => r.bottleShop);
  const distributor = current.tx + current.oos;
  return {
    month: current.month,
    throughDay: monthKey(yesterday) === current.month ? +yesterday.slice(8, 10) : 0,
    total: current.total,
    distributor,
    bottleShop: current.bottleShop,
    change: sameDaysLast ? current.total / sameDaysLast - 1 : 0,
    txShare: distributor ? current.tx / distributor : 0,
    oosShare: distributor ? current.oos / distributor : 0,
    txCases: current.txCases,
    oosCases: current.oosCases,
  };
}

export function stateBreakdown(ds: Dataset) {
  const states: USState[] = ["TX", "AR", "LA", "FL"];
  return states.map((state) => {
    const os = ds.orders.filter((o) => o.state === state);
    return {
      state,
      cases: sum(os, (o) => o.cases),
      revenue: sum(os, (o) => o.revenue),
      activeAccounts: ds.accounts.filter((a) => a.state === state && a.status === "Active").length,
    };
  });
}

export function skuTable(ds: Dataset, cfg: DemoConfig) {
  return cfg.skus.map((sku) => {
    const os = ds.orders.filter((o) => o.skuId === sku.id);
    return {
      sku,
      cases: sum(os, (o) => o.cases),
      revenue: sum(os, (o) => o.revenue),
      monthly: ds.months.map((m) => sum(os.filter((o) => monthKey(o.date) === m), (o) => o.cases)),
    };
  });
}

export function accountRevenue(ds: Dataset) {
  const map = new Map<string, { revenue: number; cases: number; lastOrder: Ymd | null }>();
  for (const o of ds.orders) {
    const r = map.get(o.accountId) ?? { revenue: 0, cases: 0, lastOrder: null };
    r.revenue += o.revenue;
    r.cases += o.cases;
    if (!r.lastOrder || o.date > r.lastOrder) r.lastOrder = o.date;
    map.set(o.accountId, r);
  }
  return map;
}

export function topAccounts(ds: Dataset, n = 10) {
  const rev = accountRevenue(ds);
  return ds.accounts
    .map((a) => ({ account: a, ...(rev.get(a.id) ?? { revenue: 0, cases: 0, lastOrder: null }) }))
    .sort((x, y) => y.revenue - x.revenue)
    .slice(0, n);
}

/** First order date per SKU for an account (its placements). */
export function placements(ds: Dataset, accountId: string) {
  const first = new Map<string, Ymd>();
  for (const o of ds.orders) if (o.accountId === accountId && !first.has(o.skuId)) first.set(o.skuId, o.date);
  return [...first.entries()].map(([skuId, since]) => ({ skuId, since }));
}

/* -------------------------------- CRM -------------------------------- */

export function lastVisitMap(visits: Visit[]) {
  const map = new Map<string, Ymd>();
  for (const v of visits) {
    const cur = map.get(v.accountId);
    if (!cur || v.date > cur) map.set(v.accountId, v.date);
  }
  return map;
}

/** Next follow-up: a rep's cadence after the last touch (prospects sooner). */
export function nextFollowUp(a: Account, lastVisit: Ymd | undefined, anchor: Ymd): Ymd {
  const cadence = a.status === "Prospect" ? 14 : a.status === "At risk" ? 10 : a.status === "Lost" ? 90 : 30;
  const due = addDays(lastVisit ?? addDays(anchor, -cadence + 3), cadence);
  if (due >= anchor) return due;
  // Lapsed: most get rescheduled a few days out; about 1 in 4 stays overdue.
  const h = hash(a.id);
  return h % 4 === 0 ? due : addDays(anchor, 1 + (h % 12));
}

/* ------------------------------- ranch ------------------------------- */

export function lastWeekend(ds: Dataset) {
  const last = ds.ranchDays.at(-1);
  if (!last) return null;
  const days = ds.ranchDays.filter((r) => r.weekendOf === last.weekendOf);
  return summarizeDays(days, last.weekendOf, days[0]);
}

function summarizeDays(days: RanchDay[], weekendOf: Ymd, first: RanchDay) {
  return {
    weekendOf,
    act: first.act,
    stage: first.stage,
    headliner: first.headliner,
    total: sum(days, (d) => d.total),
    cocktailsSold: sum(days, (d) => sum(d.cocktailQty, (q) => q)),
    cocktails: sum(days, (d) => d.cocktails),
    food: sum(days, (d) => d.food),
    cigars: sum(days, (d) => d.cigars),
    visitors: sum(days, (d) => d.visitors),
    bottleShop: sum(days, (d) => d.bottleShop),
    days,
  };
}

export function recentWeekends(ds: Dataset, n = 12) {
  const fridays = [...new Set(ds.ranchDays.map((r) => r.weekendOf))].slice(-n);
  return fridays.map((f) => {
    const days = ds.ranchDays.filter((r) => r.weekendOf === f);
    return summarizeDays(days, f, days[0]);
  });
}

/** Ranch days inside the scorecard's 13-week window. */
export function quarterDays(ds: Dataset) {
  const from = ds.weeks[0];
  const to = addDays(ds.weeks[12], 6);
  return ds.ranchDays.filter((r) => between(r.date, from, to));
}

export function hourlyAverages(ds: Dataset, cfg: DemoConfig) {
  const days = quarterDays(ds);
  const hours = cfg.ranch.openHours.sat; // superset of Friday's hours
  const avg = (kind: "Fri" | "Sat") => {
    const ds2 = days.filter((d) => d.day === kind);
    const open = kind === "Fri" ? cfg.ranch.openHours.fri : cfg.ranch.openHours.sat;
    return hours.map((h) => {
      const i = open.indexOf(h);
      return i < 0 || !ds2.length ? null : Math.round(sum(ds2, (d) => d.hourly[i]) / ds2.length);
    });
  };
  return { hours, fri: avg("Fri"), sat: avg("Sat") };
}

export function topCocktails(ds: Dataset, cfg: DemoConfig, n = 10) {
  const days = quarterDays(ds);
  return cfg.ranch.cocktails
    .map((c, i) => ({ name: c.name, qty: sum(days, (d) => d.cocktailQty[i]), revenue: sum(days, (d) => d.cocktailQty[i]) * c.price }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, n);
}

export function categorySplit(ds: Dataset) {
  const days = quarterDays(ds);
  return [
    { key: "cocktails", label: "Cocktails", value: sum(days, (d) => d.cocktails) },
    { key: "food", label: "Food trucks", value: sum(days, (d) => d.food) },
    { key: "tastings", label: "Tastings & tours", value: sum(days, (d) => d.tastings) },
    { key: "cigars", label: "Cigar lounge", value: sum(days, (d) => d.cigars) },
    { key: "merch", label: "Merch", value: sum(days, (d) => d.merch) },
  ];
}

export function truckLeaderboard(ds: Dataset) {
  const map = new Map<string, { sales: number; days: number }>();
  for (const d of quarterDays(ds))
    for (const t of d.trucks) {
      const r = map.get(t.name) ?? { sales: 0, days: 0 };
      r.sales += t.sales;
      r.days += 1;
      map.set(t.name, r);
    }
  return [...map.entries()].map(([name, r]) => ({ name, ...r })).sort((a, b) => b.sales - a.sales);
}

/* ------------------------------ scorecard ----------------------------- */

export type KpiRow = { def: KpiDef; weekly: number[]; goal: number };

function openAt(items: MaintenanceItem[], day: Ymd) {
  return items.filter((m) => m.reportedOn <= day && (!m.closedOn || m.closedOn > day)).length;
}

export function kpiSeries(ds: Dataset, key: KpiKey): number[] {
  return ds.weeks.map((ws, i) => {
    const we = addDays(ws, 6);
    const inWeek = (d: Ymd) => between(d, ws, we);
    const rd = ds.ranchDays.filter((r) => inWeek(r.date));
    switch (key) {
      case "txCases": return sum(ds.orders.filter((o) => o.state === "TX" && inWeek(o.date)), (o) => o.cases);
      case "oosCases": return sum(ds.orders.filter((o) => o.state !== "TX" && inWeek(o.date)), (o) => o.cases);
      case "newAccounts": return ds.accounts.filter((a) => a.openedOn && inWeek(a.openedOn)).length;
      case "visits": return ds.visits.filter((v) => inWeek(v.date)).length;
      case "tastings": return ds.visits.filter((v) => inWeek(v.date) && (v.type === "Tasting" || v.type === "Event activation")).length;
      case "bottleShop": return sum(rd, (r) => r.bottleShop);
      case "ranchCocktails": return sum(rd, (r) => r.cocktails);
      case "ranchFoodCigar": return sum(rd, (r) => r.food + r.cigars);
      case "privateEvents": return ds.events.filter((e) => inWeek(e.bookedOn)).length;
      case "newsletter": return ds.newsletterByWeek[i];
      case "production": return ds.productionByWeek[i];
      case "openMaintenance": return openAt(ds.maintenance, we);
    }
  });
}

function quantile(xs: number[], q: number) {
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.ceil(pos)] - s[lo]) * (pos - lo);
}

/** Goals sit where a healthy team hits them most weeks, rounded like a human would. */
export function kpiRows(ds: Dataset, cfg: DemoConfig): KpiRow[] {
  return cfg.kpis.map((def) => {
    const weekly = kpiSeries(ds, def.key);
    const q = quantile(weekly, def.direction === "atLeast" ? 0.35 : 0.65);
    const step = def.unit === "money" ? 500 : def.unit === "cases" ? 5 : q > 40 ? 10 : 1;
    const goal = Math.max(step === 1 ? 1 : step, (def.direction === "atLeast" ? Math.floor : Math.ceil)(q / step) * step);
    return { def, weekly, goal };
  });
}

export const onTrack = (row: KpiRow, value: number) => (row.def.direction === "atLeast" ? value >= row.goal : value <= row.goal);

/* --------------------------- needs attention --------------------------- */

export function overdueMaintenance(items: MaintenanceItem[], anchor: Ymd) {
  return items.filter((m) => m.status !== "Done" && m.dueOn < anchor).sort((a, b) => (a.dueOn < b.dueOn ? -1 : 1));
}

export function staleAccounts(ds: Dataset, visits: Visit[], days = 60) {
  const last = lastVisitMap(visits);
  const rev = accountRevenue(ds);
  return ds.accounts
    .filter((a) => a.status === "Active" || a.status === "At risk")
    .map((a) => ({ account: a, lastVisit: last.get(a.id) ?? null, revenue: rev.get(a.id)?.revenue ?? 0 }))
    .filter((x) => !x.lastVisit || diffDays(ds.anchor, x.lastVisit) >= days)
    .sort((x, y) => y.revenue - x.revenue);
}
