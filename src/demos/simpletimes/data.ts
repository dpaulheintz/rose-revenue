// The one seeded generator for Simple Times. Everything is anchored to "today"
// and rebuilt the same on server and client. All records are invented.

import { addDays, diffDays, monthIndex, monthKey, weekStart, weekday, type Ymd } from "@demos/kit/data/dates";
import { emailFor, peopleNames, phone555 } from "@demos/kit/data/fake";
import { withMargin } from "@demos/kit/data/pricing";
import { hash, makeRng } from "@demos/kit/data/rng";
import {
  ACCOUNT_TYPES, BRAND_KEYS, CLIENTS, INGREDIENTS, LINES, NAME_POOLS, OPERATORS, PRODUCTS, QA_CHECKS, RECIPES, REPS, ROLES, RUNOUT_INGREDIENT, SEASON, SKUS, TOWNS, VISIT_NOTES, YEAR_PLAN,
  type AccountType, type BrandKey, type EventKind, type RunStatus, type Stage,
} from "./catalog";

export const isWorkday = (d: Ymd) => weekday(d) !== 0 && weekday(d) !== 6;
export const nextWorkday = (d: Ymd) => { let x = d; while (!isWorkday(x)) x = addDays(x, 1); return x; };

export type Contact = { name: string; role: string; phone: string; email: string };
export type Visit = { id: string; date: Ymd; rep: string; note: string; planned?: boolean };
export type OrderLine = { sku: string; qty: number; amount: number };
export type Order = { id: string; account: string; date: Ymd; brand: BrandKey; lines: OrderLine[]; total: number; channel: "Wholesale" | "Retail" | "Distributor"; open: boolean };
export type Account = {
  id: string; name: string; type: AccountType; town: string; brands: BrandKey[]; rep: string; cadence: number; contacts: Contact[]; visits: Visit[]; notes: string; since: Ymd;
};
export type Tasting = { id: string; account: string; date: Ymd; time: string; rep: string; brand: BrandKey; poured: string[]; samples: number; sold: number; cost: number; upcoming: boolean };
export type CalEvent = { id: string; date: Ymd; days: number; kind: EventKind; brand: BrandKey | "both"; title: string };
export type Client = { id: string; name: string; products: string[]; stage: Stage; minRun: number; next: string; nextDate: Ymd; contact: Contact; value: number; since: Ymd };
export type Run = {
  id: string; date: Ymd; line: string; owner: string; product: string; base: string; gallons: number; bottles: number; size: string; status: RunStatus;
  recipe: string; lots: Array<{ ing: string; lot: string; qty: number }>; yieldPct: number; checks: Array<{ name: string; pass: boolean }>; firstPass: boolean; operator: string; ship?: Ymd; price: number; cost: number;
};
export type Stock = { id: string; name: string; unit: string; onHand: number; reorderAt: number; supplier: string; lead: number; owner: string; kind: string; cost: number };
export type PO = { id: string; item: string; qty: number; eta: Ymd; ordered: Ymd; cost: number; expedited?: boolean };
export type Quote = { id: string; client: string; product: string; gallons: number; size: "375 ml" | "750 ml"; labels: "Client supplied" | "We print"; margin: number; date: Ymd; status: "Draft" | "Sent" | "Accepted" };
export type Invoice = { id: string; client: string; run: string; date: Ymd; amount: number; paid?: Ymd };

