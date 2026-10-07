// Deterministic farm simulation. One mulberry32 seed (from the demo slug)
// drives everything; independent streams per concern keep identities stable.
// The sim walks day by day: supply lands (processing returns, cheese comes
// off aging, butter, bakes, eggs), then that day's orders draw it down. So
// nothing can sell that wasn't produced, and every module reads the same
// numbers.

import { addDays, addMonths, diffDays, eachDay, monthIndex, monthKey, weekStart, weekday, type Ymd } from "../dates";
import { hash, makeRng, type Rng } from "../rng";
import type {
  Account, Batch, Bake, BroilerBatch, ButterMake, CheeseMake, Cow, Customer, EggDay, EquipmentItem, FarmData, FarmSeed,
  Flock, Line, MilkDay, MilkTest, Order, Paddock, SkuSeed, Steer, Stockout, Task, TurkeyPreorder, Visit, Weather,
} from "./types";

/* ------------------------------ helpers ------------------------------ */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const yy = (d: Ymd) => d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10);
/** First date on or after d that falls on weekday wd (0 = Sun). */
const onOrAfter = (d: Ymd, wd: number) => addDays(d, (wd - weekday(d) + 7) % 7);
/** nth (1-based) weekday wd of a month "YYYY-MM". */
const nthWeekday = (ym: string, wd: number, n: number) => addDays(onOrAfter(`${ym}-01`, wd), 7 * (n - 1));
const thanksgiving = (year: number) => nthWeekday(`${year}-11`, 4, 4);

// Demand that isn't SKU-specific: more orders in the fall freezer season.
const ORDER_SEASON = [0.92, 0.86, 0.9, 0.95, 1, 1, 0.94, 0.94, 1.02, 1.12, 1.22, 1.14];
// Pasture effect on milk (spring flush, summer slump, winter hay).
const MILK_SEASON = [0.84, 0.84, 0.9, 1.06, 1.16, 1.08, 0.95, 0.92, 0.97, 1, 0.95, 0.87];
// Daylight effect on lay rate (no supplemental light).
const DAYLIGHT = [0.62, 0.68, 0.8, 0.92, 0.98, 1, 1, 0.97, 0.88, 0.74, 0.64, 0.6];
const HI = [35, 39, 50, 62, 72, 80, 84, 82, 76, 64, 51, 40];
const LO = [20, 22, 30, 40, 50, 59, 63, 61, 54, 43, 34, 25];

// Meat demand relative to its listed popularity (tuned so the freezer usually holds stock).
const MEAT = new Set(["beef", "pork", "lamb", "broiler", "bundle"]);
const MEAT_DEMAND = 0.7;

/** Day-length effect, interpolated daily between mid-month values. */
function daylight(d: Ymd) {
  const m = monthIndex(d);
  const day = +d.slice(8, 10);
  const [a, b, f] = day < 15 ? [(m + 11) % 12, m, (day + 15) / 30] : [m, (m + 1) % 12, (day - 15) / 30];
  return DAYLIGHT[a] + (DAYLIGHT[b] - DAYLIGHT[a]) * f;
}

/** Wood's lactation curve, normalized to 1 at the day-50 peak. */
const lactation = (dim: number) => Math.pow(Math.max(dim, 1) / 50, 0.2) * Math.exp(-0.004 * (dim - 50));

function phone(rng: Rng, area: string) {
  return `(${area}) 555-01${String(rng.int(0, 99)).padStart(2, "0")}`;
}

/* ---------------------------- the generator --------------------------- */

