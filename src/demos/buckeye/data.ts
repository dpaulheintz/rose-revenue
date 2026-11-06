// The one seeded generator. Reads its words and numbers ONLY from industry.ts;
// everything is anchored to "today" and rebuilt the same on server and client.

import { addDays, firstOfMonth, monthIndex, monthKey, weekStart, weekday, type Ymd } from "@demos/kit/data/dates";
import { emailFor, peopleNames, phone555, streetAddress } from "@demos/kit/data/fake";
import { shortDate } from "@demos/kit/data/format";
import { withMargin } from "@demos/kit/data/pricing";
import { hash, makeRng } from "@demos/kit/data/rng";
import { industry as defaultIndustry, type Industry } from "./industry";

/* ---------- workdays ---------- */
export const isWorkday = (d: Ymd) => weekday(d) !== 0 && weekday(d) !== 6;
export function addWork(d: Ymd, n: number): Ymd {
  let out = d;
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0;) {
    out = addDays(out, step);
    if (isWorkday(out)) left--;
  }
  return out;
}
/** Workdays from a to b (negative when b is earlier). */
export function workBetween(a: Ymd, b: Ymd) {
  if (a === b) return 0;
  const step = a < b ? 1 : -1;
  let n = 0;
  for (let d = a; d !== b;) {
    d = addDays(d, step);
    if (isWorkday(d)) n += step;
  }
  return n;
}

/* ---------- pricing: one function for history and the quote builder ---------- */
export type QuoteInput = { route: string[]; qty: number; cycleMin: number; setupHr: number; perPc: number; materialCost: number; margin: number };
export type PriceLine = { op: string; label: string; hours: number; rate: number; cost: number };
export function price(ind: Industry, q: QuoteInput) {
  const lines: PriceLine[] = [];
  for (const op of q.route) {
    const o = ind.operations[op];
    if (!o?.center) continue;
    const rate = ind.machines.find((m) => m.center === o.center)?.rate ?? 0;
    const share = o.share ?? 1;
    const hours = (q.setupHr + (q.qty * q.cycleMin) / 60) * share;
    lines.push({ op, label: o.label, hours, rate, cost: hours * rate });
  }
  const labor = lines.reduce((s, l) => s + l.cost, 0);
  const material = q.qty * q.perPc * q.materialCost;
  const outside = q.route.some((op) => ind.operations[op]?.outside) ? q.qty * ind.outsideCostPerPc : 0;
  const cost = labor + material + outside;
  const total = withMargin(cost, q.margin);
  return { lines, hours: lines.reduce((s, l) => s + l.hours, 0), labor, material, outside, cost, price: Math.round(total), perPiece: total / Math.max(1, q.qty), matNeed: q.qty * q.perPc };
}

