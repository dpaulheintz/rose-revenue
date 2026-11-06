// Everything two screens might both show is computed here, from the one
// dataset plus what's been changed in this session, so screens agree.

import { addDays, addMonths, diffDays, monthKey, weekStart, type Ymd } from "@demos/kit/data/dates";
import { BRAND_KEYS, INGREDIENTS, PRODUCTS, RUNOUT_INGREDIENT, SKUS, type BrandKey, type Stage } from "./catalog";
import { nextWorkday, runNeed, type Account, type Client, type Order, type PO, type Quote, type Run, type RunStatus, type StData, type Tasting, type Visit } from "./data";

export type BrandFilter = "all" | BrandKey;
export type Live = {
  brand: BrandFilter;
  visits: Record<string, Visit[]>; // account id → visits logged here
  accounts: Account[];
  tastings: Tasting[];
  orders: Order[];
  stage: Record<string, Stage>;
  clients: Client[];
  runStatus: Record<string, RunStatus>;
  runs: Run[];
  pos: PO[];
  quotes: Quote[];
  quoteStatus: Record<string, Quote["status"]>;
  received: Record<string, number>; // stock id → quantity received this session
};
export const emptyLive: Live = { brand: "all", visits: {}, accounts: [], tastings: [], orders: [], stage: {}, clients: [], runStatus: {}, runs: [], pos: [], quotes: [], quoteStatus: {}, received: {} };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: Ymd) => `${MONTHS[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;
export const monthName = (ym: string) => MONTHS[+ym.slice(5, 7) - 1];
export const inBrand = (f: BrandFilter, b: BrandKey | BrandKey[] | "both") => f === "all" || b === "both" || (Array.isArray(b) ? b.includes(f) : b === f);
export const skuOf = (id: string) => SKUS.find((s) => s.id === id)!;
export const productName = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? id;

/** Everything live, merged. */
export function world(d: StData, st: Live) {
  const accounts = [...d.accounts, ...st.accounts].map((a) => ({ ...a, visits: [...(st.visits[a.id] ?? []), ...a.visits] }));
  const orders = [...d.orders, ...st.orders];
  const tastings = [...d.tastings, ...st.tastings].sort((x, y) => (x.date < y.date ? -1 : 1));
  const clients = [...d.clients, ...st.clients].map((c) => ({ ...c, stage: st.stage[c.id] ?? c.stage }));
  const runs = [...d.runs, ...st.runs].map((r) => ({ ...r, status: st.runStatus[r.id] ?? r.status })).sort((x, y) => (x.date < y.date ? -1 : 1));
  const pos = [...d.pos, ...st.pos];
  const quotes = [...st.quotes, ...d.quotes].map((q) => ({ ...q, status: st.quoteStatus[q.id] ?? q.status }));
  const stock = d.stock.map((x) => ({ ...x, onHand: x.onHand + (st.received[x.id] ?? 0) }));
  return { accounts, orders, tastings, clients, runs, pos, quotes, stock };
}
export type World = ReturnType<typeof world>;

/* ---------------- Brands ---------------- */

export function accountStats(d: StData, w: World, a: Account) {
  const mine = w.orders.filter((o) => o.account === a.id);
  const last = mine[mine.length - 1];
  const revenue12 = mine.reduce((s, o) => s + o.total, 0);
  const due = last ? addDays(last.date, a.cadence) : addDays(d.today, 3);
  const crossSell: BrandKey | null = a.brands.length === 2 ? null : (a.type === "Bar" || a.type === "Restaurant") ? (a.brands[0] === "mixers" ? "syrup" : "mixers") : a.type === "Coffee shop" && a.brands[0] === "mixers" ? "syrup" : null;
  return { orders: mine, last, revenue12, due, overdue: diffDays(d.today, due) > 0, dueSoon: diffDays(due, d.today) <= 7, crossSell };
}

/** Monthly brand sales for the last 12 months, by brand and by channel. */
export function salesByMonth(d: StData, w: World, f: BrandFilter) {
  const months = Array.from({ length: 12 }, (_, i) => addMonths(monthKey(d.today), i - 11));
  return months.map((m) => {
    const ord = w.orders.filter((o) => monthKey(o.date) === m && inBrand(f, o.brand));
    const web = d.dtc.filter((x) => monthKey(x.date) === m && inBrand(f, skuOf(x.sku).brand));
    const byBrand = Object.fromEntries(BRAND_KEYS.map((b) => [b, ord.filter((o) => o.brand === b).reduce((s, o) => s + o.total, 0) + web.filter((x) => skuOf(x.sku).brand === b).reduce((s, x) => s + x.amount, 0)])) as Record<BrandKey, number>;
    const byChannel = {
      DTC: web.reduce((s, x) => s + x.amount, 0),
      Wholesale: ord.filter((o) => o.channel === "Wholesale").reduce((s, o) => s + o.total, 0),
      Retail: ord.filter((o) => o.channel === "Retail").reduce((s, o) => s + o.total, 0),
      Distributor: ord.filter((o) => o.channel === "Distributor").reduce((s, o) => s + o.total, 0),
    };
    const firstOrder = (id: string) => w.orders.find((o) => o.account === id)?.date;
    const accts = [...new Set(ord.map((o) => o.account))];
    const newAccts = accts.filter((id) => monthKey(firstOrder(id)!) === m && w.accounts.find((a) => a.id === id)!.since > addDays(d.today, -365)).length;
    return { month: m, total: byBrand.mixers + byBrand.syrup, byBrand, byChannel, newAccts, reorderAccts: accts.length - newAccts };
  });
}

export function bestSkus(d: StData, w: World, f: BrandFilter, days = 90) {
  const from = addDays(d.today, -days);
  const units = new Map<string, { units: number; revenue: number }>();
  const add = (product: string, u: number, r: number) => { const x = units.get(product) ?? { units: 0, revenue: 0 }; x.units += u; x.revenue += r; units.set(product, x); };
  for (const o of w.orders) if (o.date >= from && inBrand(f, o.brand)) for (const l of o.lines) add(skuOf(l.sku).name, l.qty * skuOf(l.sku).units, l.amount);
  for (const x of d.dtc) if (x.date >= from && inBrand(f, skuOf(x.sku).brand)) add(skuOf(x.sku).name, x.qty * skuOf(x.sku).units, x.amount);
  return [...units].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
}

/** A tasting's payoff: what that store ordered of that brand in the 30 days after. */
export function tastingRoi(w: World, t: Tasting) {
  const after = w.orders.filter((o) => o.account === t.account && o.brand === t.brand && o.date > t.date && diffDays(o.date, t.date) <= 30);
  const reorders = after.reduce((s, o) => s + o.total, 0);
  return { reorders, roi: t.cost ? reorders / t.cost : 0 };
}

/* ---------------- Co-packing ---------------- */

export type Shortage = { item: (typeof INGREDIENTS)[number] & { onHand: number }; run: Run; before: number; short: number; po?: PO; daysLate: number };
/** Walks each ingredient through the scheduled runs. The first time it goes negative is a shortage. */
export function shortages(d: StData, w: World): Shortage[] {
  const out: Shortage[] = [];
  const scheduled = w.runs.filter((r) => r.status === "Scheduled");
  for (const g of INGREDIENTS) {
    const s = w.stock.find((x) => x.id === g.id)!;
    const incoming = w.pos.filter((p) => p.item === g.id).sort((a, b) => (a.eta < b.eta ? -1 : 1));
    const used = new Set<string>();
    let left = s.onHand;
    for (const r of scheduled) {
      const n = runNeed(r, g.id);
      if (!n) continue;
      for (const p of incoming) if (p.eta <= r.date && !used.has(p.id)) { left += p.qty; used.add(p.id); }
      if (left < n) {
        const po = incoming.find((p) => !used.has(p.id));
        out.push({ item: { ...g, onHand: s.onHand }, run: r, before: Math.round(left * 10) / 10, short: Math.round((n - left) * 10) / 10, po, daysLate: po ? diffDays(po.eta, r.date) : 0 });
        break;
      }
      left -= n;
    }
  }
  return out;
}
export const isRunout = (id: string) => id === RUNOUT_INGREDIENT;

export function copack(d: StData, w: World) {
  const mon = weekStart(d.today);
  const thisWeek = w.runs.filter((r) => r.date >= mon && r.date < addDays(mon, 7));
  const month = monthKey(d.today);
  const revenue = d.invoices.filter((i) => monthKey(i.date) === month).reduce((s, i) => s + i.amount, 0);
  return {
    thisWeek, holds: w.runs.filter((r) => r.status === "QA hold"), short: shortages(d, w),
    openQuotes: w.quotes.filter((q) => q.status !== "Accepted"), revenue,
    low: w.stock.filter((s) => s.reorderAt > 0 && s.onHand < s.reorderAt && s.owner === "Simple Times"),
  };
}
export const clientName = (w: World, id: string) => w.clients.find((c) => c.id === id)?.name;
export const ownerName = (w: World, owner: string) => (owner === "mixers" ? "Simple Times Mixers" : owner === "syrup" ? "The Syrup Project" : clientName(w, owner) ?? owner);

/* ---------------- Company ---------------- */

export function company(d: StData, w: World) {
  const month = monthKey(d.today);
  const brands = w.orders.filter((o) => monthKey(o.date) === month).reduce((s, o) => s + o.total, 0) + d.dtc.filter((x) => monthKey(x.date) === month).reduce((s, x) => s + x.amount, 0);
  const cp = copack(d, w);
  const mon = weekStart(d.today);
  const tastingsWeek = w.tastings.filter((t) => t.date >= mon && t.date < addDays(mon, 7));
  return { brands, copack: cp.revenue, openOrders: w.orders.filter((o) => o.open), runsWeek: cp.thisWeek, tastingsWeek, cp };
}

/** The leadership scorecard: 13 full weeks, from the same records. */
export function weeks13(d: StData, w: World) {
  const thisMon = weekStart(d.today);
  return Array.from({ length: 13 }, (_, i) => {
    const s = addDays(thisMon, -7 * (13 - i));
    const e = addDays(s, 7);
    const within = (x?: Ymd) => !!x && x >= s && x < e;
    const brandRev = w.orders.filter((o) => within(o.date)).reduce((t, o) => t + o.total, 0) + d.dtc.filter((x) => within(x.date)).reduce((t, x) => t + x.amount, 0);
    const cpRev = d.invoices.filter((x) => within(x.date)).reduce((t, x) => t + x.amount, 0);
    const runs = w.runs.filter((r) => within(r.date));
    const firstPass = runs.length ? (runs.filter((r) => r.firstPass).length / runs.length) * 100 : 100;
    const firsts = new Set<string>();
    for (const o of w.orders) if (!firsts.has(o.account)) { firsts.add(o.account); if (within(o.date) && w.accounts.find((a) => a.id === o.account)!.since > addDays(d.today, -365)) firsts.add(`new:${o.account}`); }
    return {
      id: s, label: shortDay(s),
      values: {
        brandRev, cpRev, newAccts: [...firsts].filter((x) => x.startsWith("new:")).length,
        visits: w.accounts.reduce((t, a) => t + a.visits.filter((v) => within(v.date)).length, 0),
        tastings: w.tastings.filter((t) => within(t.date)).length, firstPass,
      },
    };
  });
}

export const nextShipDay = (d: StData) => nextWorkday(addDays(d.today, 1));
