// Everything a screen shows that's shared with another screen comes from here,
// so the Dashboard, Inventory, Jobs and Scorecard can't disagree.

import { addDays, diffDays, monthKey, type Ymd } from "@demos/kit/data/dates";
import { addWork, isWorkday, workBetween, type Customer, type Job, type Material, type NC, type PM, type PO, type Quote, type QuoteStatus, type Shop } from "./data";
import { industry } from "./industry";

export type LiveState = {
  assign: Record<string, string>; // job id → machine (or the off-machine lane)
  extraJobs: Job[];
  extraQuotes: Quote[];
  quoteStatus: Record<string, QuoteStatus>;
  quoteJob: Record<string, string>;
  extraPos: PO[];
  ncClosed: Record<string, string>; // nc id → disposition
  pmDone: Record<string, Ymd>;
  moved: Record<string, Array<{ date: Ymd; text: string }>>;
};
export const emptyState: LiveState = { assign: {}, extraJobs: [], extraQuotes: [], quoteStatus: {}, quoteJob: {}, extraPos: [], ncClosed: {}, pmDone: {}, moved: {} };

export type JobStatus = "On track" | "At risk" | "Late";
export type Shortage = { material: Material; job: Job; need: Ymd; before: number; short: number; po?: PO; daysLate: number };
export type OpenJob = Job & { status: JobStatus; why: string; at: string; atLabel: string; atMachine?: string; short?: Shortage };

export const LANE = "lane";
export const machineName = (id?: string) => industry.machines.find((m) => m.id === id)?.name;
export const laneLabel = (id: string) => (id === LANE ? industry.offMachineLane : machineName(id) ?? id);
export const remaining = (j: Job) => j.steps.length - j.current;

/** Walks each material forward through the jobs that haven't started it. The first time it goes negative is a shortage. */
export function findShortages(shop: Shop, open: Job[], pos: PO[]): Shortage[] {
  const out: Shortage[] = [];
  for (const m of shop.materials) {
    const jobs = open.filter((j) => j.materialId === m.id && j.current === 0).sort((a, b) => (shop.needDate(a) < shop.needDate(b) ? -1 : 1));
    const incoming = pos.filter((p) => p.materialId === m.id && !p.received).sort((a, b) => (a.eta < b.eta ? -1 : 1));
    let stock = m.onHand;
    const used = new Set<string>();
    for (const j of jobs) {
      const need = shop.needDate(j);
      for (const p of incoming) if (p.eta <= need && !used.has(p.id)) { stock += p.qty; used.add(p.id); }
      if (stock < j.matNeed) {
        const po = incoming.find((p) => !used.has(p.id));
        out.push({ material: m, job: j, need, before: Math.round(stock), short: Math.round(j.matNeed - stock), po, daysLate: po ? diffDays(po.eta, need) : 0 });
        break;
      }
      stock -= j.matNeed;
    }
  }
  return out;
}

export function statusOf(shipDay: Ymd, j: Job, short?: Shortage): { status: JobStatus; why: string } {
  const days = workBetween(shipDay, j.dueDate); // counted from the next working day
  const left = remaining(j);
  if (days < 0) return { status: "Late", why: `${-days} workday${days === -1 ? "" : "s"} past due` };
  if (short) return { status: "At risk", why: `Short on ${short.material.name}` };
  if (days < left - 2) return { status: "At risk", why: `${left} steps left, ${days} workday${days === 1 ? "" : "s"} to go` };
  return { status: "On track", why: `${left} step${left === 1 ? "" : "s"} left, ${days} workday${days === 1 ? "" : "s"} to go` };
}