/* ---------- co-pack quote math: one function for history and the builder ---------- */
export const RATES = { kettleHr: 85, lineHr: 110, setupHr: 2, galPerHr: 120, bottlesPerHr: 1100 };
export const INGREDIENT_COST_PER_GAL: Record<string, number> = { ginger: 9.4, cider: 7.2, berry: 13.1, lemon: 11.6, syrup: 6.8, client: 5.9 };
export function quotePrice(q: { gallons: number; size: "375 ml" | "750 ml"; labels: "Client supplied" | "We print"; margin: number; base: string }) {
  const perGal = q.size === "750 ml" ? 5.05 : 10.1;
  const bottles = Math.round(q.gallons * perGal);
  const ingredients = q.gallons * (INGREDIENT_COST_PER_GAL[q.base] ?? 6);
  const kettleHours = RATES.setupHr + q.gallons / RATES.galPerHr;
  const lineHours = 0.75 + bottles / RATES.bottlesPerHr;
  const labor = kettleHours * RATES.kettleHr + lineHours * RATES.lineHr;
  const glass = bottles * (q.size === "750 ml" ? 0.62 : 0.44);
  const packaging = glass + bottles * 0.06 + (q.labels === "We print" ? bottles * 0.1 : 0) + Math.ceil(bottles / 6) * 0.85;
  const cost = ingredients + labor + packaging;
  const price = Math.round(withMargin(cost, q.margin));
  return { bottles, ingredients, labor, kettleHours, lineHours, packaging, cost, price, perBottle: price / Math.max(1, bottles) };
}

