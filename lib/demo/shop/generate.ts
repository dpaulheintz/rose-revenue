// Deterministic contractor simulation, keyed by slug. Jobs are sold through the
// year by season, priced from estimate line items, then scheduled into each
// crew's daily capacity. That allocation IS the timesheet, so crew hours and
// job labor always agree. Invoices are cut from the contract (deposit,
// progress, final) and payments are drawn against them, never past them.

import { addDays, addMonths, diffDays, eachDay, monthIndex, monthKey, weekStart, weekday, type Ymd } from "../dates";
import { hash, makeRng, type Rng } from "../rng";
import type {
  Callback, ChangeOrder, CrewId, Customer, Estimate, EstimateOption, Inspection, Invoice, Job, JobTypeSeed, Lead, LeadSource, LineItem,
  Note, Payment, Permit, Photo, PurchaseOrder, Receipt, ShopData, ShopSeed, SubBill, TimeEntry, Weather,
} from "./types";

const HI = [35, 39, 50, 62, 72, 80, 84, 82, 76, 64, 51, 40];
const LO = [20, 22, 30, 40, 50, 59, 63, 61, 54, 43, 34, 25];
const round5 = (n: number) => Math.round(n / 5) * 5;
const money2 = (n: number) => Math.round(n * 100) / 100;

function phone(rng: Rng, area: string) {
  return `(${area}) 555-01${String(rng.int(0, 99)).padStart(2, "0")}`;
}

/** Workdays: Mon–Fri, minus the big holidays. */
function holidays(year: number) {
  const tg = addDays(`${year}-11-01`, ((4 - weekday(`${year}-11-01`) + 7) % 7) + 21);
  return new Set([`${year}-01-01`, `${year}-07-04`, `${year}-12-25`, `${year}-12-24`, tg, addDays(tg, 1)]);
}

