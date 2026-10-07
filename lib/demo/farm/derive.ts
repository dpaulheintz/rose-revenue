// Read-only views over a FarmData. Every module computes from these, so a
// number shown in two places is the same number.

import { addDays, diffDays, monthIndex, monthKey, weekday, type Ymd } from "../dates";
import type { Channel, Customer, FarmData, FarmSeed, Order, Paddock, SkuSeed } from "./types";

export const CHANNELS: Array<{ key: Channel; label: string }> = [
  { key: "delivery", label: "Home delivery" },
  { key: "pickup", label: "Pickup" },
  { key: "store", label: "Farm store" },
  { key: "wholesale", label: "Wholesale" },
  { key: "herdshare", label: "Herdshare fees" },
  { key: "events", label: "Events" },
];

export const sum = <T,>(xs: readonly T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
export const skuMap = (seed: FarmSeed) => new Map(seed.skus.map((s) => [s.id, s]));
export const pastOrders = (ds: FarmData) => ds.orders.filter((o) => !o.open);
export const openOrders = (ds: FarmData) => ds.orders.filter((o) => o.open);

/** Order revenue split: tickets count as Events, everything else as the order's channel. */
function splitOrder(o: Order) {
  let events = 0;
  for (const l of o.lines) if (l.sku === "ticket") events += l.qty * l.price;
  return { channel: o.total - events, events };
}

export function revenueByMonth(ds: FarmData, seed: FarmSeed) {
  const rows = new Map(ds.months.map((m) => [m, { month: m, total: 0, orders: 0, by: { delivery: 0, pickup: 0, store: 0, wholesale: 0, herdshare: 0, events: 0 } as Record<Channel, number> }]));
  for (const o of ds.orders) {
    if (o.open) continue;
    const r = rows.get(monthKey(o.date));
    if (!r) continue;
    const s = splitOrder(o);
    r.by[o.channel] += s.channel;
    r.by.events += s.events;
    r.orders++;
  }
  for (const d of ds.milk) {
    const r = rows.get(monthKey(d.date));
    if (r) r.by.herdshare += d.herdshare * seed.herdshare.pricePerGallon;
  }
  for (const r of rows.values()) r.total = sum(CHANNELS, (c) => r.by[c.key]);
  return [...rows.values()];
}

/** Month-to-date revenue (orders + herdshare fees) vs. the same weekdays four weeks earlier. */
export function monthToDate(ds: FarmData, seed: FarmSeed) {
  const y = addDays(ds.anchor, -1);
  const from = `${monthKey(ds.anchor)}-01`;
  const day = +ds.anchor.slice(8, 10);
  const lastFrom = addDays(from, -28);
  const lastTo = addDays(y, -28);
  const rev = (a: Ymd, b: Ymd) =>
    sum(ds.orders.filter((o) => !o.open && o.date >= a && o.date <= b), (o) => o.total) +
    sum(ds.milk.filter((d) => d.date >= a && d.date <= b), (d) => d.herdshare * seed.herdshare.pricePerGallon);
  return { revenue: day === 1 ? 0 : rev(from, y), prev: day === 1 ? 0 : rev(lastFrom, lastTo), days: day - 1 };
}

export function skuSales(ds: FarmData, from: Ymd, to: Ymd) {
  const m = new Map<string, { units: number; revenue: number }>();
  for (const o of ds.orders) {
    if (o.open || o.date < from || o.date > to) continue;
    for (const l of o.lines) {
      const r = m.get(l.sku) ?? { units: 0, revenue: 0 };
      r.units += l.qty;
      r.revenue += l.qty * l.price;
      m.set(l.sku, r);
    }
  }
  return m;
}

/* ------------------------------ customers ----------------------------- */

export type CustomerStats = {
  c: Customer;
  orders: Order[]; // newest first, includes open
  count: number;
  spend: number; // in the window
  ltv: number;
  first: Ymd | null;
  last: Ymd | null;
  next: Ymd | null; // open order already scheduled
  due: Ymd | null; // predicted reorder date
  favs: Array<{ sku: string; units: number }>;
  bundleBuyer: boolean;
  segments: Array<"Herdshare owner" | "Freezer-bundle buyer" | "Lapsed 30+" | "New">;
};

export function customerStats(ds: FarmData, seed: FarmSeed): Map<string, CustomerStats> {
  const sk = skuMap(seed);
  const by = new Map<string, Order[]>();
  for (const o of ds.orders) if (o.customer) (by.get(o.customer) ?? by.set(o.customer, []).get(o.customer)!).push(o);
  const out = new Map<string, CustomerStats>();
  for (const c of ds.customers) {
    const all = (by.get(c.id) ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const past = all.filter((o) => !o.open);
    const next = all.filter((o) => o.open).at(-1)?.date ?? null;
    const units = new Map<string, number>();
    let bundle = false;
    for (const o of past) for (const l of o.lines) {
      if (l.sku === "ticket" || l.sku === "turkey") continue;
      units.set(l.sku, (units.get(l.sku) ?? 0) + l.qty);
      if (sk.get(l.sku)?.source === "bundle") bundle = true;
    }
    const spend = sum(past, (o) => o.total);
    const last = past[0]?.date ?? null;
    const first = past.at(-1)?.date ?? null;
    const gaps: number[] = [];
    for (let i = 0; i + 1 < past.length; i++) gaps.push(diffDays(past[i].date, past[i + 1].date));
    gaps.sort((a, b) => a - b);
    const typical = gaps.length ? gaps[Math.floor(gaps.length / 2)] : c.cadence;
    const due = next ? null : last ? addDays(last, typical) : null;
    const segments: CustomerStats["segments"] = [];
    if (c.herdshare && !c.stoppedOn) segments.push("Herdshare owner");
    if (bundle) segments.push("Freezer-bundle buyer");
    if (last && diffDays(ds.anchor, last) >= 30 && !next) segments.push("Lapsed 30+");
    if (diffDays(ds.anchor, c.joined) <= 45) segments.push("New");
    out.set(c.id, {
      c, orders: all, count: past.length, spend, ltv: Math.round(spend + c.priorSpend), first, last, next, due,
      favs: [...units].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, u]) => ({ sku: s, units: u })),
      bundleBuyer: bundle, segments,
    });
  }
  return out;
}