/* ---------- model ---------- */
export type Contact = { name: string; role: string; phone: string; email: string };
export type Visit = { date: Ymd; by: string; note: string };
export type Customer = { id: string; name: string; type: string; city: string; address: string; terms: number; contacts: Contact[]; visits: Visit[]; priorRevenue: number };
export type Part = { id: string; number: string; name: string; customerId: string; rev: string; materialId: string; perPc: number; cycleMin: number; setupHr: number; qtyRange: [number, number]; route: string[] };
export type Step = { op: string; label: string; machineId?: string; hours: number; state: "done" | "now" | "next"; date: Ymd; operator?: string };
export type Job = {
  id: string; quoteId: string; partId: string; customerId: string; qty: number; materialId: string; matNeed: number; heat: string; lot: string;
  orderDate: Ymd; dueDate: Ymd; shipDate?: Ymd; steps: Step[]; current: number; price: number; cost: number; margin: number; scrapQty: number; scrapCause?: string;
  inspector: string; invoice?: { id: string; date: Ymd; paid?: Ymd };
};
export type QuoteStatus = "Needs approval" | "Sent" | "Won" | "Lost";
export type Quote = { id: string; date: Ymd; customerId: string; partId: string; materialId: string; qty: number; cycleMin: number; setupHr: number; margin: number; status: QuoteStatus; by: string; price: number; jobId?: string };
export type Heat = { heat: string; materialId: string; cert: string; supplierId: string; received: Ymd };
export type Material = Industry["materials"][number] & { onHand: number; reorderAt: number; monthlyUse: number };
export type PO = { id: string; materialId: string; supplierId: string; qty: number; orderDate: Ymd; eta: Ymd; cost: number; received?: boolean; expedited?: boolean };
export type Finished = { partId: string; onHand: number; min: number; lot: string; unitPrice: number };
export type NC = { id: string; date: Ymd; jobId: string; qty: number; cause: string; disposition: string; status: "Open" | "Closed"; owner: string };
export type PM = { id: string; machineId: string; task: string; every: number; lastDone: Ymd };
export type Repair = { id: string; machineId: string; date: Ymd; title: string; cost: number; downtime: number; by: string; photos: number };
export type Week = { start: Ymd; label: string; onTime: number; scrap: number; utilization: number; cash: number; quotesWon: number; shipped: number; hours: number };