export function buildShop(slug: string, cfgSeed: number, seed: ShopSeed, anchor: Ymd): ShopData {
  const base = (hash(slug) ^ cfgSeed) >>> 0;
  const stream = (key: string) => makeRng((base ^ hash(key)) >>> 0);

  const yesterday = addDays(anchor, -1);
  const curMonth = monthKey(anchor);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(curMonth, i - 12));
  const windowStart: Ymd = `${months[0]}-01`;
  const simStart = addDays(windowStart, -75);
  const horizon = addDays(anchor, 42);
  const thisMonday = weekStart(anchor);
  const weeks = Array.from({ length: 13 }, (_, i) => addDays(thisMonday, -7 * (13 - i)));
  const hol = new Set<Ymd>();
  for (let y = +simStart.slice(0, 4); y <= +horizon.slice(0, 4) + 1; y++) for (const d of holidays(y)) hol.add(d);
  const isWork = (d: Ymd) => weekday(d) !== 0 && weekday(d) !== 6 && !hol.has(d);
  const nextWork = (d: Ymd) => { while (!isWork(d)) d = addDays(d, 1); return d; };
  const types = new Map(seed.jobTypes.map((t) => [t.key, t]));
  const crewOf = (c: CrewId) => seed.workers.filter((w) => w.crew === c);
  const crewRate = (c: CrewId) => (c === "remodel" ? 85 : 115);
  const crewCost = (c: CrewId) => { const ws = crewOf(c); return ws.reduce((s, w) => s + w.cost, 0) / ws.length; };

  /* ------------------------------ customers ----------------------------- */
  const cr = stream("customers");
  const customers: Customer[] = [];
  const usedNames = new Set<string>();
  const usedAddr = new Set<string>();
  const address = () => {
    let a = "";
    do a = `${cr.int(2, 98) * 10 + cr.int(0, 9)} ${cr.pick(seed.streets)}`; while (usedAddr.has(a));
    usedAddr.add(a);
    return a;
  };
  const source = (r: Rng) => r.weighted(seed.sources, (s) => s.share).name;
  const personName = () => {
    let n = "";
    do n = `${cr.pick(seed.names.first)} ${cr.pick(seed.names.last)}`; while (usedNames.has(n));
    usedNames.add(n);
    return n;
  };
  const email = (n: string, domain = "example.com") => `${n.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".")}@${domain}`;
  for (let i = 0; i < 168; i++) {
    const name = personName();
    const early = cr.chance(0.6);
    const town = cr.pick(seed.towns);
    const props = [{ id: `pr${i}a`, address: address(), town }];
    if (cr.chance(0.07)) props.push({ id: `pr${i}b`, address: address(), town: cr.pick(seed.towns) });
    customers.push({
      id: `c${String(i + 1).padStart(3, "0")}`, kind: "Homeowner", name, contact: name,
      phone: phone(cr, cr.chance(0.7) ? "614" : "740"), email: email(name), properties: props,
      since: early ? addDays(windowStart, -cr.int(60, 5 * 365)) : addDays(windowStart, cr.int(0, diffDays(anchor, windowStart) - 1)),
      source: source(cr), priorSpend: early ? round5(cr.chance(0.25) ? cr.range(8000, 42000) : cr.range(250, 3200)) : 0,
      note: cr.chance(0.25) ? cr.pick(seed.notes) : null,
    });
  }
  seed.companies.pm.forEach((co, i) => {
    const contact = personName();
    const n = cr.int(4, 9);
    customers.push({
      id: `pm${i + 1}`, kind: "Property manager", name: co, contact, phone: phone(cr, "614"),
      email: email(contact.split(" ")[0], `${co.toLowerCase().replace(/[^a-z]/g, "")}.example.com`),
      properties: Array.from({ length: n }, (_, k) => ({ id: `pm${i + 1}-${k}`, address: `${address()}${cr.chance(0.4) ? `, Unit ${cr.int(1, 4)}` : ""}`, town: cr.pick(seed.towns) })),
      since: addDays(windowStart, -cr.int(200, 1800)), source: cr.chance(0.6) ? "Referral" : "Repeat", priorSpend: round5(cr.range(6000, 30000)), note: "Net 30. Tenants on site; call the manager before arriving.",
    });
  });
  seed.companies.builder.forEach((co, i) => {
    const contact = personName();
    const street = cr.pick(seed.streets);
    customers.push({
      id: `bd${i + 1}`, kind: "Builder", name: co, contact, phone: phone(cr, "614"),
      email: email(contact.split(" ")[0], `${co.toLowerCase().replace(/[^a-z]/g, "")}.example.com`),
      properties: Array.from({ length: cr.int(3, 6) }, (_, k) => ({ id: `bd${i + 1}-${k}`, address: `Lot ${cr.int(3, 60)}, ${street}`, town: cr.pick(seed.towns) })),
      since: addDays(windowStart, -cr.int(150, 1500)), source: "Referral", priorSpend: round5(cr.range(12000, 60000)), note: "Draw schedule: invoice at rough-in and at final.",
    });
  });
  const homeowners = customers.filter((c) => c.kind === "Homeowner");
  const pms = customers.filter((c) => c.kind === "Property manager");
  const builders = customers.filter((c) => c.kind === "Builder");

  /* -------------------------------- sales ------------------------------- */
  type Draft = { t: JobTypeSeed; start: Ymd; customer: Customer; property: string; rng: Rng };
  const drafts: Draft[] = [];
  const span = eachDay(simStart, horizon);
  const jr = stream("jobs");
  for (const t of seed.jobTypes) {
    const n = Math.round((t.perYear * span.length) / 365 * jr.jitter(0.08));
    const weights = span.map((d) => (isWork(d) ? t.season[monthIndex(d)] : 0));
    const total = weights.reduce((s, w) => s + w, 0);
    for (let k = 0; k < n; k++) {
      let r = jr.next() * total;
      let i = 0;
      for (; i < weights.length - 1; i++) { r -= weights[i]; if (r <= 0) break; }
      const start = span[i];
      // Who it's for: rentals for property managers, new-build HVAC/decks for builders.
      const pickFrom = t.group === "Service" && jr.chance(0.32) ? pms : (t.key === "hvac-install" || t.key === "deck") && jr.chance(0.2) ? builders : homeowners;
      const eligible = pickFrom.filter((c) => c.kind !== "Homeowner" || c.since <= start || c.since <= addDays(start, 30));
      const customer = jr.pick(eligible.length ? eligible : pickFrom);
      drafts.push({ t, start, customer, property: jr.pick(customer.properties).id, rng: stream(`job-${t.key}-${k}`) });
    }
  }
  // Today and tomorrow always have service calls on the board (booked like any other job).
  const svc = ["hvac-repair", "tune-up", "service", "plumbing-repair", "service"];
  for (const [k, day] of [anchor, anchor, anchor, nextWork(addDays(anchor, 1)), nextWork(addDays(anchor, 1))].entries()) {
    if (!isWork(day)) continue;
    const t = types.get(svc[k])!;
    const customer = jr.chance(0.3) ? jr.pick(pms) : jr.pick(homeowners.filter((c) => c.since <= anchor));
    drafts.push({ t, start: day, customer, property: jr.pick(customer.properties).id, rng: stream(`job-board-${k}`) });
  }
  drafts.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.t.key.localeCompare(b.t.key)));

  /* ------------------------------ pricing ------------------------------- */
  const mk = seed.markup;
  const priceJob = (t: JobTypeSeed, r: Rng): { options: EstimateOption[]; chosen: number; hours: number; mechHours: number } => {
    const rate = crewRate(t.crew);
    const cost = crewCost(t.crew);
    if (!t.big && t.key !== "hvac-install") {
      // Service-style pricing: hours on site + trip charge + parts.
      const hours = Math.round(r.range(t.hours[0], t.hours[1]) * 2) / 2;
      const laborPrice = hours * rate + (t.group === "Service" ? 89 : 0);
      const parts = round5((laborPrice / (1 - t.mat)) * t.mat * r.jitter(0.15));
      const lines: LineItem[] = [
        { kind: "Labor", desc: t.labor[0], qty: hours, unit: "hr", price: rate, cost },
        ...(t.group === "Service" ? [{ kind: "Labor" as const, desc: "Trip + diagnostic", qty: 1, unit: "ea", price: 89, cost: 20 }] : []),
        { kind: "Materials", desc: t.materials[0], qty: 1, unit: "lot", price: parts, cost: money2(parts / (1 + mk.materials)) },
        ...(t.materials[1] ? [{ kind: "Materials" as const, desc: t.materials[1], qty: 1, unit: "lot", price: round5(parts * 0.18), cost: money2((parts * 0.18) / (1 + mk.materials)) }] : []),
      ];
      return { options: [{ name: "Standard", lines }], chosen: 0, hours, mechHours: 0 };
    }
    const target = r.range(t.price[0], t.price[1]);
    const laborShare = 1 - t.mat - t.sub;
    const mechHours = t.mechHours ? Math.round(r.range(t.mechHours[0], t.mechHours[1])) : 0;
    const hours = Math.max(8, Math.round((target * laborShare - mechHours * 115) / rate));
    const build = (matScale: number): LineItem[] => {
      const lines: LineItem[] = [];
      const split = (n: number, k: number) => { const w = Array.from({ length: k }, () => r.range(0.6, 1.4)); const s = w.reduce((a, b) => a + b, 0); return w.map((x) => (n * x) / s); };
      split(hours, t.labor.length).forEach((h, i) => lines.push({ kind: "Labor", desc: t.labor[i], qty: Math.max(2, Math.round(h)), unit: "hr", price: rate, cost }));
      if (mechHours) lines.push({ kind: "Labor", desc: t.crew === "remodel" ? "Plumbing / HVAC rough-in" : "Mechanical", qty: mechHours, unit: "hr", price: 115, cost: crewCost("mech") });
      split(target * t.mat * matScale, t.materials.length).forEach((p, i) => lines.push({ kind: "Materials", desc: t.materials[i], qty: 1, unit: "lot", price: round5(p), cost: money2(round5(p) / (1 + mk.materials)) }));
      if (t.subs.length && t.sub > 0) split(target * t.sub, t.subs.length).forEach((p, i) => lines.push({ kind: "Subcontractor", desc: t.subs[i], qty: 1, unit: "lot", price: round5(p), cost: money2(round5(p) / (1 + mk.subs)) }));
      return lines;
    };
    if (!t.big) return { options: [{ name: "Standard", lines: build(1) }], chosen: 0, hours, mechHours };
    const options = [{ name: "Good", lines: build(0.82) }, { name: "Better", lines: build(1) }, { name: "Best", lines: build(1.28) }];
    return { options, chosen: r.weighted([0, 1, 2], (i) => [0.22, 0.58, 0.2][i]), hours, mechHours };
  };
  const optTotals = (o: EstimateOption) => {
    const sub = o.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const mat = o.lines.filter((l) => l.kind === "Materials").reduce((s, l) => s + l.qty * l.price, 0);
    return { subtotal: money2(sub), tax: money2(mat * seed.taxRate), total: money2(sub + mat * seed.taxRate) };
  };

  /* ----------------------------- scheduling ----------------------------- */
  // Hours already booked per crew per day.
  const booked = new Map<string, number>();
  const cap = (c: CrewId) => crewOf(c).length * 8;
  const alloc = new Map<string, Array<{ job: string; hours: number }>>(); // `${crew}|${day}`
  const book = (crew: CrewId, d: Ymd, job: string, h: number) => {
    const key = `${crew}|${d}`;
    booked.set(key, (booked.get(key) ?? 0) + h);
    (alloc.get(key) ?? alloc.set(key, []).get(key)!).push({ job, hours: h });
  };
  /** Spread `hours` from `from` onward, at most `perDay` a day, within free crew capacity. */
  const schedule = (crew: CrewId, from: Ymd, job: string, hours: number, perDay: number, r: Rng) => {
    const days: Ymd[] = [];
    let left = hours;
    let d = nextWork(from);
    let guard = 0;
    while (left > 0.01 && guard++ < 400) {
      if (isWork(d)) {
        const free = cap(crew) - (booked.get(`${crew}|${d}`) ?? 0);
        // Big jobs have sub days and inspection waits: the crew isn't always all-in.
        const want = Math.min(left, perDay * (perDay >= 16 ? r.range(0.55, 1) : 1));
        const h = Math.floor(Math.min(want, free) * 2) / 2;
        if (h > 0 && h >= Math.min(1, left)) {
          book(crew, d, job, h);
          days.push(d);
          left -= h;
        }
      }
      d = addDays(d, 1);
    }
    return days;
  };

  /* ------------------------------ build jobs ---------------------------- */
  const jobs: Job[] = [];
  const estimates: Estimate[] = [];
  const changeOrders: ChangeOrder[] = [];
  const actualPlan = new Map<string, { matFactor: number; subFactor: number; coCost: number }>();
  let jobNo = 1801;
  let coNo = 101;
  for (const dft of drafts) {
    const { t, customer, rng: r } = dft;
    const priced = priceJob(t, r);
    const chosen = priced.options[priced.chosen];
    const tot = optTotals(chosen);
    const id = `j${jobNo}`;
    // Booking lead time: remodels months out, tune-ups weeks out, no-heat calls same day.
    const lead = t.big ? r.int(21, 60) : ({ "hvac-install": r.int(5, 30), "water-heater": r.int(0, 6), "tune-up": r.int(5, 40), service: r.int(2, 28), "plumbing-repair": r.int(0, 10), "hvac-repair": r.int(0, 3) } as Record<string, number>)[t.key] ?? r.int(0, 3);
    const sold = addDays(dft.start, -lead);
    if (sold > anchor) continue; // not sold yet
    // Labor actually used: estimate ± field reality; a few jobs blow through it.
    const over = t.big && r.chance(0.18);
    const laborFactor = over ? r.range(1.12, 1.3) : r.range(0.88, 1.1);
    const matFactor = over && r.chance(0.6) ? r.range(1.1, 1.28) : r.range(0.93, 1.07);
    // Change orders (sold extras) on bigger jobs.
    const cos: ChangeOrder[] = [];
    const ideas = seed.coIdeas[t.key] ?? [];
    const nCo = ideas.length ? (t.big ? r.weighted([0, 1, 2, 3], (n) => [0.35, 0.35, 0.2, 0.1][n]) : r.chance(0.15) ? 1 : 0) : 0;
    const usedIdeas = r.shuffle(ideas).slice(0, nCo);
    const laborHours = Math.max(1, Math.round(priced.hours * laborFactor * 2) / 2); // half-hour grid
    const perDay = t.crew === "remodel" ? 24 : t.key === "hvac-install" ? 16 : 8;
    const days = schedule(t.crew, dft.start, id, laborHours, perDay, r);
    for (const title of usedIdeas) {
      const amount = round5(tot.total * r.range(0.015, 0.06) + 250);
      const created = days[Math.min(days.length - 1, r.int(0, Math.max(0, days.length - 1)))] ?? dft.start;
      cos.push({ id: `co${coNo}`, no: `CO-${coNo++}`, job: id, title, amount, cost: money2(amount * 0.62), created, status: "Approved", signed: created });
    }
    const coCostApproved = cos.reduce((s, c) => s + c.cost, 0);
    // CO labor rides on the same crew right after the main work.
    const coHours = Math.round((coCostApproved * 0.4) / crewCost(t.crew));
    const coDays = coHours ? schedule(t.crew, days.at(-1) ?? dft.start, id, coHours, perDay, r) : [];
    if (priced.mechHours) {
      const at = days[Math.floor(days.length * 0.38)] ?? dft.start;
      schedule("mech", at, id, priced.mechHours * r.range(0.9, 1.15), 16, r);
    }
    const allDays = [...new Set([...days, ...coDays])].sort();
    const e: Estimate | null = t.big || t.key === "hvac-install" || t.key === "water-heater"
      ? {
          id: `e${jobNo}`, no: "", customer: customer.id, property: dft.property, type: t.key, title: r.pick(t.titles),
          created: addDays(sold, -r.int(2, t.big ? 18 : 3)), sent: null, viewed: null, decided: sold, status: "Approved",
          options: priced.options, chosen: priced.chosen, depositPct: t.big ? 0.3 : t.key === "hvac-install" ? 0.25 : 0, job: id, source: customer.kind === "Homeowner" ? customer.source : "Repeat",
        }
      : null;
    if (e) { e.sent = addDays(e.created, r.int(0, 1)); e.viewed = addDays(e.sent, r.int(0, 2)); estimates.push(e); }
    const matCost = chosen.lines.filter((l) => l.kind === "Materials").reduce((s, l) => s + l.qty * l.cost, 0);
    const subCost = chosen.lines.filter((l) => l.kind === "Subcontractor").reduce((s, l) => s + l.qty * l.cost, 0);
    const budgetHours = chosen.lines.filter((l) => l.kind === "Labor" && l.unit === "hr").reduce((s, l) => s + l.qty, 0);
    const budgetLaborCost = chosen.lines.filter((l) => l.kind === "Labor").reduce((s, l) => s + l.qty * l.cost, 0);
    const startTime = t.crew === "remodel" ? "7:30" : "8:00";
    jobs.push({
      id, no: `J-${jobNo}`, type: t.key, group: t.group, customer: customer.id, property: dft.property, crew: t.crew,
      title: e?.title ?? r.pick(t.titles), scope: "", sold, start: allDays[0] ?? dft.start, end: allDays.at(-1) ?? dft.start, days: allDays, startTime,
      estimate: e?.id ?? null, contract: tot.total, lines: chosen.lines,
      budget: { materials: money2(matCost + coCostApproved * 0.6), laborHours: Math.round(budgetHours + coHours), laborCost: money2(budgetLaborCost + coCostApproved * 0.4), subs: money2(subCost) },
      status: "Scheduled",
    });
    changeOrders.push(...cos);
    actualPlan.set(id, { matFactor, subFactor: r.range(0.97, 1.04), coCost: coCostApproved });
    jobNo++;
  }
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const custById = new Map(customers.map((c) => [c.id, c]));
  const propOf = (j: Job) => custById.get(j.customer)!.properties.find((p) => p.id === j.property)!;

  // Scope text + statuses.
  for (const j of jobs) {
    const t = types.get(j.type)!;
    const est = estimates.find((e) => e.id === j.estimate);
    const opt = est ? est.options[est.chosen] : null;
    if (j.type === "tune-up") { j.scope = "Seasonal tune-up: inspect, clean burners/coils, test safeties, replace filter."; j.status = j.end < anchor ? "Complete" : j.start < anchor ? "In progress" : "Scheduled"; continue; }
    j.scope = opt
      ? `${opt.name === "Standard" ? "" : `${opt.name} option. `}${opt.lines.filter((l) => l.kind !== "Labor").map((l) => l.desc).join(", ")}.`
      : `${t.label}: diagnose and repair. Parts as needed.`;
    j.status = j.end < anchor ? "Complete" : j.start < anchor ? "In progress" : "Scheduled";
  }

  // Change orders on live jobs: the newest is still waiting on the customer's signature.
  const live = jobs.filter((j) => j.status === "In progress" && types.get(j.type)!.big);
  for (const j of live.slice(0, 2)) {
    const ideas = seed.coIdeas[j.type] ?? [];
    const title = ideas.find((x) => !changeOrders.some((c) => c.job === j.id && c.title === x)) ?? "Added scope";
    const amount = round5(j.contract * 0.035 + 300);
    changeOrders.push({ id: `co${coNo}`, no: `CO-${coNo++}`, job: j.id, title, amount, cost: money2(amount * 0.62), created: addDays(anchor, -2), status: "Awaiting signature", signed: null });
  }
  // A few declined extras on finished jobs.
  const cdr = stream("co-declined");
  for (const c of changeOrders) if (c.status === "Approved" && jobById.get(c.job)!.status === "Complete" && cdr.chance(0.1)) { c.status = "Declined"; c.signed = null; }
  changeOrders.sort((a, b) => (a.created < b.created ? -1 : 1));
  const approvedCo = (jobId: string) => changeOrders.filter((c) => c.job === jobId && c.status === "Approved").reduce((s, c) => s + c.amount, 0);

  /* ------------------------------ timesheets ---------------------------- */
  const time: TimeEntry[] = [];
  const planned: TimeEntry[] = [];
  const lastDay = jobs.reduce((m, j) => (j.end > m ? j.end : m), horizon);
  for (const crew of seed.crews) {
    const ws = crewOf(crew.id);
    for (const d of eachDay(simStart, lastDay)) {
      if (!isWork(d)) continue;
      const list = alloc.get(`${crew.id}|${d}`) ?? [];
      const out = d < anchor ? time : planned;
      // The day's job hours go out in half-hour chunks to whoever has the lightest day,
      // so nobody passes 8; whatever's left is shop, drive + estimates.
      const load = ws.map(() => 0);
      for (const a of list) {
        const share = ws.map(() => 0);
        for (let k = 0; k < Math.round(a.hours * 2); k++) {
          let w = 0;
          for (let i = 1; i < ws.length; i++) if (load[i] < load[w]) w = i;
          load[w] += 0.5;
          share[w] += 0.5;
        }
        ws.forEach((w, i) => { if (share[i] > 0) out.push({ worker: w.id, date: d, job: a.job, hours: share[i] }); });
      }
      if (d < anchor) ws.forEach((w, i) => { if (load[i] < 8) time.push({ worker: w.id, date: d, job: null, hours: 8 - load[i] }); });
    }
  }

  /* ---------------------- materials, subs: actual costs ------------------ */
  const pr = stream("purchasing");
  const pos: PurchaseOrder[] = [];
  const receipts: Receipt[] = [];
  const subBills: SubBill[] = [];
  let poNo = 5101;
  const supplierFor = (desc: string, t: JobTypeSeed) =>
    /cabinet/i.test(desc) ? "p5" : /tile/i.test(desc) ? "p4" : /equipment|thermostat|duct|line set/i.test(desc) ? "p3" : /water heater|valve|venting|sink|faucet|fixture|fitting|shower/i.test(desc) || t.key === "plumbing-repair" ? "p2" : t.key === "hvac-repair" ? "p3" : "p1";
  for (const j of jobs) {
    const t = types.get(j.type)!;
    const plan = actualPlan.get(j.id)!;
    const est = estimates.find((e) => e.id === j.estimate);
    const lines = est ? est.options[est.chosen].lines : [];
    const matCostLines = lines.filter((l) => l.kind === "Materials");
    const matTotal = (j.budget.materials - plan.coCost * 0.6) * plan.matFactor + plan.coCost * 0.6;
    if (!est) {
      // Service work: parts on a card receipt the day of the call.
      const parts = money2(j.budget.materials * plan.matFactor);
      if (parts > 0) receipts.push({ id: `r${receipts.length + 1}`, job: j.id, supplier: supplierFor("", t), date: j.start, amount: parts, note: "Parts", by: crewOf(j.crew)[0].id });
    } else {
      // POs ahead of and during the job (88%), hardware runs on receipts (12%).
      const poShare = 0.88;
      let first = true;
      for (const l of matCostLines) {
        const amt = money2(((l.qty * l.cost) / Math.max(1, matCostLines.reduce((s, x) => s + x.qty * x.cost, 0))) * (matTotal - plan.coCost * 0.6) * poShare);
        const d = first ? addDays(j.start, -pr.int(3, 10)) : j.days[Math.floor(j.days.length * pr.range(0.1, 0.6))] ?? j.start;
        first = false;
        pos.push({ id: `po${poNo}`, no: `PO-${poNo++}`, job: j.id, supplier: supplierFor(l.desc, t), date: d < j.sold ? j.sold : d, amount: amt, status: "Ordered", items: l.desc });
      }
      const extra = money2(matTotal - pos.filter((p) => p.job === j.id).reduce((s, p) => s + p.amount, 0));
      const nR = Math.max(1, Math.min(4, Math.round(j.days.length / 6)));
      for (let k = 0; k < nR; k++) {
        const amt = k === nR - 1 ? money2(extra - receipts.filter((x) => x.job === j.id).reduce((s, x) => s + x.amount, 0)) : money2(extra / nR * pr.range(0.7, 1.3));
        receipts.push({ id: `r${receipts.length + 1}`, job: j.id, supplier: k === 0 ? "p6" : pr.pick(["p6", "p1"]), date: j.days[Math.floor((j.days.length - 1) * ((k + 1) / (nR + 1)))] ?? j.start, amount: amt, note: pr.pick(["Fasteners + adhesive", "Blades, caulk + tape", "Extra trim", "Fittings run", "Shims + hardware"]), by: crewOf(j.crew)[0].id });
      }
      // Sub bills land late in the job.
      const subLines = lines.filter((l) => l.kind === "Subcontractor");
      for (const l of subLines) {
        const sub = seed.subs.filter((s) => s.trade === l.desc);
        const s = sub.length ? pr.pick(sub) : seed.subs[0];
        const d = j.days[Math.floor((j.days.length - 1) * pr.range(0.55, 0.95))] ?? j.end;
        subBills.push({ id: `sb${subBills.length + 1}`, job: j.id, sub: s.id, date: d, amount: money2(l.qty * l.cost * plan.subFactor), paid: diffDays(anchor, d) > 14, work: l.desc });
      }
      // CO materials: one more PO on approved extras.
      if (plan.coCost) pos.push({ id: `po${poNo}`, no: `PO-${poNo++}`, job: j.id, supplier: "p1", date: j.days[Math.floor(j.days.length * 0.7)] ?? j.end, amount: money2(plan.coCost * 0.6), status: "Ordered", items: "Change-order materials" });
    }
  }
  for (const p of pos) p.status = diffDays(anchor, p.date) > 7 ? "Billed" : p.date < anchor ? "Delivered" : "Ordered";

  /* -------------------------- invoices + payments ------------------------ */
  const ir = stream("billing");
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  let invNo = 3401;
  const method = (c: Customer, r: Rng) => (c.kind === "Homeowner" ? r.weighted(["Card", "Check", "ACH", "Cash"] as const, (m) => ({ Card: 0.5, Check: 0.26, ACH: 0.18, Cash: 0.06 })[m]) : r.chance(0.6) ? "ACH" : "Check");
  const ref = (m: string, r: Rng) => (m === "Card" ? `Card •• ${r.int(10, 99)}` : m === "Check" ? `Check #${r.int(1001, 9899)}` : m === "ACH" ? `ACH ${r.int(100000, 999999)}` : "Cash");
  const pay = (inv: Invoice, c: Customer, r: Rng, kind: "deposit" | "service" | "progress" | "final") => {
    let lag = kind === "deposit" ? r.int(0, 5) : c.kind === "Property manager" ? r.int(18, 42) : kind === "service" ? (r.chance(0.66) ? 0 : r.int(3, 24)) : r.int(1, 24);
    const slow = r.chance(c.kind === "Homeowner" ? 0.13 : 0.22);
    if (slow && kind !== "deposit") lag = r.int(38, 110);
    const d = addDays(inv.issued, lag);
    if (d > yesterday) return;
    const m = method(c, r);
    if (kind === "final" && r.chance(0.08)) {
      // Partial now, the rest a few weeks later.
      const part = money2(inv.amount * r.range(0.4, 0.75));
      payments.push({ id: `pay${payments.length + 1}`, invoice: inv.id, date: d, amount: part, method: m, ref: ref(m, r) });
      const d2 = addDays(d, r.int(14, 45));
      if (d2 <= yesterday) payments.push({ id: `pay${payments.length + 1}`, invoice: inv.id, date: d2, amount: money2(inv.amount - part), method: m, ref: ref(m, r) });
      return;
    }
    payments.push({ id: `pay${payments.length + 1}`, invoice: inv.id, date: d, amount: inv.amount, method: m, ref: ref(m, r) });
  };
  const issue = (j: Job, kind: Invoice["kind"], date: Ymd, amount: number, terms: number) => {
    const inv: Invoice = { id: `inv${invNo}`, no: `INV-${invNo++}`, job: j.id, customer: j.customer, kind, issued: date, due: addDays(date, terms), amount: money2(amount), viewed: ir.chance(0.75), draft: false };
    invoices.push(inv);
    return inv;
  };
  for (const j of jobs) {
    const t = types.get(j.type)!;
    const c = custById.get(j.customer)!;
    const est = estimates.find((e) => e.id === j.estimate);
    const total = money2(j.contract + approvedCo(j.id));
    const terms = c.kind === "Homeowner" ? 15 : 30;
    const finishedOn = addDays(j.end, ir.int(0, 2));
    if (est && est.depositPct > 0) {
      const dep = issue(j, "Deposit", j.sold, Math.round(j.contract * est.depositPct), 7);
      pay(dep, c, ir, "deposit");
      let billed = dep.amount;
      if (t.big) {
        const mid = j.days[Math.floor(j.days.length * 0.45)];
        if (mid && mid <= yesterday) { const pg = issue(j, "Progress", mid, Math.round(j.contract * 0.4), terms); pay(pg, c, ir, "progress"); billed += pg.amount; }
      }
      if (j.end < anchor && finishedOn <= yesterday) { const fin = issue(j, "Final", finishedOn, total - billed, terms); pay(fin, c, ir, "final"); }
    } else if (j.end < anchor && finishedOn <= yesterday) {
      const inv = issue(j, est ? "Final" : "Service", finishedOn, total, est ? terms : c.kind === "Homeowner" ? 0 : 30);
      pay(inv, c, ir, "service");
    }
  }
  // Invoices from the last day or two are still drafts on the office desk.
  // The newest finished-job invoices are still drafts on the office desk.
  const unsent = invoices.filter((inv) => diffDays(anchor, inv.issued) <= 4 && (inv.kind === "Final" || inv.kind === "Service")).sort((a, b) => (a.issued < b.issued ? 1 : a.issued > b.issued ? -1 : b.amount - a.amount)).slice(0, 2);
  for (const inv of unsent) {
    inv.draft = true;
    inv.viewed = false;
    for (let k = payments.length - 1; k >= 0; k--) if (payments[k].invoice === inv.id) payments.splice(k, 1); // a draft can't have been paid
  }
  invoices.sort((a, b) => (a.issued < b.issued ? -1 : 1));
  const paidUp = (jobId: string) => {
    const invs = invoices.filter((i) => i.job === jobId);
    const due = invs.reduce((s, i) => s + i.amount, 0);
    const got = payments.filter((p) => invs.some((i) => i.id === p.invoice)).reduce((s, p) => s + p.amount, 0);
    return invs.length > 0 && got >= due - 0.01;
  };
  for (const j of jobs) if (j.status === "Complete" && paidUp(j.id) && Math.abs(invoices.filter((i) => i.job === j.id).reduce((s, i) => s + i.amount, 0) - (j.contract + approvedCo(j.id))) < 0.01) j.status = "Paid";

  /* -------------------------- lost + open estimates ---------------------- */
  const er = stream("estimates");
  for (const t of seed.jobTypes.filter((x) => x.big || x.key === "hvac-install" || x.key === "water-heater")) {
    const won = estimates.filter((e) => e.type === t.key && e.decided && e.decided >= windowStart).length;
    const lossRatio = t.big ? 1.1 : t.key === "hvac-install" ? 0.6 : 0.22;
    const n = Math.round(won * lossRatio * er.jitter(0.15));
    for (let k = 0; k < n; k++) {
      const created = addDays(windowStart, er.int(0, diffDays(anchor, windowStart) - 25));
      const cust = er.pick(homeowners);
      const priced = priceJob(t, er);
      const decided = addDays(created, er.int(8, 30));
      estimates.push({ id: `el-${t.key}-${k}`, no: "", customer: cust.id, property: cust.properties[0].id, type: t.key, title: er.pick(t.titles), created, sent: addDays(created, er.int(0, 1)), viewed: er.chance(0.8) ? addDays(created, er.int(1, 4)) : null, decided, status: er.chance(0.6) ? "Declined" : "Expired", options: priced.options, chosen: priced.chosen, depositPct: t.big ? 0.3 : 0.25, job: null, source: cust.source });
    }
  }
  // Open estimates: sent recently, waiting on the customer.
  const openTypes = ["kitchen", "bath", "bath", "basement", "deck", "deck", "hvac-install", "hvac-install", "hvac-install", "water-heater", "bath"];
  openTypes.forEach((key, k) => {
    const t = types.get(key)!;
    const cust = er.pick(homeowners);
    const priced = priceJob(t, er);
    const created = addDays(anchor, -er.int(1, 19));
    const draft = k >= openTypes.length - 2;
    const sent = draft ? null : addDays(created, er.int(0, 1)) > yesterday ? yesterday : addDays(created, er.int(0, 1));
    estimates.push({ id: `eo-${k}`, no: "", customer: cust.id, property: cust.properties[0].id, type: key, title: er.pick(t.titles), created, sent, viewed: sent && er.chance(0.65) ? (addDays(sent, 1) > yesterday ? yesterday : addDays(sent, 1)) : null, decided: null, status: draft ? "Draft" : "Sent", options: priced.options, chosen: 1 % priced.options.length, depositPct: t.big ? 0.3 : t.key === "hvac-install" ? 0.25 : 0, job: null, source: cust.source });
  });
  for (const e of estimates) if (e.status === "Sent" && e.viewed) e.status = "Viewed";
  estimates.sort((a, b) => (a.created < b.created ? -1 : 1));
  estimates.forEach((e, i) => { e.no = `E-${2201 + i}`; });

  /* ------------------------------- permits ------------------------------ */
  const pmr = stream("permits");
  const permits: Permit[] = [];
  let permitNo = 24100;
  const inspectorIn = (town: string) => (seed.inspectors.find((i) => i.town === town) ?? seed.inspectors[hash(town) % seed.inspectors.length]).id;
  for (const j of jobs) {
    const t = types.get(j.type)!;
    if (!t.permits.length) continue;
    const town = propOf(j).town;
    for (const kind of t.permits) {
      const applied = addDays(j.sold, pmr.int(1, 4));
      const issued = addDays(applied, pmr.int(3, 10));
      const inspections: Inspection[] = [];
      const plan: Array<[string, Ymd]> = t.big
        ? [[kind === "Building" ? "Framing" : "Rough-in", j.days[Math.floor(j.days.length * 0.4)] ?? j.start], ["Final", nextWork(addDays(j.end, pmr.int(1, 5)))]]
        : [["Final", nextWork(addDays(j.end, pmr.int(1, 4)))]];
      for (const [name, date] of plan) {
        const insp = inspectorIn(town);
        if (date <= yesterday) {
          const fail = pmr.chance(0.07);
          inspections.push({ kind: name, date, inspector: insp, result: fail ? "Failed" : "Passed", note: fail ? pmr.pick(["Missing nail plates at plumbing penetrations", "GFCI required within 6 ft of sink", "Handrail height short at stairs", "Combustion air not to code"]) : null });
          if (fail) {
            const re = nextWork(addDays(date, pmr.int(3, 6)));
            inspections.push({ kind: `${name} (re-inspect)`, date: re, inspector: insp, result: re <= yesterday ? "Passed" : "Scheduled", note: null });
          }
        } else if (date <= horizon) inspections.push({ kind: name, date, inspector: insp, result: "Scheduled", note: null });
      }
      permits.push({ id: `pm-${permitNo}`, no: `${kind[0]}-${permitNo++}`, job: j.id, kind, town, applied, issued: issued <= yesterday ? issued : null, inspections });
    }
  }
  // Make sure tomorrow's board has an inspection when there's live work to inspect.
  const tomorrow = nextWork(addDays(anchor, 1));
  const upcoming = permits.flatMap((p) => p.inspections.filter((i) => i.result === "Scheduled").map((i) => ({ p, i }))).sort((a, b) => (a.i.date < b.i.date ? -1 : 1));
  if (upcoming.length && !upcoming.some((x) => x.i.date === tomorrow)) upcoming[0].i.date = tomorrow;

  /* --------------------------- photos + notes --------------------------- */
  const phr = stream("photos");
  const photos: Photo[] = [];
  const notes: Note[] = [];
  const AREAS: Record<string, string[]> = {
    kitchen: ["sink wall", "island", "range wall", "pantry corner"], bath: ["vanity", "shower", "floor tile", "niche"], basement: ["stair landing", "family room", "bedroom", "utility wall"],
    addition: ["footprint", "framing", "roofline", "interior"], deck: ["ledger", "framing", "stairs", "railing"], "hvac-install": ["furnace", "condenser pad", "thermostat"],
    "water-heater": ["old tank", "new tank", "venting"], "hvac-repair": ["unit", "panel"], "plumbing-repair": ["leak", "repair"], service: ["work area"],
  };
  for (const j of jobs) {
    if (j.start > anchor) continue;
    const t = types.get(j.type)!;
    const lead = seed.crews.find((c) => c.id === j.crew)!.lead;
    const areas = AREAS[j.type] ?? ["work area"];
    const add = (tag: Photo["tag"], date: Ymd, n: number) => { for (let k = 0; k < n; k++) photos.push({ id: `ph${photos.length + 1}`, job: j.id, tag, caption: `${t.label} · ${phr.pick(areas)}`, date: date > anchor ? anchor : date, by: lead }); };
    if (t.big) { add("Before", j.start, phr.int(2, 4)); add("During", j.days[Math.floor(j.days.length / 2)] ?? j.start, phr.int(3, 7)); if (j.end < anchor) add("After", j.end, phr.int(2, 4)); }
    else if (t.group === "Mechanical") { add("Before", j.start, 1); if (j.end < anchor) add("After", j.end, phr.int(1, 2)); }
    else if (phr.chance(0.5)) add("After", j.end, 1);
    const nn = t.big ? phr.int(1, 3) : phr.chance(0.25) ? 1 : 0;
    for (let k = 0; k < nn; k++) notes.push({ id: `n${notes.length + 1}`, job: j.id, date: j.days[Math.floor(j.days.length * phr.next())] ?? j.start, by: lead, text: phr.pick(seed.notes) });
  }

  /* ------------------------------ callbacks ----------------------------- */
  const cbr = stream("callbacks");
  const callbacks: Callback[] = [];
  for (const j of jobs) {
    const issues = seed.callbackIssues[j.type];
    if (!issues || j.end >= anchor || j.end < windowStart || !cbr.chance(types.get(j.type)!.big ? 0.42 : 0.12)) continue;
    const opened = addDays(j.end, cbr.int(10, 150));
    if (opened > yesterday) continue;
    const recent = diffDays(anchor, opened) <= 9;
    callbacks.push({
      id: `cb${callbacks.length + 1}`, job: j.id, customer: j.customer, opened, issue: cbr.pick(issues),
      status: recent ? (cbr.chance(0.5) ? "Open" : "Scheduled") : "Resolved",
      visit: recent ? nextWork(addDays(anchor, cbr.int(1, 5))) : addDays(opened, cbr.int(1, 6)),
      tech: j.crew === "remodel" ? "cole" : j.crew === "mech" ? "rhett" : "wes", cost: recent ? 0 : round5(cbr.range(0, 180)),
    });
  }
  for (const c of callbacks) if (c.status === "Open") c.visit = null;

  /* -------------------------------- leads ------------------------------- */
  const lr = stream("leads");
  const leads: Lead[] = [];
  const midPrice = (key: string) => { const t = types.get(key)!; return round5((t.price[0] + t.price[1]) / 2); };
  const totalOf = (e: Estimate) => optTotals(e.options[e.chosen]).total;
  for (const e of estimates) {
    const recent = (e.decided && diffDays(anchor, e.decided) <= 45) || (!e.decided && e.status !== "Draft");
    if (!recent) continue;
    const c = custById.get(e.customer)!;
    leads.push({
      id: `ld-${e.id}`, name: c.name, customer: c.id, town: c.properties[0].town, type: e.type, value: totalOf(e), source: e.source,
      stage: e.status === "Approved" ? "Won" : e.status === "Declined" || e.status === "Expired" ? "Lost" : "Estimate sent",
      created: addDays(e.created, -lr.int(1, 6)), followUp: e.status === "Sent" || e.status === "Viewed" ? addDays(e.sent ?? e.created, 4) : null, estimate: e.id,
      note: e.status === "Approved" ? "Signed. Deposit in." : e.status === "Declined" ? lr.pick(["Went with a cheaper bid.", "Putting it off until spring.", "Budget changed."]) : e.status === "Expired" ? "No response after two follow-ups." : "Estimate out. Follow up by phone.",
    });
  }
  const freshTypes = ["bath", "kitchen", "deck", "hvac-install", "basement", "bath", "water-heater", "deck", "hvac-install", "bath", "kitchen"];
  freshTypes.forEach((key, k) => {
    const stage = k < 6 ? "New" : "Contacted";
    const created = addDays(anchor, -(stage === "New" ? lr.int(0, 3) : lr.int(3, 12)));
    const name = `${lr.pick(seed.names.first)} ${lr.pick(seed.names.last)}`;
    leads.push({
      id: `ld-new-${k}`, name, customer: null, town: lr.pick(seed.towns), type: key, value: midPrice(key), source: lr.weighted(seed.sources, (s) => s.share).name as LeadSource,
      stage, created, followUp: addDays(anchor, stage === "New" ? lr.int(0, 1) : lr.int(0, 5)), estimate: null,
      note: stage === "New" ? lr.pick(["Called in from the website form.", "Instagram DM about a bathroom.", "Referred by a past customer.", "Asked for a site visit next week."]) : lr.pick(["Site visit booked.", "Measured; pricing it this week.", "Waiting on their HOA approval.", "Wants options on composite vs. PT."]),
    });
  });

  /* ------------------------------- weather ------------------------------ */
  const wr = stream(`weather-${anchor}`);
  const weather: Weather[] = eachDay(anchor, addDays(anchor, 4)).map((d) => {
    const m = monthIndex(d);
    const swing = wr.range(-6, 6);
    const sky = wr.weighted(["Sunny", "Partly cloudy", "Cloudy", "Showers", "Rain"] as const, (s) => ({ Sunny: 0.3, "Partly cloudy": 0.3, Cloudy: 0.18, Showers: 0.14, Rain: 0.08 })[s]);
    return { date: d, hi: Math.round(HI[m] + swing), lo: Math.round(LO[m] + swing * 0.7), sky, rain: Math.min(95, { Sunny: 0, "Partly cloudy": 10, Cloudy: 20, Showers: 60, Rain: 85 }[sky] + wr.int(0, 10)) };
  });

  return {
    anchor, windowStart, months, weeks, horizon,
    customers, estimates, jobs, changeOrders, invoices, payments,
    time, schedule: planned, pos, receipts, subBills, permits, photos, notes, callbacks, leads, weather,
  };
}