/* ------------------------------ inventory ----------------------------- */

export type StockStatus = "In stock" | "Low" | "Out";
export type InvRow = { s: SkuSeed; onHand: number; committed: number; free: number; daily: number; dos: number | null; status: StockStatus; waitlist: number };

export function inventoryRows(ds: FarmData, seed: FarmSeed): InvRow[] {
  const sold28 = skuSales(ds, addDays(ds.anchor, -28), addDays(ds.anchor, -1));
  const wait = waitlist(ds);
  return seed.skus
    .filter((s) => s.source !== "turkey" && s.source !== "tickets")
    .map((s) => {
      const bundle = !!s.components;
      // Bread is baked every morning (closed Sundays): today's bake is what's on hand.
      const bake = s.source === "bakery" && weekday(ds.anchor) !== 0 ? Math.round(sum(ds.bakes.filter((b) => weekday(b.date) === weekday(ds.anchor)), (b) => b.loaves[s.id] ?? 0) / Math.max(1, ds.bakes.filter((b) => weekday(b.date) === weekday(ds.anchor)).length)) : 0;
      const onHand = s.source === "bakery" ? bake : Math.max(0, ds.stock[s.id] ?? 0);
      const committed = ds.committed[s.id] ?? 0;
      const free = Math.max(0, onHand - committed);
      const daily = (sold28.get(s.id)?.units ?? 0) / 28;
      const dos = daily > 0 ? onHand / daily : null;
      const lowLine = s.par > 0 ? s.par * (bundle ? 0.2 : 0.35) : 0;
      // Out = nothing in the freezer. Low = thin, or everything on hand already spoken for.
      const status: StockStatus = onHand <= 0 ? "Out" : free <= 0 || onHand < lowLine || (dos !== null && dos < 5 && s.par > 0) ? "Low" : "In stock";
      return { s, onHand, committed, free, daily, dos, status, waitlist: s.source === "bakery" ? 0 : wait.get(s.id) ?? 0 };
    });
}

export function buildable(ds: FarmData, s: SkuSeed) {
  if (!s.components) return 0;
  return Math.max(0, Math.min(...Object.entries(s.components).map(([id, q]) => Math.floor(Math.max(0, (ds.stock[id] ?? 0) - (ds.committed[id] ?? 0)) / q))));
}