export function buildShop(anchor: Ymd, ind: Industry = defaultIndustry) {
  const seed = hash(ind.company.name);
  const stream = (name: string) => makeRng(seed ^ hash(name));
  const today = anchor;
  const shipDay = isWorkday(today) ? today : addWork(today, 1);
  const F = ind.formats;
  const opLabel = (op: string) => ind.operations[op]?.label ?? op;
  const matOf = (id: string) => ind.materials.find((m) => m.id === id)!;

  /* customers + contacts + visits */
  const cr = stream("customers");
  const people = peopleNames(cr, ind.customers.length * 2);
  const customers: Customer[] = ind.customers.map(([name, type, city], i) => {
    const area = cr.pick(ind.areaCodes);
    const contacts = [0, 1].map((n) => {
      const person = people[i * 2 + n];
      return { name: person, role: ind.contactRoles[(i + n) % ind.contactRoles.length], phone: phone555(cr, area), email: emailFor(person) };
    });
    const notes = cr.shuffle(ind.visitNotes);
    const visits = Array.from({ length: Math.min(cr.int(1, 5), notes.length) }, (_, n) => ({ date: addDays(today, -cr.int(6, 220)), by: ind.staff[2].name, note: notes[n] })).sort((a, b) => (a.date < b.date ? 1 : -1));
    return { id: `c${i + 1}`, name, type, city, address: `${streetAddress(cr)}, ${city}, ${ind.company.place}`, terms: cr.pick([30, 30, 45, 60]), contacts, visits, priorRevenue: Math.round(cr.range(40, 900)) * 1000 };
  });
  const custWeight = new Map(customers.map((c, i) => [c.id, 1 / (1 + i % 11) + cr.range(0.05, 0.5)]));

  /* parts */
  const pr = stream("parts");
  const parts: Part[] = [];
  const numberFor = () => F.part.replace(/#+/, (h) => String(pr.int(10 ** (h.length - 1), 10 ** h.length - 1)));
  customers.forEach((c, i) => {
    const families = ind.partFamilies.filter((f) => f.type === c.type);
    for (let n = pr.int(1, i % 5 === 0 ? 3 : 2); n > 0; n--) {
      const f = pr.pick(families);
      const variant = pr.pick(ind.partVariants);
      parts.push({
        id: `p${parts.length + 1}`, number: numberFor(), name: variant ? `${f.name}, ${variant}` : f.name, customerId: c.id, rev: pr.pick(["A", "A", "B", "B", "C", "D"]), materialId: pr.pick(f.materials),
        perPc: +pr.range(f.perPc[0], f.perPc[1]).toFixed(2), cycleMin: +pr.range(f.cycleMin[0], f.cycleMin[1]).toFixed(1), setupHr: +pr.range(f.setupHr[0], f.setupHr[1]).toFixed(1), qtyRange: f.qty as [number, number], route: f.route,
      });
    }
  });
  // The run-out material needs at least two parts that use it.
  const runout = ind.runoutMaterial;
  const runoutFamilies = ind.partFamilies.filter((f) => f.materials.includes(runout)).map((f) => f.name);
  for (const p of parts) if (parts.filter((x) => x.materialId === runout).length < 3 && runoutFamilies.some((n) => p.name.startsWith(n))) p.materialId = runout;
  const partOf = (id: string) => parts.find((p) => p.id === id)!;
  const partsFor = new Map(customers.map((c) => [c.id, parts.filter((p) => p.customerId === c.id)]));

  /* heats: one per material per month, each with its mill cert */
  const heats: Heat[] = [];
  const hr = stream("heats");
  const heatFor = (materialId: string, day: Ymd) => {
    const key = monthKey(day);
    const found = heats.find((h) => h.materialId === materialId && monthKey(h.received) === key);
    if (found) return found;
    const h = { heat: `${F.heat}${hr.int(100000, 999999)}`, materialId, cert: `${F.cert}${hr.int(10000, 99999)}`, supplierId: matOf(materialId).supplier, received: firstOfMonth(day) };
    heats.push(h);
    return h;
  };

  /* machines + who runs them */
  const operatorFor = new Map(ind.machines.map((m, i) => [m.id, [ind.operators[i % ind.operators.length], ind.operators[(i + ind.machines.length) % ind.operators.length]]]));
  // Work goes to whichever machine in the center has the least on it, the way a scheduler would.
  const booked = new Map<string, number>();
  const pickMachine = (center: string, hours = 0) => {
    const m = ind.machines.filter((x) => x.center === center).sort((x, y) => (booked.get(x.id) ?? 0) - (booked.get(y.id) ?? 0))[0];
    booked.set(m.id, (booked.get(m.id) ?? 0) + hours);
    return m;
  };
  const estimate = (p: Part, qty: number, margin: number) => price(ind, { route: p.route, qty, cycleMin: p.cycleMin, setupHr: p.setupHr, perPc: p.perPc, materialCost: matOf(p.materialId).cost, margin });
  const pieceQty = (rng: ReturnType<typeof makeRng>, p: Part) => {
    const q = rng.range(p.qtyRange[0], p.qtyRange[1]);
    return q >= 100 ? Math.round(q / 10) * 10 : Math.max(1, Math.round(q));
  };

  let jobSeq = 24100, quoteSeq = 7100, lotSeq = 51200, invSeq = 18200, ncSeq = 910;
  const quotes: Quote[] = [];
  const addQuote = (rng: ReturnType<typeof makeRng>, p: Part, qty: number, margin: number, date: Ymd, status: QuoteStatus, jobId?: string) => {
    const q: Quote = { id: `${F.quote}${++quoteSeq}`, date, customerId: p.customerId, partId: p.id, materialId: p.materialId, qty, cycleMin: p.cycleMin, setupHr: p.setupHr, margin, status, by: ind.staff[2].name, price: estimate(p, qty, margin).price, jobId };
    quotes.push(q);
    return q;
  };

  /* history: about 12 months of shipped jobs */
  const hrng = stream("history");
  const history: Job[] = [];
  let lateDebt = 0;
  for (let back = 364; back >= 1; back--) {
    const ship = addDays(today, -back);
    if (!isWorkday(ship)) continue;
    const perDay = (ind.history.jobsPerMonth / 21) * ind.history.seasons[monthIndex(ship)];
    let n = Math.floor(perDay) + (hrng.chance(perDay % 1) ? 1 : 0);
    while (n-- > 0) {
      const customer = hrng.weighted(customers, (c) => custWeight.get(c.id)!);
      const p = hrng.pick(partsFor.get(customer.id)!);
      const qty = pieceQty(hrng, p);
      const margin = +hrng.range(ind.defaultMargin - 0.08, ind.defaultMargin + 0.06).toFixed(2);
      const est = estimate(p, qty, margin);
      lateDebt += ind.history.lateShare * hrng.range(0.4, 1.6); // spread evenly, so one unlucky week can't read as a crisis
      const onTime = lateDebt < 1;
      if (!onTime) lateDebt -= 1;
      const dueDate = onTime ? addWork(ship, hrng.int(0, 4)) : addWork(ship, -hrng.int(1, 5));
      const orderDate = addWork(dueDate, -hrng.int(12, 30));
      const steps: Step[] = p.route.map((op, i) => {
        const o = ind.operations[op];
        const line = est.lines.find((l) => l.op === op);
        const m = o.center ? pickMachine(o.center, line?.hours) : undefined;
        return { op, label: opLabel(op), machineId: m?.id, hours: line?.hours ?? 0, state: "done", date: addWork(ship, -(p.route.length - 1 - i)), operator: m ? hrng.pick(operatorFor.get(m.id)!) : undefined };
      });
      const bad = hrng.chance(0.08);
      const scrapQty = bad ? Math.max(1, Math.round(qty * hrng.range(0.03, 0.09))) : hrng.chance(0.55) ? Math.round(qty * hrng.range(0, 0.018)) : 0;
      const id = `${F.job}${++jobSeq}`;
      const quote = addQuote(hrng, p, qty, margin, addWork(orderDate, -hrng.int(2, 9)), "Won", id);
      const paid = addDays(ship, customer.terms + hrng.int(-6, 18));
      history.push({
        id, quoteId: quote.id, partId: p.id, customerId: customer.id, qty, materialId: p.materialId, matNeed: est.matNeed, heat: heatFor(p.materialId, orderDate).heat, lot: `${F.lot}${++lotSeq}`,
        orderDate, dueDate, shipDate: ship, steps, current: steps.length - 1, price: est.price, cost: est.cost, margin, scrapQty, scrapCause: scrapQty ? hrng.pick(ind.scrapCauses) : undefined, inspector: ind.staff[1].name,
        invoice: { id: `${F.invoice}${++invSeq}`, date: ship, paid: paid <= today ? paid : undefined },
      });
    }
  }

  /* open jobs, built to tell the story: a few late, a few tight, two waiting on the run-out material, a few shipping next */
  const orng = stream("open");
  const others = parts.filter((p) => p.materialId !== runout);
  const runParts = parts.filter((p) => p.materialId === runout).sort((x, y) => y.qtyRange[1] * y.perPc - x.qtyRange[1] * x.perPc);
  const load = new Map(ind.machines.map((m) => [m.id, 0]));
  const leastLoaded = (center: string) => ind.machines.filter((m) => m.center === center).sort((a, b) => load.get(a.id)! - load.get(b.id)!)[0];
  type Slot = "late" | "tight" | "runA" | "runB" | "ship" | "ample";
  const slots: Slot[] = ["late", "late", "late", "tight", "tight", "tight", "tight", "tight", "runA", "runB", "ship", "ship", "ship"];
  while (slots.length < ind.openJobs) slots.push("ample");
  const makeOpen = (slot: Slot): Job => {
    const p = slot === "runA" ? runParts[0] : slot === "runB" ? runParts[1] ?? runParts[0] : orng.pick(others);
    const n = p.route.length;
    let idx = 0, due: Ymd;
    if (slot === "late") { idx = orng.int(1, n - 1); due = addWork(today, -orng.int(1, 4)); }
    else if (slot === "tight") { idx = Math.max(1, orng.int(1, Math.max(1, n - 3))); due = addWork(shipDay, Math.max(0, n - idx - 2 - orng.int(1, 2))); }
    else if (slot === "runA") { due = addWork(today, n + 2); }
    else if (slot === "runB") { due = addWork(today, n + 5); }
    else if (slot === "ship") { idx = n - orng.int(1, 2); due = shipDay; }
    else { idx = orng.int(0, n - 2); due = addWork(today, n - idx + orng.int(2, 18)); }
    const customer = customers.find((c) => c.id === p.customerId)!;
    const qty = slot === "runA" || slot === "runB" ? p.qtyRange[1] : pieceQty(orng, p);
    const margin = +orng.range(ind.defaultMargin - 0.06, ind.defaultMargin + 0.05).toFixed(2);
    const est = estimate(p, qty, margin);
    const orderDate = addWork(today, -orng.int(idx + 4, idx + 18));
    const steps: Step[] = p.route.map((op, i) => {
      const o = ind.operations[op];
      const m = o.center ? (i === idx ? leastLoaded(o.center) : pickMachine(o.center)) : undefined;
      if (m && i === idx) load.set(m.id, load.get(m.id)! + 1);
      return {
        op, label: opLabel(op), machineId: m?.id, hours: est.lines.find((l) => l.op === op)?.hours ?? 0, state: i < idx ? "done" : i === idx ? "now" : "next",
        date: i < idx ? addWork(today, -(idx - i)) : i === idx ? today : addWork(today, i - idx), operator: m && i <= idx ? orng.pick(operatorFor.get(m.id)!) : undefined,
      };
    });
    const id = `${F.job}${++jobSeq}`;
    const quote = addQuote(orng, p, qty, margin, addWork(orderDate, -orng.int(2, 9)), "Won", id);
    return {
      id, quoteId: quote.id, partId: p.id, customerId: customer.id, qty, materialId: p.materialId, matNeed: est.matNeed, heat: heatFor(p.materialId, orderDate).heat, lot: `${F.lot}${++lotSeq}`,
      orderDate, dueDate: due, steps, current: idx, price: est.price, cost: est.cost, margin, scrapQty: 0, inspector: ind.staff[1].name,
    };
  };
  const open = slots.map(makeOpen);

  /* quotes still in play, plus some lost */
  const qr = stream("quotes");
  const inPlay: Array<[QuoteStatus, number, number, number]> = [["Needs approval", 7, 0, 3], ["Sent", 8, 2, 14], ["Lost", 14, 7, 80]];
  for (const [status, n, min, max] of inPlay) {
    for (let i = 0; i < n; i++) {
      const p = qr.pick(parts);
      addQuote(qr, p, pieceQty(qr, p), +qr.range(ind.defaultMargin - 0.05, ind.defaultMargin + 0.06).toFixed(2), addWork(today, -qr.int(min, max)), status);
    }
  }

  /* materials: stock set against what the open jobs still need */
  const mr = stream("materials");
  const needDate = (j: Job) => {
    const d = addWork(j.dueDate, -(j.steps.length + 1));
    return d > today ? d : shipDay;
  };
  const unstarted = (j: Job) => j.current === 0;
  const monthlyUse = (id: string) => history.filter((j) => j.materialId === id).reduce((s, j) => s + j.matNeed, 0) / 12;
  const lowPicks = new Set(mr.shuffle(ind.materials.filter((m) => m.id !== runout)).slice(0, 3).map((m) => m.id));
  const whole = (n: number) => Math.round(n);
  const materials: Material[] = ind.materials.map((m) => {
    const use = monthlyUse(m.id);
    const demand = open.filter((j) => j.materialId === m.id && unstarted(j)).reduce((s, j) => s + j.matNeed, 0);
    let reorderAt = whole(use > 0 ? use * 0.6 : mr.range(6, 30));
    let onHand = whole(demand + reorderAt * mr.range(1.3, 2.6));
    if (lowPicks.has(m.id)) { onHand = whole(Math.max(demand * 1.05, reorderAt * mr.range(0.45, 0.85))); reorderAt = Math.max(reorderAt, whole(onHand * 1.25)); }
    if (m.id === runout) {
      // Enough for the first job, not the second.
      const first = open.find((j) => j.partId === runParts[0].id && unstarted(j))!;
      onHand = whole(first.matNeed + (demand - first.matNeed) * 0.3);
      reorderAt = Math.max(reorderAt, whole(onHand * 1.6));
    }
    return { ...m, onHand, reorderAt, monthlyUse: whole(use) };
  });

  /* purchase orders: the one for the run-out material lands too late */
  const por = stream("pos");
  let poSeq = 3300;
  const pos: PO[] = [];
  const addPo = (materialId: string, qty: number, orderDate: Ymd, eta: Ymd, received = false) => {
    const m = matOf(materialId);
    pos.push({ id: `${F.po}${++poSeq}`, materialId, supplierId: m.supplier, qty, orderDate, eta, cost: Math.round(qty * m.cost), received });
  };
  for (let i = 0; i < 8; i++) {
    const m = por.pick(materials.filter((x) => x.id !== runout));
    const orderDate = addWork(today, -por.int(12, 60));
    addPo(m.id, whole(Math.max(10, m.reorderAt * 1.5)), orderDate, addDays(orderDate, m.leadDays), true);
  }
  for (const m of materials.filter((x) => lowPicks.has(x.id)).slice(0, 2)) addPo(m.id, whole(Math.max(10, m.reorderAt * 1.5)), addWork(today, -2), addWork(today, por.int(3, 8)));
  const runJobs = open.filter((j) => j.materialId === runout && unstarted(j)).sort((a, b) => (needDate(a) < needDate(b) ? -1 : 1));
  const runM = materials.find((m) => m.id === runout)!;
  addPo(runout, whole(Math.max(runM.reorderAt * 2, 60)), addWork(today, -3), addWork(needDate(runJobs[runJobs.length - 1]), 4));

  /* finished goods: repeat parts kept on the shelf */
  const fr = stream("finished");
  const repeat = [...new Set(history.slice(-140).map((j) => j.partId))].slice(0, 10);
  const finished: Finished[] = repeat.map((partId, i) => {
    const last = [...history].reverse().find((j) => j.partId === partId)!;
    const min = Math.max(2, Math.round(last.qty * 0.2));
    return { partId, min, onHand: i % 4 === 1 ? Math.round(min * fr.range(0.3, 0.8)) : Math.round(min * fr.range(1.2, 3.2)), lot: last.lot, unitPrice: +(last.price / last.qty).toFixed(2) };
  });

  /* nonconformances: from high-scrap jobs, plus a couple still open on the floor */
  const nr = stream("nc");
  const badJobs = history.filter((j) => j.scrapQty >= Math.max(1, j.qty * 0.03)).slice(-26);
  const ncs: NC[] = badJobs.map((j) => ({ id: `${F.nc}${++ncSeq}`, date: j.shipDate!, jobId: j.id, qty: j.scrapQty, cause: j.scrapCause!, disposition: nr.pick(ind.dispositions), status: "Closed", owner: ind.staff[1].name }));
  for (const j of open.filter((x) => x.current > 0).slice(1, 3)) {
    ncs.push({ id: `${F.nc}${++ncSeq}`, date: addWork(today, -nr.int(1, 3)), jobId: j.id, qty: Math.max(1, Math.round(j.qty * nr.range(0.02, 0.05))), cause: nr.pick(ind.scrapCauses), disposition: "", status: "Open", owner: ind.staff[1].name });
  }
  ncs.sort((a, b) => (a.date < b.date ? 1 : -1));

  /* maintenance */
  const ar = stream("maintenance");
  const pms: PM[] = [];
  for (const m of ind.machines) {
    for (const [task, every] of ind.pmTasks[m.kind] ?? []) {
      pms.push({ id: `pm${pms.length + 1}`, machineId: m.id, task, every, lastDone: addDays(today, -ar.int(1, Math.max(2, every - 3))) });
    }
  }
  for (const pm of ar.shuffle(pms.filter((x) => x.every >= 30)).slice(0, 2)) pm.lastDone = addDays(today, -(pm.every + ar.int(3, 12)));
  const repairs: Repair[] = Array.from({ length: 14 }, (_, i) => {
    const m = ar.pick(ind.machines);
    return { id: `r${i + 1}`, machineId: m.id, date: addDays(today, -ar.int(4, 330)), title: ar.pick(ind.repairs), cost: Math.round(ar.range(120, 4800) / 10) * 10, downtime: +ar.range(1.5, 26).toFixed(1), by: ind.staff[4].name, photos: ar.int(1, 3) };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));

  /* the weekly scorecard: last 13 full weeks, from the same jobs */
  const thisWeek = weekStart(today);
  const allSteps = [...history, ...open].flatMap((j) => j.steps.filter((s) => s.state === "done" && s.machineId));
  const capacity = ind.machines.length * ind.hoursPerMachineWeek;
  // A long step runs over several days: spread its hours back from the day it finished, at a full day per machine.
  const perDay = ind.hoursPerMachineWeek / 5;
  const dayHours = new Map<string, number>();
  for (const s of allSteps) {
    const span = Math.max(1, Math.ceil(s.hours / perDay));
    for (let i = 0; i < span; i++) {
      const key = `${addWork(s.date, -i)}|${s.machineId}`;
      dayHours.set(key, (dayHours.get(key) ?? 0) + s.hours / span);
    }
  }
  const hoursBetween = (from: Ymd, to: Ymd, machineId?: string) => {
    let t = 0;
    for (const [key, h] of dayHours) {
      const [d, m] = key.split("|");
      if (d >= from && d < to && (!machineId || m === machineId)) t += h;
    }
    return t;
  };
  const weeks: Week[] = Array.from({ length: 13 }, (_, i) => {
    const start = addDays(thisWeek, -7 * (13 - i));
    const end = addDays(start, 7);
    const within = (d?: Ymd) => !!d && d >= start && d < end;
    const shipped = history.filter((j) => within(j.shipDate));
    const pieces = shipped.reduce((s, j) => s + j.qty, 0);
    const hours = hoursBetween(start, end);
    return {
      start, label: shortDate(start), shipped: shipped.length, hours,
      onTime: shipped.length ? (shipped.filter((j) => j.shipDate! <= j.dueDate).length / shipped.length) * 100 : 100,
      scrap: pieces ? (shipped.reduce((s, j) => s + j.scrapQty, 0) / pieces) * 100 : 0,
      utilization: (hours / capacity) * 100,
      cash: history.filter((j) => within(j.invoice?.paid)).reduce((s, j) => s + j.price, 0),
      quotesWon: [...history, ...open].filter((j) => within(j.orderDate)).length, // won the day the order came in
    };
  });
  // Per machine: the last four full weeks, so one big job doesn't swing the bar.
  const machineUse = new Map(ind.machines.map((m) => [m.id, Math.min(100, (hoursBetween(addDays(thisWeek, -28), thisWeek, m.id) / (ind.hoursPerMachineWeek * 4)) * 100)]));

  /* cash by month */
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1 - (11 - i), 1)).toISOString().slice(0, 7);
    return { month: d, cash: history.filter((j) => j.invoice?.paid && monthKey(j.invoice.paid) === d).reduce((s, j) => s + j.price, 0), shipped: history.filter((j) => j.shipDate && monthKey(j.shipDate) === d).reduce((s, j) => s + j.price, 0) };
  });

  return { today, shipDay, customers, parts, partOf, history, open, quotes, materials, heats, pos, finished, ncs, pms, repairs, weeks, months, machineUse, needDate, seq: { job: jobSeq, quote: quoteSeq, lot: lotSeq, po: poSeq } };
}

export type Shop = ReturnType<typeof buildShop>;