export function openJobs(shop: Shop, st: LiveState, shortages: Shortage[]): OpenJob[] {
  return [...shop.open, ...st.extraJobs].map((j) => {
    const step = j.steps[j.current];
    const at = st.assign[j.id] ?? step.machineId ?? LANE;
    const short = shortages.find((s) => s.job.id === j.id);
    return { ...j, ...statusOf(shop.shipDay, j, short), at, atLabel: step.label, atMachine: at === LANE ? undefined : machineName(at), short };
  }).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export const allPos = (shop: Shop, st: LiveState) => [...shop.pos, ...st.extraPos];
export const allQuotes = (shop: Shop, st: LiveState) =>
  [...shop.quotes, ...st.extraQuotes].map((q) => ({ ...q, status: st.quoteStatus[q.id] ?? q.status, jobId: st.quoteJob[q.id] ?? q.jobId }));

export const pmDue = (pm: PM, st: LiveState) => addDays(st.pmDone[pm.id] ?? pm.lastDone, pm.every);
export const overduePms = (shop: Shop, st: LiveState) => shop.pms.filter((p) => pmDue(p, st) < shop.today);
export const ncsLive = (shop: Shop, st: LiveState): NC[] =>
  shop.ncs.map((n) => (st.ncClosed[n.id] ? { ...n, status: "Closed" as const, disposition: st.ncClosed[n.id] } : n));
export const lowStock = (shop: Shop) => shop.materials.filter((m) => m.onHand < m.reorderAt);

/** What ships on the next working day. */
export function shipments(shop: Shop, open: OpenJob[]) {
  return open.filter((j) => j.dueDate <= shop.shipDay && remaining(j) <= 2);
}
export const shipLabel = (shop: Shop) => (shop.shipDay === shop.today ? "Today's shipments" : "Next shipments");

export function kpis(shop: Shop, st: LiveState) {
  const shortages = findShortages(shop, [...shop.open, ...st.extraJobs], allPos(shop, st));
  const open = openJobs(shop, st, shortages);
  const week = shop.weeks[shop.weeks.length - 1];
  const thisMonth = monthKey(shop.today);
  const quotes = allQuotes(shop, st);
  const waiting = quotes.filter((q) => q.status === "Needs approval");
  return {
    open, shortages, week,
    shipping: shipments(shop, open),
    late: open.filter((j) => j.status === "Late"),
    atRisk: open.filter((j) => j.status === "At risk"),
    openValue: open.reduce((s, j) => s + j.price, 0),
    cash: shop.history.filter((j) => j.invoice?.paid && monthKey(j.invoice.paid) === thisMonth).reduce((s, j) => s + j.price, 0),
    ar: shop.history.filter((j) => j.invoice && !j.invoice.paid).reduce((s, j) => s + j.price, 0),
    waiting,
    waitingValue: waiting.reduce((s, q) => s + q.price, 0),
    openNcs: ncsLive(shop, st).filter((n) => n.status === "Open"),
    overdue: overduePms(shop, st),
    low: lowStock(shop),
  };
}
export type Kpis = ReturnType<typeof kpis>;

export type Attention = { key: string; tone: "bad" | "warn"; title: string; detail: string; path: string; jobId?: string };
export function attention(shop: Shop, k: Kpis, st: LiveState): Attention[] {
  const v = industry.vocab;
  const out: Attention[] = [];
  const cust = (id: string) => shop.customers.find((c) => c.id === id)!;
  for (const s of k.shortages) {
    out.push({
      key: `short-${s.material.id}`, tone: "bad", path: "inventory",
      title: `${s.material.name} runs out before ${s.job.id} needs it`,
      detail: `${s.before} ${s.material.unit} left after earlier ${v.jobs}, ${s.job.id} needs ${Math.round(s.job.matNeed)} on ${shortDay(s.need)}. ${s.po ? `${s.po.id} doesn't land until ${shortDay(s.po.eta)}.` : "Nothing on order."}`,
    });
  }
  for (const j of k.late) {
    out.push({ key: `late-${j.id}`, tone: "bad", path: "jobs", jobId: j.id, title: `${j.id} is late for ${cust(j.customerId).name}`, detail: `${shop.partOf(j.partId).name}, ${j.why}. Now at ${j.atLabel}${j.atMachine ? ` on ${j.atMachine}` : ""}.` });
  }
  for (const pm of k.overdue) {
    out.push({ key: pm.id, tone: "warn", path: "maintenance", title: `${machineName(pm.machineId)}: ${pm.task} is overdue`, detail: `Was due ${shortDay(pmDue(pm, st))}, every ${pm.every} days.` });
  }
  for (const n of k.openNcs) {
    const j = [...shop.open, ...st.extraJobs].find((x) => x.id === n.jobId);
    out.push({ key: n.id, tone: "warn", path: "quality", title: `${v.NC} ${n.id} is still open`, detail: `${n.qty} ${v.unit} on ${n.jobId}${j ? ` (${shop.partOf(j.partId).name})` : ""}: ${n.cause}.` });
  }
  return out;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: Ymd) => `${MONTH[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;

/** One customer's numbers, from the same jobs every other screen uses. */
export function customerStats(shop: Shop, c: Customer, open: OpenJob[]) {
  const shipped = shop.history.filter((j) => j.customerId === c.id);
  const onTime = shipped.length ? Math.round((shipped.filter((j) => j.shipDate! <= j.dueDate).length / shipped.length) * 100) : 100;
  const orders = shipped.map((j) => j.orderDate).sort();
  const gaps = orders.slice(1).map((d, i) => diffDays(d, orders[i]));
  const every = gaps.length ? Math.max(7, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)) : 0;
  const last = orders[orders.length - 1];
  let next = last && every ? addDays(last, every) : undefined;
  if (next && !isWorkday(next)) next = addWork(next, 1);
  const revenue12 = shipped.reduce((s, j) => s + j.price, 0);
  const openHere = open.filter((j) => j.customerId === c.id);
  return {
    shipped, onTime, every, lastOrder: last, nextOrder: next, revenue12, lifetime: c.priorRevenue + revenue12, open: openHere,
    lastVisit: c.visits[0]?.date, dueToReorder: !!next && next <= addDays(shop.today, 14) && !openHere.length,
  };
}

/** Lot, heat or job number → everything we know about it. */
export function lookup(shop: Shop, extra: Job[], text: string) {
  const q = text.trim().toUpperCase();
  if (q.length < 3) return [];
  const all = [...shop.open, ...extra, ...shop.history];
  return all.filter((j) => j.lot.toUpperCase() === q || j.heat.toUpperCase() === q || j.id.toUpperCase() === q).slice(0, 8);
}