/** Unique customers who tried to buy something we didn't have, last 30 days. */
export function waitlist(ds: FarmData) {
  const from = addDays(ds.anchor, -30);
  const m = new Map<string, Set<string>>();
  for (const s of ds.stockouts) {
    if (s.date < from) continue;
    const set = m.get(s.sku) ?? new Set<string>();
    set.add(s.customer ?? `anon-${s.date}`);
    m.set(s.sku, set);
  }
  return new Map([...m].map(([k, v]) => [k, v.size]));
}

/** When a product next restocks, and from what. */
export function nextRestock(ds: FarmData, s: SkuSeed): { date: Ymd; qty: number; from: string } | null {
  const t = ds.anchor;
  if (["beef", "pork", "lamb", "broiler"].includes(s.source)) {
    const b = ds.batches.find((x) => x.back >= t && (x.yields[s.id] ?? 0) > 0);
    return b ? { date: b.back, qty: b.yields[s.id], from: `${b.kind === "broiler" ? "Broiler batch" : b.kind === "beef" ? "Beef" : b.kind === "pork" ? "Pork" : "Lamb"} lot ${b.lot}` } : null;
  }
  if (s.source === "cheese") {
    const c = ds.cheese.find((x) => x.sku === s.id && x.ready >= t);
    return c ? { date: c.ready, qty: c.blocks, from: `Lot ${c.lot} comes off aging` } : null;
  }
  if (s.source === "butter") {
    const d = [0, 1, 2, 3, 4, 5, 6].map((k) => addDays(t, k)).find((x) => weekday(x) === 2 || weekday(x) === 5)!;
    return { date: d, qty: Math.round(ds.butter.slice(-8).reduce((a, b) => a + b.units, 0) / 8), from: "Butter churn" };
  }
  if (s.source === "bakery") {
    const d = weekday(t) === 0 ? addDays(t, 1) : t;
    return { date: d, qty: 0, from: "Daily bake" };
  }
  if (s.source === "broth") {
    const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((k) => addDays(t, k)).find((x) => weekday(x) === 1 && diffDays(x, ds.simStart) % 14 < 7)!;
    return { date: d, qty: 84, from: "Broth batch" };
  }
  if (s.source === "partner") {
    let d = addDays(ds.simStart, 3);
    while (d < t) d = addDays(d, 28);
    return { date: d, qty: Math.round(s.par * 1.4), from: "Partner delivery" };
  }
  if (s.source === "eggs") return { date: t, qty: 0, from: "Daily collection" };
  if (s.source === "bundle") {
    const b = ds.batches.find((x) => x.kind === "beef" && x.back >= t);
    return b ? { date: b.back, qty: 0, from: `Packed when beef lot ${b.lot} is back` } : null;
  }
  return null;
}

/* ------------------------------- pasture ------------------------------ */

const GROWTH = [0, 0, 0.05, 0.25, 0.3, 0.22, 0.14, 0.14, 0.18, 0.13, 0.05, 0];

export type PaddockRow = Paddock & {
  status: "Grazing" | "Next" | "Resting" | "Stockpiled" | "Hay";
  rest: number | null;
  height: number; // inches
  dayIn: number | null; // day of the current stay
  stay: number | null; // planned days in this paddock
  nextGraze: Ymd | null;
};