export function buildSimpleTimes(anchor: Ymd) {
  const today = anchor;
  const seed = hash("simple-times");
  const stream = (name: string) => makeRng(seed ^ hash(name));
  const start = addDays(today, -364);
  const skuOf = (id: string) => SKUS.find((s) => s.id === id)!;

  /* ---------- accounts ---------- */
  const ar = stream("accounts");
  const used = new Set<string>();
  const people = peopleNames(ar, 260);
  let pi = 0;
  const accounts: Account[] = [];
  for (const t of ACCOUNT_TYPES) {
    const [a, b] = NAME_POOLS[t.type];
    for (let i = 0; i < t.n; i++) {
      let name = "";
      for (let k = 0; k < 40 && (!name || used.has(name)); k++) name = `${a[(i + k) % a.length]} ${ar.pick(b)}`;
      if (t.type === "Bar" && ar.chance(0.35)) name = `The ${name}`;
      used.add(name);
      const r = ar.next();
      const brands: BrandKey[] = r < t.carry[0] ? ["mixers"] : r < t.carry[0] + t.carry[1] ? ["syrup"] : ["mixers", "syrup"];
      const contacts = Array.from({ length: t.type === "Distributor" ? 2 : ar.int(1, 2) }, (_, n) => {
        const person = people[pi++ % people.length];
        return { name: person, role: ROLES[t.type][n % ROLES[t.type].length], phone: phone555(ar, ar.pick(["614", "380", "740"])), email: emailFor(person) };
      });
      const since = ar.chance(0.24) ? addDays(today, -ar.int(20, 330)) : addDays(today, -ar.int(380, 1600));
      accounts.push({
        id: `a${accounts.length + 1}`, name, type: t.type, town: ar.pick(TOWNS), brands, rep: ar.weighted(REPS, (p) => (p.id === "you" ? 1.3 : 1)).id,
        cadence: ar.int(t.cadence[0], t.cadence[1]), contacts, visits: [], notes: "", since,
      });
    }
  }
  const typeInfo = (t: AccountType) => ACCOUNT_TYPES.find((x) => x.type === t)!;

  /* ---------- wholesale / retail / distributor orders ---------- */
  const orr = stream("orders");
  const orders: Order[] = [];
  let orderNo = 41200;
  for (const a of accounts) {
    const t = typeInfo(a.type);
    const first = a.since > start ? a.since : addDays(start, orr.int(0, a.cadence));
    for (let d = first; d <= today; d = addDays(d, Math.round(a.cadence * orr.jitter(0.25)))) {
      const day = isWorkday(d) ? d : nextWorkday(d);
      if (day > today) break;
      for (const brand of a.brands) {
        if (a.brands.length === 2 && orr.chance(0.35)) continue; // not every order has both
        const season = SEASON[brand][monthIndex(day)];
        const cases = Math.max(1, Math.round(orr.range(t.cases[0], t.cases[1]) * season * (brand === "syrup" && a.type !== "Coffee shop" ? 0.6 : 1)));
        const prods = orr.shuffle(PRODUCTS.filter((p) => p.brand === brand)).slice(0, orr.int(1, 3));
        const per = a.type === "Distributor" ? 0.78 : 1;
        const lines: OrderLine[] = prods.map((p, n) => {
          const sku = skuOf(`${p.id}-6`);
          const qty = Math.max(1, Math.round((cases / prods.length) * (n === 0 ? 1.3 : 0.85)));
          return { sku: sku.id, qty, amount: +(qty * sku.wholesale * per).toFixed(2) };
        });
        orders.push({ id: `SO-${++orderNo}`, account: a.id, date: day, brand, lines, total: +lines.reduce((s, l) => s + l.amount, 0).toFixed(2), channel: t.channel, open: diffDays(today, day) <= 3 });
      }
    }
  }
  orders.sort((x, y) => (x.date < y.date ? -1 : 1));

  /* ---------- DTC (Shopify), by day ---------- */
  const dr = stream("dtc");
  const dtc: Array<{ date: Ymd; sku: string; qty: number; amount: number }> = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const mi = monthIndex(d);
    for (const brand of BRAND_KEYS) {
      const n = Math.round((brand === "mixers" ? 9 : 2.2) * SEASON[brand][mi] * dr.jitter(0.35));
      for (let k = 0; k < n; k++) {
        const bundle = brand === "mixers" && (mi >= 8 || mi === 0) && dr.chance(0.32);
        const pool = SKUS.filter((s) => s.brand === brand && (bundle ? s.format === "Bundle" : s.format === "Bottle"));
        const sku = dr.pick(pool);
        const qty = bundle ? 1 : dr.int(1, 3);
        dtc.push({ date: d, sku: sku.id, qty, amount: +(qty * sku.retail).toFixed(2) });
      }
    }
  }

  /* ---------- visits: history plus this week's route ---------- */
  const vr = stream("visits");
  let visitNo = 0;
  for (const a of accounts) {
    const n = vr.int(2, 6);
    for (let k = 0; k < n; k++) {
      let d = addDays(today, -vr.int(4, 200));
      if (!isWorkday(d)) d = nextWorkday(d);
      if (d >= today) continue;
      a.visits.push({ id: `v${++visitNo}`, date: d, rep: a.rep, note: vr.pick(VISIT_NOTES) });
    }
    a.visits.sort((x, y) => (x.date < y.date ? 1 : -1));
    a.notes = vr.pick(["Prefers Tuesday deliveries.", "Pays on time. Net 30.", "Owner likes to taste new flavors first.", "Seasonal menu changes quarterly.", "Order through the buyer, not the store.", "Ask for the bar manager after 2pm."]);
  }
  // My route this week: the rep "you", Monday to Friday.
  const monday = weekStart(today);
  const mine = vr.shuffle(accounts.filter((a) => a.rep === "you" && a.type !== "Distributor"));
  const route: Array<{ date: Ymd; account: string; time: string; why: string }> = [];
  for (let i = 0; i < 5; i++) {
    const d = addDays(monday, i);
    for (let k = 0; k < (d === today ? 4 : vr.int(2, 4)); k++) {
      const a = mine[(i * 4 + k) % mine.length];
      route.push({ date: d, account: a.id, time: ["9:30", "11:00", "1:30", "3:00"][k], why: vr.pick(["Reorder check", "Drop samples", "Holiday menu", "Shelf reset", "Staff training", "Cross-sell pitch"]) });
    }
  }

  /* ---------- tastings ---------- */
  const tr = stream("tastings");
  const stores = accounts.filter((a) => a.type === "Grocery" || a.type === "Liquor store");
  const tastings: Tasting[] = [];
  for (let d = addDays(start, 10); d <= addDays(today, 16); d = addDays(d, tr.int(3, 7))) {
    const day = weekday(d) === 0 ? addDays(d, -1) : d; // Saturdays and weekdays, never Sunday
    const a = tr.pick(stores);
    const brand = a.brands.includes("syrup") && tr.chance(0.3) ? "syrup" : "mixers";
    const poured = tr.shuffle(PRODUCTS.filter((p) => p.brand === brand)).slice(0, 3).map((p) => p.id);
    const upcoming = day >= today;
    const busy = weekday(day) === 6 ? 1.4 : 1;
    tastings.push({
      id: `t${tastings.length + 1}`, account: a.id, date: day, time: weekday(day) === 6 ? "12:00" : "4:00", rep: tr.pick(REPS).id, brand, poured,
      samples: tr.int(2, 4), sold: upcoming ? 0 : Math.round(tr.range(5, 26) * busy * SEASON[brand][monthIndex(day)]), cost: 0, upcoming,
    });
  }
  for (const t of tastings) t.cost = Math.round(t.samples * 4.2 + 3 * 22 + 12); // sample bottles + 3 rep hours + mileage
  // Tastings lift the store's next order: make the 30 days after reflect it.
  for (const t of tastings.filter((x) => !x.upcoming)) {
    const next = orders.find((o) => o.account === t.account && o.date > t.date && diffDays(o.date, t.date) <= 30 && o.brand === t.brand);
    if (next) for (const l of next.lines) { l.qty = Math.round(l.qty * 1.35) + 1; l.amount = +(l.qty * skuOf(l.sku).wholesale).toFixed(2); }
    if (next) next.total = +next.lines.reduce((s, l) => s + l.amount, 0).toFixed(2);
  }

  /* ---------- marketing calendar ---------- */
  const events: CalEvent[] = [];
  for (const yr of [+today.slice(0, 4) - 1, +today.slice(0, 4), +today.slice(0, 4) + 1]) {
    for (const e of YEAR_PLAN) {
      const date = `${yr}-${String(e.m).padStart(2, "0")}-${String(e.d).padStart(2, "0")}`;
      if (diffDays(date, today) < -60 || diffDays(date, today) > 120) continue;
      events.push({ id: `e${events.length + 1}`, date, days: e.days ?? 1, kind: e.kind, brand: e.brand, title: e.title });
    }
  }
  // Weekly social posts and a Thursday newsletter fill the rhythm.
  for (let d = addDays(weekStart(today), -28); d <= addDays(today, 60); d = addDays(d, 7)) {
    events.push({ id: `e${events.length + 1}`, date: addDays(d, 1), days: 1, kind: "Social", brand: "mixers", title: "Recipe of the week post" });
    events.push({ id: `e${events.length + 1}`, date: addDays(d, 3), days: 1, kind: "Email", brand: "both", title: "Thursday newsletter" });
  }
  events.sort((x, y) => (x.date < y.date ? -1 : 1));

  /* ---------- co-pack clients ---------- */
  const cr = stream("clients");
  const clients: Client[] = CLIENTS.map((c, i) => {
    const person = people[pi++ % people.length];
    return {
      id: `c${i + 1}`, name: c.name, products: c.products, stage: c.stage, minRun: c.minRun, next: c.next,
      nextDate: nextWorkday(addDays(today, cr.int(-2, 12))), contact: { name: person, role: cr.pick(["Founder", "Operations", "Co-founder"]), phone: phone555(cr, "614"), email: emailFor(person) },
      value: Math.round((c.minRun * cr.range(3, 8) * 48) / 100) * 100, since: addDays(today, -cr.int(20, 500)),
    };
  });

  /* ---------- production runs: 13 weeks back, 3 weeks ahead ---------- */
  const rr = stream("runs");
  const runs: Run[] = [];
  const producing = clients.filter((c) => c.stage === "Production" || c.stage === "Repeat");
  let runNo = 2600, lotNo = 8800;
  for (let w = -13; w <= 2; w++) {
    const mon = addDays(weekStart(today), w * 7);
    const perWeek = w < -10 ? 2 : 3;
    for (let k = 0; k < perWeek; k++) {
      const date = addDays(mon, [0, 2, 3][k] ?? 1);
      const own = rr.chance(0.45);
      const product = own ? rr.pick(PRODUCTS) : null;
      const client = own ? null : rr.pick(producing);
      const base = product ? product.base : "client";
      const line = product?.brand === "syrup" || (!own && rr.chance(0.3)) ? "k3" : rr.pick(["k1", "k2"]);
      const cap = line === "k2" ? 300 : line === "k1" ? 150 : 120;
      const gallons = Math.round(Math.max(client?.minRun ?? 80, cap * rr.range(0.6, 0.98)) / 10) * 10;
      const size = base === "syrup" || base === "client" ? "375 ml" : "750 ml";
      const q = quotePrice({ gallons, size, labels: "We print", margin: 0.3, base });
      const ago = diffDays(today, date);
      const status: RunStatus = ago < 0 ? "Scheduled" : ago === 0 ? (k % 2 ? "Bottling" : "Batching") : ago <= 6 ? "Released" : "Shipped";
      const yieldPct = +rr.range(94.5, 99.2).toFixed(1);
      const recipe = (RECIPES[base] ?? RECIPES.client).map(([ing, per]) => ({ ing, lot: `L${++lotNo}`, qty: Math.round(gallons * per * 10) / 10 }));
      const checks = QA_CHECKS.map((name) => ({ name, pass: true }));
      runs.push({
        id: `R-${++runNo}`, date, line, owner: product ? product.brand : client!.id, product: product ? product.name : client!.products[rr.int(0, client!.products.length - 1)], base, gallons,
        bottles: q.bottles, size, status, recipe: `v${rr.int(2, 5)}.${rr.int(0, 9)}`, lots: status === "Scheduled" ? [] : recipe, yieldPct, checks, firstPass: !rr.chance(0.09), operator: rr.pick(OPERATORS),
        ship: status === "Shipped" ? nextWorkday(addDays(date, rr.int(3, 6))) : status === "Released" ? nextWorkday(addDays(today, 1)) : undefined, price: own ? 0 : q.price, cost: q.cost,
      });
    }
  }
  // The most recent finished run is on QA hold (pH read high), so Home has one to show.
  const hold = [...runs].reverse().find((r) => r.status === "Released" && r.date < today);
  if (hold) { hold.status = "QA hold"; hold.firstPass = false; hold.ship = undefined; hold.checks = hold.checks.map((c) => (c.name.startsWith("pH") ? { ...c, pass: false } : c)); }
  // The next two scheduled runs are ginger mules, so the run-out ingredient is needed twice.
  const gingerProducts = PRODUCTS.filter((p) => RECIPES[p.base].some(([i]) => i === RUNOUT_INGREDIENT) && p.brand === "mixers");
  runs.filter((r) => r.status === "Scheduled").slice(0, 2).forEach((r, i) => {
    const p = gingerProducts[i % gingerProducts.length];
    Object.assign(r, { owner: "mixers", product: p.name, base: p.base, line: "k2", gallons: 280, size: "750 ml", price: 0, ...(() => { const q = quotePrice({ gallons: 280, size: "750 ml", labels: "We print", margin: 0.3, base: p.base }); return { bottles: q.bottles, cost: q.cost }; })() });
  });
  const invoices: Invoice[] = runs.filter((r) => r.status === "Shipped" && r.price).map((r, i) => ({ id: `INV-${3100 + i}`, client: r.owner, run: r.id, date: r.ship!, amount: r.price, paid: diffDays(today, r.ship!) > 24 ? addDays(r.ship!, rr.int(14, 28)) : undefined }));

  /* ---------- inventory, set against what scheduled runs need ---------- */
  const ir = stream("inventory");
  const need = (r: Run, ing: string) => r.gallons * ((RECIPES[r.base] ?? RECIPES.client).find(([i]) => i === ing)?.[1] ?? 0);
  const scheduled = runs.filter((r) => r.status === "Scheduled").sort((x, y) => (x.date < y.date ? -1 : 1));
  const stock: Stock[] = INGREDIENTS.map((g) => {
    const demand = scheduled.reduce((s, r) => s + need(r, g.id), 0);
    let onHand = Math.round(g.unit === "ea" ? ir.range(2400, 9000) : demand + ir.range(20, 220) * (g.unit === "lb" ? 6 : 1));
    let reorderAt = Math.round(g.unit === "ea" ? 2500 : Math.max(10, demand * 0.8 + 10));
    if (g.id === RUNOUT_INGREDIENT) {
      // Enough for the first scheduled run that uses it, not the second.
      const users = scheduled.filter((r) => need(r, g.id) > 0);
      const first = users[0] ? need(users[0], g.id) : 10;
      const second = users[1] ? need(users[1], g.id) : 10;
      onHand = Math.round((first + second * 0.35) * 10) / 10;
      reorderAt = Math.round((first + second) * 1.5);
    }
    if (g.id === "lbl-sp" || g.id === "b375") { onHand = Math.round(reorderAt * ir.range(0.55, 0.8)); }
    if (g.id === "sugar") onHand += 3000; // bulk sugar comes by the pallet
    return { id: g.id, name: g.name, unit: g.unit, onHand, reorderAt, supplier: g.supplier, lead: g.lead, owner: "Simple Times", kind: g.kind, cost: g.cost };
  });
  // Client-owned stock we hold for them.
  for (const c of producing) {
    stock.push({ id: `cl-${c.id}-lbl`, name: `Labels: ${c.name}`, unit: "ea", onHand: ir.int(600, 5000), reorderAt: 800, supplier: "Client supplied", lead: 0, owner: c.id, kind: "Labels", cost: 0 });
    stock.push({ id: `cl-${c.id}-fg`, name: `${c.products[0]}, finished cases`, unit: "case", onHand: ir.int(0, 140), reorderAt: 0, supplier: "Made here", lead: 0, owner: c.id, kind: "Finished goods", cost: 0 });
  }
  // Our finished goods.
  for (const p of PRODUCTS) {
    const sku = SKUS.find((s) => s.id === `${p.id}-6`)!;
    const min = p.brand === "mixers" ? 60 : 30;
    stock.push({ id: `fg-${p.id}`, name: `${p.name}, cases`, unit: "case", onHand: p.id === "bbs" || p.id === "lh" ? Math.round(min * 0.6) : ir.int(min, min * 4), reorderAt: min, supplier: "Made here", lead: 0, owner: p.brand, kind: "Finished goods", cost: sku.cost });
  }
  const runoutUsers = scheduled.filter((r) => need(r, RUNOUT_INGREDIENT) > 0);
  const pos: PO[] = [
    { id: "PO-5120", item: RUNOUT_INGREDIENT, qty: 40, ordered: addDays(today, -2), eta: nextWorkday(addDays(runoutUsers[1]?.date ?? addDays(today, 6), 3)), cost: 40 * 38 },
    { id: "PO-5117", item: "b375", qty: 6000, ordered: addDays(today, -5), eta: nextWorkday(addDays(today, 6)), cost: 6000 * 0.44 },
    { id: "PO-5114", item: "lbl-sp", qty: 5000, ordered: addDays(today, -6), eta: nextWorkday(addDays(today, 3)), cost: 5000 * 0.11 },
  ];

  /* ---------- co-pack quotes ---------- */
  const qr = stream("quotes");
  const quotes: Quote[] = clients.filter((c) => c.stage === "Quote" || c.stage === "Contract" || c.stage === "Sample").map((c, i) => ({
    id: `Q-${720 + i}`, client: c.id, product: c.products[0], gallons: Math.max(c.minRun, Math.round(qr.range(1.2, 2.4) * c.minRun / 10) * 10), size: qr.chance(0.5) ? "375 ml" : "750 ml",
    labels: qr.chance(0.5) ? "Client supplied" : "We print", margin: 0.3, date: addDays(today, -qr.int(2, 20)), status: c.stage === "Contract" ? "Accepted" : c.stage === "Quote" ? "Sent" : "Draft",
  }));

  return { today, accounts, orders, dtc, route, tastings, events, clients, runs, invoices, stock, pos, quotes, seq: { order: orderNo, run: runNo, lot: lotNo } };
}

export type StData = ReturnType<typeof buildSimpleTimes>;
export const runNeed = (r: Run, ing: string) => r.gallons * ((RECIPES[r.base] ?? RECIPES.client).find(([i]) => i === ing)?.[1] ?? 0);
export { LINES };
export type { RunStatus };
export const lineName = (id: string) => LINES.find((l) => l.id === id)?.name ?? id;
export const monthOf = monthKey;