export function buildFarm(slug: string, cfgSeed: number, seed: FarmSeed, anchor: Ymd): FarmData {
  const base = (hash(slug) ^ cfgSeed) >>> 0;
  const stream = (key: string) => makeRng((base ^ hash(key)) >>> 0);

  const yesterday = addDays(anchor, -1);
  const curMonth = monthKey(anchor);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(curMonth, i - 12));
  const windowStart: Ymd = `${months[0]}-01`;
  const simStart: Ymd = `${addMonths(curMonth, -14)}-01`;
  const horizon = addDays(anchor, 6);
  const thisMonday = weekStart(anchor);
  const weeks = Array.from({ length: 13 }, (_, i) => addDays(thisMonday, -7 * (13 - i)));
  const anchorYear = +anchor.slice(0, 4);
  const sku = new Map(seed.skus.map((s) => [s.id, s]));

  /* ------------------------------ paddocks ------------------------------ */
  // A 6×4 jittered vertex grid → 15 fields; the middle-bottom cell is the farmstead.
  const pr = stream("paddocks");
  const W = 600, H = 360, cols = 5, rows = 3;
  const pts: Array<Array<[number, number]>> = [];
  for (let r = 0; r <= rows; r++) {
    pts.push([]);
    for (let c = 0; c <= cols; c++) {
      const edgeX = c === 0 || c === cols, edgeY = r === 0 || r === rows;
      const x = (c / cols) * W + (edgeX ? 0 : pr.range(-26, 26));
      const y = (r / rows) * H + (edgeY ? 0 : pr.range(-22, 22));
      pts[r].push([Math.round(x), Math.round(y)]);
    }
  }
  const cellPoly = (r: number, c: number): Array<[number, number]> => [pts[r][c], pts[r][c + 1], pts[r + 1][c + 1], pts[r + 1][c]];
  const area = (p: Array<[number, number]>) => Math.abs(p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
  const farmCell = { r: 2, c: 2 };
  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!(r === farmCell.r && c === farmCell.c)) cells.push({ r, c });
  const polys = cells.map(({ r, c }) => cellPoly(r, c));
  const totalArea = polys.reduce((s, p) => s + area(p), 0);
  let acresLeft = seed.acres;
  const paddocks: Paddock[] = seed.paddocks.map((p, i) => {
    const poly = polys[i];
    const acres = i === seed.paddocks.length - 1 ? Math.round(acresLeft * 2) / 2 : Math.round((area(poly) / totalArea) * seed.acres * 2) / 2;
    acresLeft -= acres;
    const center: [number, number] = [Math.round(poly.reduce((s, q) => s + q[0], 0) / 4), Math.round(poly.reduce((s, q) => s + q[1], 0) / 4)];
    return { ...p, acres, poly, center };
  });
  const farmstead = cellPoly(farmCell.r, farmCell.c);

  // Rotation: walk the grazing paddocks in map order (a lap around the lane).
  const lap = [0, 1, 2, 3, 4, 9, 14, 13, 12, 11, 10, 5, 6, 7, 8].map((i) => cells.findIndex((c) => c.r * cols + c.c === i)).filter((i) => i >= 0);
  const order = lap.map((i) => paddocks[i]).filter((p) => p.use === "rotation").map((p) => p.id);
  const days: Record<string, number> = {};
  for (const id of order) days[id] = Math.max(2, Math.round(paddocks.find((p) => p.id === id)!.acres / 3.2));
  const cycle = order.reduce((s, id) => s + days[id], 0);
  const position = ((diffDays(anchor, "2020-01-06") + (base % cycle)) % cycle + cycle) % cycle;

  /* -------------------------------- cows -------------------------------- */
  const cr = stream("cows");
  const breeds = seed.breeds;
  const cows: Cow[] = [];
  const cowCount = 56;
  const usedTags = new Set<number>();
  for (let i = 0; i < cowCount; i++) {
    const fall = i % 5 < 2; // ~40% fall calvers keep milk flowing all winter
    const born = addDays(`${anchorYear - cr.int(3, 10)}-01-01`, fall ? cr.int(230, 300) : cr.int(50, 120));
    const breed = cr.weighted(breeds, (b) => b.share).name;
    let tag = cr.int(110, 299);
    while (usedTags.has(tag)) tag = cr.int(110, 299);
    usedTags.add(tag);
    const calvings: Ymd[] = [];
    for (let y = anchorYear - 2; y <= anchorYear + 1; y++) {
      const d = fall ? addDays(`${y}-09-01`, cr.int(0, 58)) : addDays(`${y}-03-18`, cr.int(-8, 48));
      if (diffDays(d, born) > 700) calvings.push(d);
    }
    const past = calvings.filter((d) => d <= anchor);
    const last = past.at(-1) ?? null;
    const nextDue = calvings.find((d) => d > anchor)!;
    const lact = Math.max(1, Math.floor(diffDays(anchor, born) / 365) - 1);
    const peakBase = breed === "Jersey" ? 3.5 : breed === "Guernsey" ? 3.3 : breed === "Jersey × Normande" ? 3.25 : 3.6;
    const peak = +(peakBase * (lact === 1 ? 0.8 : lact === 2 ? 0.92 : 1) * cr.jitter(0.07)).toFixed(2);
    const dry = diffDays(nextDue, anchor) <= 60;
    const bredOn = addDays(nextDue, -283);
    cows.push({
      id: `cow${i}`,
      tag: String(tag),
      name: seed.cowNames[i % seed.cowNames.length],
      breed,
      born,
      lactation: lact,
      calvings,
      nextDue,
      status: dry || !last ? "Dry" : "Milking",
      dim: dry || !last ? null : diffDays(anchor, last),
      peak,
      bred: bredOn <= anchor ? bredOn : null,
      pregCheck: bredOn > anchor ? "Open" : diffDays(anchor, bredOn) >= 35 ? "Confirmed" : "Pending",
      dip: false,
      avg7: 0,
      avgPrev: 0,
    });
  }
  // One cow with a recent drop: the kind of thing the herdsman wants flagged.
  const dipCow = cows.find((c) => c.status === "Milking" && (c.dim ?? 0) > 90);
  if (dipCow) dipCow.dip = true;

  const cowMilk = (c: Cow, d: Ymd) => {
    const next = c.calvings.find((x) => x > d);
    if (next && diffDays(next, d) <= 60) return 0; // dry period
    let last: Ymd | null = null;
    for (const x of c.calvings) if (x <= d) last = x;
    if (!last) return 0;
    const dim = diffDays(d, last);
    if (dim > 400) return 0;
    const dip = c.dip && diffDays(anchor, d) >= 1 && diffDays(anchor, d) <= 3 ? 0.62 : 1;
    const wobble = 0.94 + ((hash(c.id + d) % 1000) / 1000) * 0.12; // day-to-day variation, ±6%
    return c.peak * lactation(dim) * MILK_SEASON[monthIndex(d)] * dip * wobble;
  };
  // Calves on milk by day (each calf drinks whole milk for its first 90 days).
  for (const c of cows) {
    let a = 0, b = 0;
    for (let k = 1; k <= 7; k++) { a += cowMilk(c, addDays(anchor, -k)); b += cowMilk(c, addDays(anchor, -k - 7)); }
    c.avg7 = Math.round((a / 7) * 100) / 100;
    c.avgPrev = Math.round((b / 7) * 100) / 100;
  }
  const calfDays = new Map<Ymd, number>();
  for (const c of cows) for (const x of c.calvings) for (let k = 0; k < 90; k++) { const d = addDays(x, k); calfDays.set(d, (calfDays.get(d) ?? 0) + 1); }
  const calvesOnMilk = (d: Ymd) => calfDays.get(d) ?? 0;

  /* --------------------------- processing plan -------------------------- */
  const steers: Steer[] = [];
  const batches: Batch[] = [];
  const pk = stream("processing");
  const yieldsFor = (kind: SkuSeed["source"], factor: number, rng: Rng) => {
    const out: Record<string, number> = {};
    for (const s of seed.skus) if (s.source === kind && s.yieldPer) out[s.id] = Math.max(0, Math.round(s.yieldPer * factor * rng.jitter(0.06)));
    return out;
  };

  // Beef: grass-finished steers go mostly June–December.
  let tagNo = 301;
  for (let d = onOrAfter(addDays(simStart, -40), 1); d <= addDays(anchor, 200); ) {
    const m = monthIndex(d);
    const inSeason = m >= 5 && m <= 11;
    const head = inSeason ? 2 + (pk.chance(0.7) ? 1 : 0) : 2 + (pk.chance(0.3) ? 1 : 0);
    const animals: string[] = [];
    let hangingTotal = 0;
    for (let h = 0; h < head; h++) {
      const hanging = pk.int(560, 690);
      const tag = String(tagNo++);
      steers.push({ id: `st${tag}`, tag, born: addDays(d, -pk.int(780, 860)), kill: d, back: addDays(d, 12), hanging, lot: `BF-${yy(d)}` });
      animals.push(tag);
      hangingTotal += hanging;
    }
    batches.push({ id: `bf-${d}`, kind: "beef", lot: `BF-${yy(d)}`, kill: d, back: addDays(d, 12), head, animals, yields: yieldsFor("beef", hangingTotal / 620, pk) });
    d = onOrAfter(addDays(d, inSeason ? 18 : 28), 1);
  }
  // Pork: woodlot hogs about every four weeks.
  let hogNo = 1;
  for (let d = onOrAfter(addDays(simStart, -30), 2); d <= addDays(anchor, 200); d = onOrAfter(addDays(d, 28), 2)) {
    const head = pk.chance(0.75) ? 3 : 2;
    const hanging = pk.int(195, 225) * head;
    batches.push({ id: `pk-${d}`, kind: "pork", lot: `PK-${yy(d)}`, kill: d, back: addDays(d, 10), head, animals: Array.from({ length: head }, () => `H${hogNo++}`), yields: yieldsFor("pork", hanging / 210, pk) });
  }
  // Lamb: spring lambs finish late summer through winter.
  for (let y = anchorYear - 2; y <= anchorYear + 1; y++) {
    for (const [md, head] of [["01-20", 3], ["06-10", 3], ["09-22", 5], ["11-17", 5]] as const) {
      const d = onOrAfter(`${y}-${md}`, 2);
      if (d < addDays(simStart, -30) || d > addDays(anchor, 200)) continue;
      batches.push({ id: `lb-${d}`, kind: "lamb", lot: `LB-${yy(d)}`, kill: d, back: addDays(d, 10), head, animals: Array.from({ length: head }, (_, i) => `L${y % 100}${md.slice(0, 2)}${i + 1}`), yields: yieldsFor("lamb", head * pk.jitter(0.05), pk) });
    }
  }
  // Broilers: seven 300-bird batches a season, eight weeks on pasture.
  const broilers: BroilerBatch[] = [];
  const br = stream("broilers");
  for (let y = anchorYear - 2; y <= anchorYear; y++) {
    let arrive = onOrAfter(`${y}-04-07`, 2);
    for (let k = 0; k < 7; k++) {
      const processing = addDays(arrive, 56);
      const chicks = 300;
      const alive = chicks - br.int(10, 26);
      const b: BroilerBatch = { id: `ck-${arrive}`, no: k + 1, arrived: arrive, processing, chicks, alive, lot: `CK-${yy(processing)}`, avgLb: +br.range(4.2, 4.8).toFixed(1) };
      if (processing >= addDays(simStart, -30) && arrive <= addDays(anchor, 60)) {
        broilers.push(b);
        batches.push({ id: b.id, kind: "broiler", lot: b.lot, kill: processing, back: addDays(processing, 1), head: alive, animals: [], yields: yieldsFor("broiler", alive, br) });
      }
      arrive = addDays(arrive, 28);
    }
  }
  batches.sort((a, b) => (a.back < b.back ? -1 : 1));

  /* ------------------------------- flocks ------------------------------- */
  const flocks: Flock[] = [
    { id: "fa", name: "Flock A", coop: "Eggmobile 1", hatched: `${anchorYear - 2}-04-01`, hens: 330, layingFrom: "" },
    { id: "fb", name: "Flock B", coop: "Eggmobile 2", hatched: `${anchorYear - 1}-04-10`, hens: 340, layingFrom: "" },
    { id: "fc", name: "Flock C", coop: "Eggmobile 3", hatched: `${anchorYear}-04-20`, hens: 240, layingFrom: "" },
  ].map((f) => ({ ...f, layingFrom: addDays(f.hatched, 140) }));
  const layRate = (f: Flock, d: Ymd, rng: Rng) => {
    const wk = diffDays(d, f.hatched) / 7;
    if (wk < 20) return 0;
    const base = wk < 26 ? 0.3 + ((wk - 20) / 6) * 0.58 : clamp(0.9 - 0.0028 * (wk - 30), 0.5, 0.9);
    return base * daylight(d) * rng.jitter(0.04);
  };
  const hensOn = (f: Flock, d: Ymd) => (d < f.layingFrom ? (d < f.hatched ? 0 : f.hens + 8) : Math.round(f.hens + 8 - 8 * clamp(diffDays(d, f.layingFrom) / 900, 0, 1)));

  /* ------------------------------ customers ----------------------------- */
  const cu = stream("customers");
  const customers: Customer[] = [];
  const emails = new Set<string>();
  const zoneIds = seed.zones.map((z) => z.id);
  const siteIds = seed.sites.map((s) => s.id);
  const cadences = [
    { d: 20, w: 0.06 }, { d: 28, w: 0.16 }, { d: 40, w: 0.26 }, { d: 56, w: 0.27 }, { d: 90, w: 0.25 },
  ];
  const PEOPLE = 625;
  const OWNERS = 100;
  for (let i = 0; i < PEOPLE; i++) {
    const owner = i < OWNERS;
    const first = cu.pick(seed.names.first);
    const last = cu.pick(seed.names.last);
    let email = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "");
    let n = 2;
    while (emails.has(email)) email = `${first}.${last}${n++}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9.]/g, "");
    emails.add(email);
    const channel: "delivery" | "pickup" = owner ? (cu.chance(0.2) ? "delivery" : "pickup") : cu.chance(0.56) ? "delivery" : "pickup";
    const where = channel === "delivery" ? cu.pick(zoneIds) : cu.weighted(siteIds, (s) => (s === "s-farm" ? 1.6 : 1));
    const town = cu.pick(channel === "delivery" ? seed.towns.delivery[where] : seed.towns.pickup[where]);
    const early = cu.chance(0.7);
    const joined = early ? addDays(`${seed.established + 1}-01-01`, cu.int(0, diffDays(simStart, `${seed.established + 1}-01-01`) - 1)) : addDays(simStart, cu.int(0, diffDays(anchor, simStart) - 4));
    const cadence = owner ? cu.pick([21, 30, 30, 45, 45]) : cu.weighted(cadences, (c) => c.w).d;
    const stops = owner ? cu.chance(0.06) : cu.chance(0.22);
    const earliestStop = addDays(joined < simStart ? simStart : joined, 45);
    const stoppedOn = stops && earliestStop < addDays(anchor, -21) ? addDays(earliestStop, cu.int(0, diffDays(addDays(anchor, -21), earliestStop))) : null;
    // Spend before the simulated window: at most ~5 years of history, smaller baskets back then.
    const priorSpend = joined < simStart ? Math.round((Math.min(diffDays(simStart, joined), 5 * 365) / (cadence * 1.4)) * 58 * cu.jitter(0.3)) : 0;
    let herdshare: Customer["herdshare"] = null;
    if (owner) {
      const shares = cu.weighted([1, 2, 3], (s) => (s === 1 ? 0.6 : s === 2 ? 0.3 : 0.1));
      const since = joined;
      let renews = `${anchorYear}${since.slice(4)}`;
      if (renews.endsWith("02-29")) renews = renews.replace("02-29", "02-28");
      if (renews < addDays(anchor, -12)) renews = `${anchorYear + 1}${renews.slice(4)}`;
      const r = cu.next();
      herdshare = {
        shares,
        gallons: shares,
        since,
        renews,
        agreement: cu.next() > 0.05,
        fee: r < 0.85 ? "Paid" : r < 0.95 ? "Due" : "Past due",
        site: channel === "pickup" ? where : "s-farm",
      };
    }
    customers.push({
      id: `c${String(i + 1).padStart(3, "0")}`,
      first, last, name: `${first} ${last}`,
      email: `${email}@example.com`,
      phone: phone(cu, channel === "delivery" ? "614" : "740"),
      town, channel, where, joined, cadence, stoppedOn, priorSpend,
      note: cu.chance(0.22) ? cu.pick(seed.notes) : null,
      herdshare,
    });
  }
  const byId = new Map(customers.map((c) => [c.id, c]));
  // Customer tastes: a few favorites, and whether they buy freezer bundles.
  const tastes = new Map<string, { favs: Set<string>; bundles: boolean }>();
  {
    const tr = stream("tastes");
    const sellable = seed.skus.filter((s) => s.pop > 0 && !s.herdshareOnly && s.source !== "bundle");
    for (const c of customers) {
      const favs = new Set<string>();
      while (favs.size < 4) favs.add(tr.weighted(sellable, (s) => s.pop).id);
      tastes.set(c.id, { favs, bundles: tr.chance(c.herdshare ? 0.45 : 0.28) });
    }
  }

  /* ------------------------------ accounts ------------------------------ */
  const ar = stream("accounts");
  const accounts: Account[] = seed.wholesale.map((w) => ({
    ...w,
    opened: addDays(`${addMonths(curMonth, w.since)}-01`, ar.int(0, 20)),
    stoppedOn: w.lapsedDaysAgo ? addDays(anchor, -w.lapsedDaysAgo) : null,
    phone: phone(ar, ["Columbus", "Worthington", "Clintonville", "Westerville", "Dublin", "Upper Arlington", "German Village", "Bexley"].includes(w.town) ? "614" : "740"),
    email: `${w.contact.replace(/^Chef /, "").split(" ")[0].toLowerCase()}@${w.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "")}.example.com`,
  }));

  /* ---------------------------- order intents --------------------------- */
  type Intent = { date: Ymd; channel: Order["channel"]; customer: string | null; account: string | null; where: string; pri: number; kind?: "turkey" };
  const intents: Intent[] = [];
  const orr = stream("intents");
  const dayOf = (c: Customer) => (c.channel === "delivery" ? seed.zones.find((z) => z.id === c.where)!.day : seed.sites.find((s) => s.id === c.where)!.day);
  for (const c of customers) {
    const wd = dayOf(c);
    let d = onOrAfter(c.joined < simStart ? addDays(simStart, orr.int(0, c.cadence)) : c.joined, wd);
    while (d <= horizon && (!c.stoppedOn || d <= c.stoppedOn)) {
      intents.push({ date: d, channel: c.channel, customer: c.id, account: null, where: c.where, pri: 2 });
      const gap = Math.max(6, Math.round((c.cadence / ORDER_SEASON[monthIndex(d)]) * orr.jitter(0.35)));
      d = onOrAfter(addDays(d, gap), wd);
    }
  }
  // Farm store: Mon–Sat, busier Saturdays, spikes on Field Days.
  const events: FarmData["events"] = [];
  const fieldDay = (y: number, m: number) => nthWeekday(`${y}-${String(m).padStart(2, "0")}`, 6, 1);
  const carnival = (y: number) => nthWeekday(`${y}-09`, 6, 2);
  for (let y = anchorYear - 2; y <= anchorYear + 1; y++) {
    for (const d of [fieldDay(y, 6), fieldDay(y, 10)]) if (d >= windowStart && d <= addDays(anchor, 270)) events.push({ date: d, name: "Farm Field Day", visitors: 0 });
    const cd = carnival(y);
    if (cd >= windowStart && cd <= addDays(anchor, 270)) events.push({ date: cd, name: "Farm Carnival", visitors: 0 });
  }
  events.sort((a, b) => (a.date < b.date ? -1 : 1));
  const evr = stream("events");
  for (const e of events) e.visitors = e.date < anchor ? Math.round((e.name === "Farm Carnival" ? 520 : 360) * evr.jitter(0.15)) : 0;
  const eventOn = new Map(events.map((e) => [e.date, e]));
  const isEvent = (d: Ymd) => eventOn.get(d);
  const carnivalOf = new Map<number, Ymd>();
  const carnivalFor = (d: Ymd) => {
    const y = +d.slice(0, 4);
    if (!carnivalOf.has(y)) carnivalOf.set(y, carnival(y));
    return carnivalOf.get(y)!;
  };
  const storeLinked = customers.filter((c) => c.where === "s-farm" || c.where === "s-mv");
  for (const d of eachDay(simStart, yesterday)) {
    const wd = weekday(d);
    if (wd === 0) continue; // closed Sundays
    const ev = isEvent(d);
    const n = Math.round(4.3 * (wd === 6 ? 1.8 : 1) * ORDER_SEASON[monthIndex(d)] * orr.jitter(0.3) * (ev ? (ev.name === "Farm Carnival" ? 4 : 6) : 1));
    for (let k = 0; k < n; k++) {
      const linked = orr.chance(0.3) ? orr.pick(storeLinked) : null;
      intents.push({ date: d, channel: "store", customer: linked && linked.joined <= d && (!linked.stoppedOn || linked.stoppedOn >= d) ? linked.id : null, account: null, where: "store", pri: 3 });
    }
  }
  // Wholesale standing orders.
  for (const a of accounts) {
    let d = onOrAfter(a.opened < simStart ? addDays(simStart, orr.int(0, 6)) : a.opened, a.day);
    while (d <= horizon && (!a.stoppedOn || d <= a.stoppedOn)) {
      intents.push({ date: d, channel: "wholesale", customer: null, account: a.id, where: a.town, pri: 1 });
      d = addDays(d, 7 * a.every);
    }
  }

  // Thanksgiving turkeys: pre-orders with deposits; pickups the weekend before.
  const tr = stream("turkeys");
  const turkeySeason = (year: number, allocation: number, finalCount: number) => {
    const tday = thanksgiving(year);
    const processing = addDays(tday, -5);
    const pool = customers.filter((c) => c.joined < `${year}-08-01` && (!c.stoppedOn || c.stoppedOn > `${year}-11-20`));
    const picked = new Set<string>();
    const list: TurkeyPreorder[] = [];
    const sizes: TurkeyPreorder["size"][] = ["Small (12–15 lb)", "Medium (16–19 lb)", "Large (20–24 lb)"];
    while (list.length < finalCount && picked.size < pool.length) {
      const c = tr.weighted(pool, (x) => (x.herdshare ? 3 : 1));
      if (picked.has(c.id)) continue;
      picked.add(c.id);
      // Most deposits land early (email to owners), a second bump in late October.
      const u = tr.next();
      const placed = addDays(`${year}-08-01`, u < 0.55 ? tr.int(0, 50) : u < 0.8 ? tr.int(50, 85) : tr.int(85, 106));
      list.push({ id: `t${year}-${list.length + 1}`, customer: c.id, size: tr.weighted(sizes, (s) => (s.startsWith("Medium") ? 0.47 : s.startsWith("Large") ? 0.31 : 0.22)), placed, deposit: 25, pickup: addDays(processing, tr.int(0, 3)) });
    }
    list.sort((a, b) => (a.placed < b.placed ? -1 : 1));
    return { allocation, preorders: list, processing, pickup: addDays(processing, 0) };
  };
  const nextTday = thanksgiving(anchorYear) >= anchor ? anchorYear : anchorYear + 1;
  const pastSeason = turkeySeason(nextTday - 1, 120, 112);
  const curSeason = turkeySeason(nextTday, 140, 131);
  const turkeyWeight = new Map<string, number>();
  for (const t of pastSeason.preorders) {
    if (t.pickup < simStart || t.pickup > yesterday) continue;
    const c = byId.get(t.customer)!;
    turkeyWeight.set(`${t.customer}:${t.pickup}`, +(t.size.startsWith("Small") ? tr.range(12, 15) : t.size.startsWith("Medium") ? tr.range(16, 19) : tr.range(20, 24)).toFixed(1));
    intents.push({ date: t.pickup, channel: "pickup", customer: c.id, account: null, where: "s-farm", pri: 0, kind: "turkey" });
  }

  intents.sort((a, b) => (a.date === b.date ? a.pri - b.pri : a.date < b.date ? -1 : 1));

  /* ------------------------------ simulation ---------------------------- */
  const stock: Record<string, number> = {};
  const supplied: Record<string, number> = {};
  for (const s of seed.skus) stock[s.id] = 0;
  // Opening freezer + shelf stock (carried in from before the simulation).
  for (const s of seed.skus) {
    if (["beef", "pork", "lamb", "broiler", "broth", "partner"].includes(s.source)) stock[s.id] = Math.round(s.par * (s.source === "broiler" ? 1.6 : 1.1));
  }
  stock.eggs = 140;
  stock.butter = 20;
  const add = (id: string, n: number, d: Ymd) => {
    stock[id] += n;
    if (d >= windowStart) supplied[id] = (supplied[id] ?? 0) + n;
  };

  // Cheese: twice-weekly makes from surplus milk; sells only after aging.
  const cheese: CheeseMake[] = [];
  const cheeseKinds = [
    { sku: "ch-cheddar", kind: "Cheddar", code: "CHD", age: 90, share: 0.5 },
    { sku: "ch-gouda", kind: "Gouda", code: "GDA", age: 60, share: 0.3 },
    { sku: "ch-colby", kind: "Colby", code: "CLB", age: 60, share: 0.2 },
  ];
  let makeNo = 0;
  const makeCheese = (d: Ymd, gallons: number) => {
    const k = cheeseKinds[[0, 1, 0, 2, 0, 1, 0, 2, 1, 0][makeNo++ % 10]];
    const lbs = Math.round(gallons * 0.92 * 10) / 10;
    cheese.push({ id: `ch-${d}`, lot: `CH-${yy(d)}-${k.code}`, date: d, kind: k.kind, sku: k.sku, gallons: Math.round(gallons), lbs, blocks: Math.floor(lbs * 2), ready: addDays(d, k.age) });
  };
  // Makes from before the simulation, so aged cheese is on the shelf from day one.
  for (const d of eachDay(addDays(simStart, -100), addDays(simStart, -1))) if (weekday(d) === 1 || weekday(d) === 4) makeCheese(d, 70);

  const butter: ButterMake[] = [];
  const bakes: Bake[] = [];
  const milk: MilkDay[] = [];
  const eggs: EggDay[] = [];
  const stockouts: Stockout[] = [];
  const orders: Order[] = [];
  let tank = 0; // surplus milk since the last cheese make
  let breadOld: Record<string, number> = {};
  let ii = 0;
  let orderNo = 10001;
  const dr = stream("days");
  const lr = stream("lines");
  const flockRng = stream("lay");
  // Owners' milk is bottled daily (a seventh of each weekly share) and picked up on their site's day.
  const owners = customers.filter((c) => c.herdshare);
  const herdshareDaily = (d: Ymd) =>
    owners.reduce((s, c) => {
      const h = c.herdshare;
      return !h || h.since > d || (c.stoppedOn && c.stoppedOn < d) ? s : s + h.gallons / 7;
    }, 0);

  const canSell = (id: string, extraHeld: Record<string, number> = {}) => stock[id] - (extraHeld[id] ?? 0);
  const take = (id: string, qty: number) => { stock[id] -= qty; };
  // Bundles are pre-packed from loose cuts when beef comes back, leaving a floor
  // of each cut for individual sale. Fall bundles get packed deep Oct–Dec.
  const bundles = seed.skus.filter((s) => s.components);
  const packBundles = (d: Ymd) => {
    const m = monthIndex(d);
    for (const b of bundles) {
      const target = Math.round(b.par * Math.min(1, (b.season?.[m] ?? 1) / 1.6));
      let n = Math.max(0, target - stock[b.id]);
      for (const [cid, q] of Object.entries(b.components!)) n = Math.min(n, Math.floor(Math.max(0, stock[cid] - sku.get(cid)!.par * 0.4) / q));
      if (n <= 0) continue;
      for (const [cid, q] of Object.entries(b.components!)) stock[cid] -= q * n;
      add(b.id, n, d);
    }
  };

  const recentFrom = addDays(anchor, -45);
  const lineCount = (ch: Order["channel"]) => (ch === "store" ? lr.weighted([1, 2, 3, 4], (n) => [0.34, 0.33, 0.21, 0.12][n - 1]) : lr.weighted([3, 4, 5, 6, 7, 8, 9], (n) => [0.1, 0.18, 0.22, 0.2, 0.14, 0.1, 0.06][n - 3]));
  const qtyFor = (s: SkuSeed) => {
    if (s.id === "beef-ground") return lr.int(1, 4);
    if (s.id === "eggs") return lr.weighted([1, 2, 3], (n) => [0.55, 0.33, 0.12][n - 1]);
    if (s.source === "bundle") return 1;
    if (s.id === "milk-extra") return lr.int(1, 2);
    return lr.weighted([1, 2, 3], (n) => [0.66, 0.26, 0.08][n - 1]);
  };

  const buildLines = (it: Intent, d: Ymd, held: Record<string, number>) => {
    const lines: Line[] = [];
    // Hold what this order has already taken, so a bundle and its own cuts can't double-book.
    const hold = { ...held };
    const reserve = (id: string, qty: number) => {
      hold[id] = (hold[id] ?? 0) + qty;
    };
    if (it.kind === "turkey") {
      const lb = turkeyWeight.get(`${it.customer}:${d}`) ?? 17;
      lines.push({ sku: "turkey", qty: 1, price: +(lb * 8.5).toFixed(2) });
      return lines;
    }
    const m = monthIndex(d);
    if (it.channel === "wholesale") {
      const a = accounts.find((x) => x.id === it.account)!;
      for (const [id, q] of Object.entries(a.standing)) {
        // Standing orders flex with the freezer: the farm calls ahead when a cut is thin.
        const sk = sku.get(id)!;
        const flex = sk.par > 0 ? Math.min(1, 0.25 + Math.max(0, canSell(id, hold)) / (1.5 * sk.par)) : 1;
        const want = Math.max(1, Math.round(q * lr.jitter(0.18) * (sk.season?.[m] ?? 1) ** 0.5 * flex));
        const have = canSell(id, hold);
        const qty = Math.min(want, Math.max(0, have));
        if (qty < want && d >= recentFrom) stockouts.push({ sku: id, date: d, customer: null });
        if (qty > 0) {
          lines.push({ sku: id, qty, price: +(sku.get(id)!.price * 0.75).toFixed(2) });
          reserve(id, qty);
        }
      }
      return lines;
    }
    const c = it.customer ? byId.get(it.customer)! : null;
    const t = c ? tastes.get(c.id)! : null;
    const owner = !!c?.herdshare && (!c.stoppedOn || c.stoppedOn >= d);
    const toCarnival = diffDays(carnivalFor(d), d);
    const ticketWindow = toCarnival >= 0 && toCarnival <= 42;
    const want = lineCount(it.channel);
    // One weight per product for this basket. Shoppers see "low stock" / "sold out"
    // badges, so thin shelves draw fewer picks.
    const weights = seed.skus.map((x) => {
      if (x.pop === 0 || (x.herdshareOnly && !owner) || (x.source === "bundle" && it.channel === "store")) return 0;
      let w = x.pop * (x.season?.[m] ?? 1);
      // Shoppers ease off as shelves thin (well before a cut is gone).
      // A deep freezer gets featured ("specials"), nudging demand back up.
      if (x.par > 0) w *= Math.min(x.components ? 1 : 1.4, 0.12 + Math.max(0, canSell(x.id, hold)) / (2 * x.par));
      if (MEAT.has(x.source)) w *= MEAT_DEMAND;
      if (t?.favs.has(x.id)) w *= 3;
      if (x.source === "bundle") w *= t?.bundles ? 4 : 0.25;
      if (x.herdshareOnly) w *= 1.6;
      return w;
    });
    for (let k = 0; k < want; k++) {
      let total = 0;
      for (const w of weights) total += w;
      if (total <= 0) break;
      let r = lr.next() * total;
      let idx = 0;
      for (; idx < weights.length - 1; idx++) {
        r -= weights[idx];
        if (r <= 0) break;
      }
      weights[idx] = 0;
      const s = seed.skus[idx];
      const qty = qtyFor(s);
      const have = canSell(s.id, hold);
      const got = Math.min(qty, Math.max(0, have));
      if (got < qty && d >= recentFrom) stockouts.push({ sku: s.id, date: d, customer: c?.id ?? null });
      if (got > 0) {
        lines.push({ sku: s.id, qty: got, price: s.price });
        reserve(s.id, got);
      }
    }
    if (ticketWindow && it.channel !== "store" && lr.chance(0.22)) {
      lines.push({ sku: "ticket", qty: lr.int(2, 5), price: 15 });
    }
    if (it.channel === "store" && isEvent(d)?.name === "Farm Carnival") lines.push({ sku: "ticket", qty: lr.int(1, 4), price: 15 });
    return lines;
  };

  for (const d of eachDay(simStart, yesterday)) {
    const wd = weekday(d);
    const m = monthIndex(d);

    // 1) Supply lands.
    let beefBack = false;
    for (const b of batches) if (b.back === d) {
      for (const [id, n] of Object.entries(b.yields)) add(id, n, d);
      if (b.kind === "beef") beefBack = true;
    }
    if (beefBack || wd === 1) packBundles(d);
    for (const c of cheese) if (c.ready === d) add(c.sku, c.blocks, d);
    if (wd === 1 && diffDays(d, simStart) % 14 < 7) add("broth", Math.round(84 * dr.jitter(0.08)), d); // broth every other Monday
    if (diffDays(d, simStart) % 28 === 3) for (const s of seed.skus) if (s.source === "partner") add(s.id, Math.max(0, Math.round(s.par * 1.4) - stock[s.id]), d);
    // Bakery: Mon–Sat, bigger bakes on delivery days. Day-old loaves sell once more, then go.
    if (wd !== 0) {
      const big = wd === 2 || wd === 4 || wd === 6;
      const loaves = { "bread-country": Math.round((big ? 20 : 12) * dr.jitter(0.06)), "bread-sandwich": Math.round((big ? 7 : 4) * dr.jitter(0.08)) };
      for (const id of Object.keys(loaves)) stock[id] = (breadOld[id] ?? 0);
      for (const [id, n] of Object.entries(loaves)) add(id, n, d);
      bakes.push({ date: d, loaves });
    }
    // Milk for the day.
    const gallons = cows.reduce((s, c) => s + cowMilk(c, d), 0) * dr.jitter(0.025);
    const herdshareGal = herdshareDaily(d);
    // Calves get whole milk when there's enough after owners; otherwise replacer.
    const calves = Math.min(calvesOnMilk(d) * 1.5, Math.max(0, gallons - herdshareGal) * 0.45);
    let butterGal = 0;
    if (wd === 2 || wd === 5) {
      butterGal = Math.round(Math.min(20 * MILK_SEASON[m], Math.max(0, gallons - herdshareGal - calves) * 0.35));
      const units = Math.round(butterGal / 1.05);
      add("butter", units, d);
      butter.push({ date: d, gallons: butterGal, units });
    }
    // Owners-only extras: today's allotment (fresh, not carried over).
    stock["milk-extra"] = Math.max(0, Math.round(Math.min(14, (gallons - herdshareGal - calves - butterGal) * 0.12)));
    stock.cream = Math.round(6 * MILK_SEASON[m]);
    // Eggs laid today (cracks and seconds go to the bakery).
    const byFlock = flocks.map((f) => Math.round(hensOn(f, d) * layRate(f, d, flockRng)));
    const laid = byFlock.reduce((s, n) => s + n, 0);
    const dozens = Math.floor((laid * 0.96) / 12);
    add("eggs", dozens, d);

    // 2) Orders draw it down.
    const extrasBefore = stock["milk-extra"];
    const creamBefore = stock.cream;
    const eggsBefore = stock.eggs;
    while (ii < intents.length && intents[ii].date === d) {
      const it = intents[ii++];
      const lines = buildLines(it, d, {});
      for (const l of lines) if (l.sku !== "ticket" && l.sku !== "turkey") take(l.sku, l.qty);
      if (!lines.length) continue;
      if (d >= windowStart) {
        const total = Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
        orders.push({ id: `o${orderNo}`, no: orderNo++, date: d, channel: it.channel, customer: it.customer, account: it.account, where: it.where, lines, total, open: false });
      }
    }

    // 3) Close the books on milk + eggs.
    const extrasGal = extrasBefore - stock["milk-extra"] + 0.9 * (creamBefore - stock.cream);
    // A share of each day's surplus is held for the next vat (makes are Mon + Thu).
    const surplus = Math.max(0, gallons - herdshareGal - calves - butterGal - extrasGal);
    const cheeseGal = Math.min(surplus * 0.2, 34);
    tank += cheeseGal;
    if ((wd === 1 || wd === 4) && tank >= 25) {
      makeCheese(d, tank);
      tank = 0;
    }
    // Keep about two weeks of eggs in the cooler; older surplus goes to seconds.
    const cap = Math.round(dozens * 14);
    const culled = Math.max(0, stock.eggs - cap);
    stock.eggs -= culled;
    if (d >= windowStart) {
      milk.push({
        date: d,
        gallons: Math.round(gallons * 10) / 10,
        herdshare: herdshareGal,
        extras: Math.round(extrasGal * 10) / 10,
        calves,
        cheese: Math.round(cheeseGal * 10) / 10,
        butter: butterGal,
        other: 0,
      });
      eggs.push({ date: d, byFlock, eggs: laid, dozensSold: eggsBefore - stock.eggs - culled, dozensCulled: culled });
    }
    breadOld = { "bread-country": Math.min(stock["bread-country"], 14), "bread-sandwich": Math.min(stock["bread-sandwich"], 6) };
  }
  // Milk not bottled, cheesed or churned: skim + whey to the hogs and calves.
  for (const day of milk) day.other = Math.max(0, Math.round((day.gallons - day.herdshare - day.extras - day.calves - day.cheese - day.butter) * 10) / 10);

  // Open orders (today through the next six days): reserve against stock on hand.
  const committed: Record<string, number> = {};
  for (; ii < intents.length; ii++) {
    const it = intents[ii];
    if (it.date < anchor) continue;
    const lines = buildLines(it, it.date, committed).filter((l) => l.sku !== "ticket");
    for (const l of lines) committed[l.sku] = (committed[l.sku] ?? 0) + l.qty;
    if (!lines.length) continue;
    const total = Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
    orders.push({ id: `o${orderNo}`, no: orderNo++, date: it.date, channel: it.channel, customer: it.customer, account: it.account, where: it.where, lines, total, open: true });
  }
  // Today's extras allotment is what's left to promise.
  stock["milk-extra"] = Math.max(0, stock["milk-extra"]);

  /* -------------------------------- visits ------------------------------ */
  const vr = stream("visits");
  const VISIT_NOTES = {
    Visit: ["Restocked the cooler, rotated eggs to the front.", "Walked the shelf with the manager. Cheese moving well.", "Dropped samples of the gouda.", "Asked about a holiday ham order.", "Talked fall bundle shelf-talkers."],
    Call: ["Wants to bump eggs for the holidays.", "Asked when raw butter is back.", "Short on ground beef this week; offered stew meat.", "Confirmed new delivery window."],
    Tasting: ["In-store tasting: 3 cheeses, 40+ samples.", "Saturday tasting, sold out of colby.", "Bone broth tasting by the register."],
  } as const;
  const visits: Visit[] = [];
  for (const a of accounts) {
    let d = addDays(a.opened < windowStart ? windowStart : a.opened, vr.int(3, 20));
    const end = a.stoppedOn ?? yesterday;
    while (d <= end) {
      const kind = vr.weighted(["Visit", "Call", "Tasting"] as const, (k) => (k === "Visit" ? 0.55 : k === "Call" ? 0.3 : 0.15));
      visits.push({ id: `v${visits.length + 1}`, account: a.id, date: d, by: vr.chance(0.7) ? "owen" : "sam", kind, note: vr.pick(VISIT_NOTES[kind]) });
      d = addDays(d, vr.int(18, 42));
    }
  }
  visits.sort((a, b) => (a.date < b.date ? 1 : -1));

  /* ------------------------------ milk tests ---------------------------- */
  const mt = stream("tests");
  const tests: MilkTest[] = [];
  const failWeek = 19;
  for (let w = 51; w >= 0; w--) {
    const week = addDays(thisMonday, -7 * w);
    if (week > anchor) continue;
    const fail = w === failWeek;
    const spc = Math.round(mt.range(1400, 6800) / 100) * 100;
    const coliform = fail ? 14 : mt.int(0, 7);
    const scc = Math.round(mt.range(118, 248)) * 1000;
    tests.push({ week, spc, coliform, scc, pass: !fail, note: fail ? "Coliform over limit. Retest next day came back 3/mL; replaced liners on unit 3." : null });
  }

  /* ------------------------------ equipment ----------------------------- */
  const er = stream("equipment");
  const overdueIds = new Set(er.shuffle(seed.equipment.filter((e) => e.every <= 120).map((e) => e.id)).slice(0, 3));
  const equipment: EquipmentItem[] = seed.equipment.map((e) => {
    const lastService = overdueIds.has(e.id) ? addDays(anchor, -(e.every + er.int(3, 16))) : addDays(anchor, -er.int(1, Math.max(2, e.every - 4)));
    const log: EquipmentItem["log"] = [];
    for (let d = lastService; d >= windowStart; d = addDays(d, -e.every)) {
      log.push({ date: d, title: `Routine: ${e.task.charAt(0).toLowerCase()}${e.task.slice(1)}`, cost: Math.round(e.cost * er.jitter(0.15)), by: e.group === "Delivery" ? "Outside shop" : er.pick(["sam", "micah"]) });
    }
    return { ...e, lastService, nextDue: addDays(lastService, e.every), log };
  });
  for (const r of seed.repairs) {
    const e = equipment.find((x) => x.id === r.equipment)!;
    e.log.push({ date: addDays(windowStart, er.int(5, diffDays(yesterday, windowStart) - 1)), title: r.title, cost: Math.round(r.cost * er.jitter(0.05)), by: e.group === "Delivery" ? "Outside shop" : er.pick(["sam", "micah", "sam"]) });
  }
  for (const e of equipment) e.log.sort((a, b) => (a.date < b.date ? 1 : -1));

  /* ------------------------------ tasks/weather ------------------------- */
  const tasks: Task[] = seed.boards.flatMap((b) =>
    b.items.map((it, i) => ({ id: `${b.id}-${i}`, board: b.id, name: it.name, owner: it.owner, status: it.status, priority: it.priority, start: addDays(anchor, it.start), due: addDays(anchor, it.due) })),
  );
  const wr = stream(`weather-${anchor}`);
  const weather: Weather[] = eachDay(addDays(anchor, -1), addDays(anchor, 5)).map((d) => {
    const m = monthIndex(d);
    const swing = wr.range(-6, 6);
    const sky = wr.weighted(["Sunny", "Partly cloudy", "Cloudy", "Showers", "Rain"] as const, (s) => ({ Sunny: 0.3, "Partly cloudy": 0.3, Cloudy: 0.18, Showers: 0.14, Rain: 0.08 })[s]);
    const rain = { Sunny: 0, "Partly cloudy": 10, Cloudy: 20, Showers: 60, Rain: 85 }[sky] + wr.int(0, 10);
    return { date: d, hi: Math.round(HI[m] + swing), lo: Math.round(LO[m] + swing * 0.7 + wr.range(-3, 3)), sky, rain: Math.min(95, rain) };
  });

  /* ------------------------------- herd etc. ---------------------------- */
  const heifers = { bred: 9, yearlings: 12, calves: cows.reduce((s, c) => s + c.calvings.filter((x) => x <= anchor && diffDays(anchor, x) < 90).length, 0) };
  const pork = batches.filter((b) => b.kind === "pork" && b.kill > anchor && diffDays(b.kill, anchor) <= 180);
  const lambs = batches.filter((b) => b.kind === "lamb" && b.kill > anchor && diffDays(b.kill, anchor) <= 150);

  return {
    anchor,
    simStart,
    windowStart,
    months,
    weeks,
    orders,
    customers,
    accounts,
    visits,
    stock,
    committed,
    supplied,
    stockouts,
    cows,
    heifers,
    steers: steers.filter((s) => s.kill >= windowStart),
    hogs: { sows: 3, boar: 1, growers: pork.reduce((s, b) => s + b.head, 0) + 6 },
    sheep: { ewes: 24, rams: 1, lambs: lambs.reduce((s, b) => s + b.head, 0) },
    batches: batches.filter((b) => b.back >= windowStart),
    broilers,
    flocks,
    milk,
    eggs,
    cheese,
    butter: butter.filter((b) => b.date >= windowStart),
    bakes: bakes.filter((b) => b.date >= addDays(anchor, -28)),
    tests,
    turkeys: { allocation: curSeason.allocation, preorders: curSeason.preorders.filter((t) => t.placed <= yesterday), processing: curSeason.processing, pickup: curSeason.pickup },
    paddocks,
    farmstead,
    rotation: { order, days, cycle, position },
    equipment,
    tasks,
    weather,
    events,
  };
}