/** Where the herd is, given how many extra moves the visitor made. */
export function rotationState(ds: FarmData, moves: number) {
  const { order, days, cycle } = ds.rotation;
  const starts: number[] = [];
  let acc = 0;
  for (const id of order) { starts.push(acc); acc += days[id]; }
  // Each "move" jumps to the start of the next paddock in the lap.
  let pos = ds.rotation.position;
  let idx = starts.findLastIndex((s) => s <= pos);
  for (let k = 0; k < moves; k++) { idx = (idx + 1) % order.length; pos = starts[idx]; }
  const dayIn = pos - starts[idx] + 1;
  const g = GROWTH[monthIndex(ds.anchor)];
  const rows: PaddockRow[] = ds.paddocks.map((p) => {
    if (p.use === "stockpile") {
      const rest = Math.max(0, diffDays(ds.anchor, `${ds.anchor.slice(0, 4)}-08-01`));
      return { ...p, status: "Stockpiled", rest, height: Math.min(14, 3.5 + rest * 0.11), dayIn: null, stay: null, nextGraze: null };
    }
    if (p.use === "hay") return { ...p, status: "Hay", rest: null, height: 5.5, dayIn: null, stay: null, nextGraze: null };
    const j = order.indexOf(p.id);
    if (j === idx) return { ...p, status: "Grazing", rest: 0, height: Math.max(3.5, 8.6 - 1.4 * dayIn), dayIn, stay: days[p.id], nextGraze: null };
    const end = starts[j] + days[p.id];
    const rest = (((pos - end) % cycle) + cycle) % cycle;
    const until = (((starts[j] - pos) % cycle) + cycle) % cycle;
    return {
      ...p,
      status: j === (idx + 1) % order.length ? "Next" : "Resting",
      rest,
      height: Math.round(Math.min(13, 3.2 + rest * Math.max(g, 0.04)) * 10) / 10,
      dayIn: null,
      stay: days[p.id],
      nextGraze: addDays(ds.anchor, until - dayIn + 1),
    };
  });
  const current = rows.find((r) => r.status === "Grazing")!;
  const next = rows.find((r) => r.status === "Next")!;
  const leaving = addDays(ds.anchor, current.stay! - dayIn + 1);
  // Eggmobiles trail the cattle by about three days (they follow to break up manure pats).
  const prevIdx = (idx - 1 + order.length) % order.length;
  const coops = rows.find((r) => r.id === order[prevIdx])!;
  return { rows, current, next, leaving, coops, cycle };
}

/* ------------------------------- delivery ----------------------------- */

export function orderWeight(o: Order, sk: Map<string, SkuSeed>) {
  return sum(o.lines, (l) => (sk.get(l.sku)?.lbs ?? 0) * l.qty);
}
/** Cold packs: one per 10 lb frozen, one per 15 lb chilled. */
export function coldPacks(o: Order, sk: Map<string, SkuSeed>) {
  let frozen = 0, chilled = 0;
  for (const l of o.lines) {
    const s = sk.get(l.sku);
    if (!s || l.sku === "ticket") continue;
    if (s.frozen) frozen += s.lbs * l.qty;
    else if (!["bakery", "partner"].includes(s.source)) chilled += s.lbs * l.qty;
  }
  return Math.ceil(frozen / 10) + Math.ceil(chilled / 15);
}

/* ------------------------------ enterprises --------------------------- */

const ENTERPRISES = [
  { key: "dairy", label: "Dairy + creamery", acres: 62, hours: 64, cost: 0.46 },
  { key: "beef", label: "Grass-fed beef", acres: 54, hours: 12, cost: 0.58 },
  { key: "pork", label: "Pastured pork", acres: 6, hours: 6, cost: 0.62 },
  { key: "poultry", label: "Broilers + turkeys", acres: 8, hours: 11, cost: 0.6 },
  { key: "eggs", label: "Eggs", acres: 10, hours: 15, cost: 0.55 },
  { key: "bakery", label: "Sourdough bakery", acres: 0, hours: 16, cost: 0.38 },
] as const;

export function profitByEnterprise(ds: FarmData, seed: FarmSeed) {
  const sk = skuMap(seed);
  const rev: Record<string, number> = {};
  for (const o of pastOrders(ds)) for (const l of o.lines) {
    const s = sk.get(l.sku)!;
    const key = s.enterprise === "lamb" ? "beef" : s.enterprise; // lamb shares the beef pasture + labor
    rev[key] = (rev[key] ?? 0) + l.qty * l.price;
  }
  rev.dairy = (rev.dairy ?? 0) + sum(ds.milk, (d) => d.herdshare) * seed.herdshare.pricePerGallon;
  return ENTERPRISES.map((e) => {
    const r = rev[e.key] ?? 0;
    const cost = r * e.cost;
    const margin = r - cost;
    return { ...e, revenue: r, cost, margin, perAcre: e.acres ? margin / e.acres : null, perHour: margin / (e.hours * 52) };
  });
}

/* ------------------------------ lots ---------------------------------- */

export function allLots(ds: FarmData) {
  return [
    ...ds.batches.filter((b) => b.kill <= ds.anchor).map((b) => ({ lot: b.lot, kind: b.kind, date: b.kill })),
    ...ds.cheese.filter((c) => c.date >= ds.windowStart).map((c) => ({ lot: c.lot, kind: "cheese" as const, date: c.date })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const fmtDays = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : n === -1 ? "yesterday" : n > 0 ? `in ${n} days` : `${-n} days ago`);
