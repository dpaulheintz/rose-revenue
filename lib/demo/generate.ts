// The master dataset for a demo. Built once from (config, anchor date) by a
// seeded generator; every module derives its numbers from these records, so
// totals reconcile across Sales, Ranch, Scorecard, and Overview.
//
// Separate random streams per stage / month / day keep identities (names,
// accounts) stable day to day and keep past days' numbers from shifting.

import type { AccountType, DemoConfig, Priority, ProjectStatus, USState } from "@/demos/types";
import { hash, makeRng, type Rng } from "./rng";
import {
  addDays, addMonths, daysInMonth, diffDays, eachDay, monthIndex, monthKey, nextOccurrence, weekStart, weekday, type Ymd,
} from "./dates";

export type AccountStatus = "Prospect" | "Active" | "At risk" | "Lost";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  marketId: string;
  state: USState;
  city: string;
  repId: string;
  size: number;
  skus: string[];
  openedOn: Ymd | null;
  lostOn: Ymd | null;
  fadeOn: Ymd | null;
  status: AccountStatus;
  notes: string[];
};

export type Contact = { id: string; accountId: string; name: string; role: string; phone: string; email: string };

export type VisitType = "Tasting" | "Placement" | "Staff training" | "Event activation" | "Follow-up";
export type Visit = { id: string; date: Ymd; repId: string; accountId: string; type: VisitType; outcome: string; notes: string };

export type OrderLine = { date: Ymd; accountId: string; skuId: string; cases: number; revenue: number; state: USState };

export type RanchDay = {
  date: Ymd;
  day: "Fri" | "Sat";
  weekendOf: Ymd; // the Friday
  act: string;
  stage: string;
  headliner: boolean;
  visitors: number;
  cocktails: number;
  food: number;
  cigars: number;
  tastings: number;
  merch: number;
  total: number; // on-site revenue (excludes bottle shop)
  cocktailQty: number[]; // aligned with config.ranch.cocktails
  trucks: Array<{ name: string; sales: number }>;
  hourly: number[]; // aligned with openHours for that day
  bottleShop: number;
};

export type PrivateEvent = {
  id: string;
  date: Ymd; // always a Sunday
  type: string;
  host: string;
  guests: number;
  total: number;
  deposit: number;
  depositPaid: boolean;
  bookedOn: Ymd;
  status: "Completed" | "Confirmed" | "Deposit due" | "Tentative";
};

export type MaintenanceStatus = "Open" | "In progress" | "Waiting on parts" | "Done";
export type MaintenanceItem = {
  id: string;
  title: string;
  equipment: string;
  location: string;
  priority: Priority;
  status: MaintenanceStatus;
  reporter: string; // person id
  assignee: string; // person id
  reportedOn: Ymd;
  dueOn: Ymd;
  closedOn: Ymd | null;
  cost: number | null;
  photos: number;
};

export type ProjectItem = {
  id: string;
  boardId: string;
  name: string;
  owner: string;
  group: "This week" | "Up next" | "Done";
  status: ProjectStatus;
  priority: Priority;
  start: Ymd;
  due: Ymd;
};
export type Board = { id: string; name: string; eventDate: Ymd | null; items: ProjectItem[] };

export type Dataset = {
  anchor: Ymd; // "today"
  months: string[]; // 12 x "YYYY-MM", oldest → current (partial) month
  weeks: Ymd[]; // 13 completed Mon–Sun weeks (Monday dates), oldest → newest
  accounts: Account[];
  contacts: Contact[];
  visits: Visit[];
  orders: OrderLine[];
  ranchDays: RanchDay[];
  events: PrivateEvent[];
  maintenance: MaintenanceItem[];
  boards: Board[];
  newsletterByWeek: number[];
  productionByWeek: number[];
};

const round = (n: number, step = 1) => Math.round(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const stream = (cfg: DemoConfig, key: string): Rng => makeRng((cfg.seed ^ hash(key)) >>> 0);

/** Weighted picker with a precomputed cumulative table (fast, reusable). */
function picker<T>(items: T[], weight: (t: T) => number) {
  const cum: number[] = [];
  let total = 0;
  for (const it of items) cum.push((total += Math.max(0, weight(it))));
  return (r: number) => {
    const x = r * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return items[lo];
  };
}

function seasonFactor(season: "cold" | "warm" | "flat", m: number) {
  const cold = [0, 1, 9, 10, 11].includes(m); // Oct–Feb
  const warm = m >= 4 && m <= 7; // May–Aug
  if (season === "cold") return cold ? 1.35 : warm ? 0.72 : 1;
  if (season === "warm") return warm ? 1.5 : cold ? 0.72 : 1; // strong enough to beat the winter-wide bump
  return 1;
}

const ROLES: Record<AccountType, string[]> = {
  Bar: ["Bar manager", "GM", "Bartender"],
  Restaurant: ["GM", "Bar manager"],
  "Package store": ["Buyer", "GM"],
  "Regional grocery": ["Buyer"],
  Venue: ["GM", "Bar manager"],
  Hotel: ["GM", "Bar manager"],
};

const ACCOUNT_NOTES = [
  "Buyer prefers Tuesday mornings, before the lunch rush.",
  "Runs a Hotscotch Texas Sour on the happy hour menu.",
  "Wants shelf talkers for the holiday minis.",
  "New GM started last month. Re-introduce the lineup.",
  "Asked about a staff tasting before the fall menu change.",
  "Big patio crowd on game days. Pitch a bucket special.",
  "Pays on time. Reorders when down to one case.",
  "Interested in a private label event at the ranch.",
  "Price-sensitive. Lead with Iron Hot minis.",
  "Bartenders love the Iron Werewolf. Ask for a menu spot.",
];

const OUTCOMES: Record<VisitType, string[]> = {
  Tasting: ["Positive. Buyer wants samples for staff.", "Ordered through distributor.", "Not now. Revisit after menu change.", "Loved Hotscotch; Giddy'Up! a maybe."],
  Placement: ["Placed Hotscotch + Iron Hot.", "New account opened.", "Added to back bar.", "Shelf placement secured, eye level."],
  "Staff training": ["Trained 6 bartenders on the lineup.", "Walked staff through the cocktail specs.", "Shift meeting pitch done."],
  "Event activation": ["Ran sampling table, 120+ pours.", "Trivia night sponsor, good turnout.", "Live music night activation."],
  "Follow-up": ["Reorder confirmed.", "Left POS materials.", "Buyer out. Rescheduled.", "Checked stock, all good."],
};
const VISIT_NOTES = [
  "Brought Hotscotch minis for the staff.",
  "Talked up the fall concert series.",
  "Asked about holiday gift sets.",
  "Menu reprint coming next month.",
  "Owner wants to visit the ranch.",
  "Competing cinnamon whiskey on the rail.",
  "Good energy. Easy follow-up.",
  "",
];

export function buildDataset(cfg: DemoConfig, anchor: Ymd): Dataset {
  const yesterday = addDays(anchor, -1);
  // On the 1st nothing has happened yet this month, so the window ends last month.
  const thisMonth = monthKey(yesterday);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i - 11));
  const windowStart: Ymd = `${months[0]}-01`;
  const weeks = Array.from({ length: 13 }, (_, i) => addDays(weekStart(anchor), -7 * (13 - i)));

  /* ------------------------------ accounts ------------------------------ */
  const idRng = stream(cfg, "identity");
  const typePick = picker(cfg.accountTypes, (t) => t.share);
  const skuById = new Map(cfg.skus.map((s) => [s.id, s]));
  const usedNames = new Set<string>();
  const accounts: Account[] = [];

  for (const market of cfg.markets) {
    for (let i = 0; i < market.accounts; i++) {
      const t = typePick(idRng.next());
      let name = "";
      for (let tries = 0; tries < 50 && (!name || usedNames.has(name)); tries++) {
        name = `${idRng.pick(cfg.names.venueStems)} ${idRng.pick(cfg.names.suffixes[t.type])}`;
      }
      usedNames.add(name);
      const skus = t.skus.filter((id, k) => k === 0 || idRng.chance(0.3 + 0.2 * (skuById.get(id)?.weight ?? 1)));
      if (skus.length < 2) skus.push(t.skus[1]);

      const r = idRng.next();
      const cls = r < 0.09 ? "prospect" : r < 0.15 ? "lost" : r < 0.22 ? "risk" : "active";
      const age = idRng.next();
      let openedOn: Ymd | null = null;
      let lostOn: Ymd | null = null;
      let fadeOn: Ymd | null = null;
      if (cls !== "prospect") {
        const recentSpan = diffDays(anchor, windowStart);
        if (cls === "active" && age > 0.88) openedOn = addDays(anchor, -(1 + ((idRng.int(0, 89) * 37) % 90)));
        else if (cls === "active" && age > 0.58) openedOn = addDays(anchor, -idRng.int(92, recentSpan));
        else openedOn = addDays(windowStart, -idRng.int(30, 900));
        if (cls === "lost") lostOn = addDays(anchor, -idRng.int(125, 300));
        if (cls === "risk") fadeOn = addDays(anchor, -idRng.int(62, 110));
      }
      accounts.push({
        id: `a${String(accounts.length + 1).padStart(3, "0")}`,
        name,
        type: t.type,
        marketId: market.id,
        state: market.state,
        city: idRng.pick(market.cities),
        repId: market.repId,
        size: Math.max(0.3, t.size * idRng.jitter(0.35)),
        skus,
        openedOn,
        lostOn,
        fadeOn,
        status: "Active",
        notes: idRng.shuffle(ACCOUNT_NOTES).slice(0, idRng.int(1, 2)),
      });
    }
  }
  // Straight Rye: limited release, only in a handful of Texas package stores.
  accounts
    .filter((a) => a.state === "TX" && a.type === "Package store" && a.openedOn && !a.lostOn)
    .slice(0, 5)
    .forEach((a) => a.skus.push("rye"));

  const marketById = new Map(cfg.markets.map((m) => [m.id, m]));

  /* ------------------------------ contacts ------------------------------ */
  const contacts: Contact[] = [];
  for (const a of accounts) {
    const roles = ROLES[a.type];
    const n = Math.min(roles.length, 1 + (idRng.chance(0.55) ? 1 : 0) + (idRng.chance(0.12) ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const first = idRng.pick(cfg.names.first);
      const last = idRng.pick(cfg.names.last);
      contacts.push({
        id: `c${String(contacts.length + 1).padStart(3, "0")}`,
        accountId: a.id,
        name: `${first} ${last}`,
        role: roles[k],
        phone: `(${marketById.get(a.marketId)!.areaCode}) 555-01${String(idRng.int(0, 99)).padStart(2, "0")}`,
        email: `${first}.${last[0]}@example.com`.toLowerCase(),
      });
    }
  }

  /* ------------------------ distributor depletions ----------------------- */
  const orders: OrderLine[] = [];
  months.forEach((mk, k) => {
    const rng = stream(cfg, `sales:${mk}`);
    const mi = +mk.slice(5, 7) - 1;
    const dim = daysInMonth(mk);
    const monthStart: Ymd = `${mk}-01`;
    const isCurrent = mk === thisMonth;
    const lastDay: Ymd = isCurrent ? yesterday : `${mk}-${String(dim).padStart(2, "0")}`;
    if (lastDay < monthStart) return; // today is the 1st: nothing shipped yet this month
    const fraction = isCurrent ? (diffDays(lastDay, monthStart) + 1) / dim : 1;

    const full = cfg.sales.monthlyCasesBase * cfg.sales.seasonIndex[mi] * Math.pow(1 + cfg.sales.growthPerMonth, k) * rng.jitter(0.03);
    const target = clamp(full, 720, 1080) * fraction; // keep every month in the real-world 700–1,100 case range
    const share = cfg.sales.txShare + rng.range(-0.02, 0.02);
    const tx = Math.round(target * share);
    const oos = Math.round(target) - tx;

    const eligible = (a: Account) =>
      a.openedOn !== null && a.openedOn <= lastDay && !(a.lostOn && a.lostOn <= monthStart) && !(a.fadeOn && a.fadeOn <= monthStart);
    const weightFor = (a: Account) => {
      const opened = a.openedOn!;
      const live = opened > monthStart ? (diffDays(lastDay, opened) + 1) / (diffDays(lastDay, monthStart) + 1) : 1;
      return a.size * live;
    };
    const counts = new Map<Account, number>();
    for (const [pool, units] of [
      [accounts.filter((a) => a.state === "TX" && eligible(a)), tx],
      [accounts.filter((a) => a.state !== "TX" && eligible(a)), oos],
    ] as const) {
      if (!pool.length) continue;
      const pick = picker(pool, weightFor);
      for (let u = 0; u < units; u++) {
        const a = pick(rng.next());
        counts.set(a, (counts.get(a) ?? 0) + 1);
      }
    }

    for (const [a, c] of counts) {
      const skuPick = picker(
        a.skus.map((id) => skuById.get(id)!).filter((s) => s.channel !== "ranch"),
        (s) => s.weight * seasonFactor(s.season, mi),
      );
      const perSku = new Map<string, number>();
      for (let u = 0; u < c; u++) {
        const s = skuPick(rng.next());
        perSku.set(s.id, (perSku.get(s.id) ?? 0) + 1);
      }
      const from = a.openedOn! > monthStart ? a.openedOn! : monthStart;
      const days = eachDay(from, lastDay).filter((d) => weekday(d) >= 1 && weekday(d) <= 5);
      const nOrders = Math.max(1, Math.min(days.length, c <= 3 ? 1 : c <= 8 ? 2 : 3));
      const dates = rng.shuffle(days).slice(0, nOrders).sort();
      if (!dates.length) dates.push(from);
      let i = 0;
      for (const [skuId, cases] of perSku) {
        // spread a SKU's cases over the account's order dates
        const split = Math.min(cases, dates.length);
        for (let j = 0; j < split; j++) {
          const q = Math.floor(cases / split) + (j < cases % split ? 1 : 0);
          const date = dates[(i + j) % dates.length];
          const sku = skuById.get(skuId)!;
          orders.push({ date, accountId: a.id, skuId, cases: q, revenue: q * sku.casePrice, state: a.state });
        }
        i++;
      }
    }
  });
  orders.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));

  /* -------------------------------- visits ------------------------------- */
  const visits: Visit[] = [];
  const visitStart = addDays(anchor, -182);
  const addVisit = (v: Omit<Visit, "id">) => visits.push({ ...v, id: `v${String(visits.length + 1).padStart(4, "0")}` });
  const typePickV = picker<VisitType>(["Tasting", "Follow-up", "Staff training", "Event activation", "Placement"], (t) =>
    ({ Tasting: 28, "Follow-up": 34, "Staff training": 15, "Event activation": 12, Placement: 8 })[t],
  );
  for (const rep of cfg.reps) {
    const mine = accounts.filter((a) => a.repId === rep.id);
    const seen = new Map<string, Ymd>();
    for (let ws = weekStart(visitStart); ws <= yesterday; ws = addDays(ws, 7)) {
      const rng = stream(cfg, `visits:${rep.id}:${ws}`);
      const pool = mine.filter((a) => !a.openedOn || a.openedOn <= ws || diffDays(a.openedOn, ws) < 7);
      const pickA = picker(pool, (a) => {
        const base = a.lostOn ? 0.05 : a.fadeOn && a.fadeOn < ws ? 0.1 : !a.openedOn ? 0.8 : a.openedOn > addDays(ws, -60) ? 1.4 : 1;
        const last = seen.get(a.id);
        const since = last ? diffDays(ws, last) : 999;
        return base * (since > 40 ? 2.6 : since > 20 ? 1 : 0.3);
      });
      const n = rng.int(3, 6);
      for (let k = 0; k < n; k++) {
        const type = typePickV(rng.next());
        const offset = type === "Event activation" ? rng.pick([4, 5]) : rng.int(0, 4);
        const date = addDays(ws, offset);
        if (date < visitStart || date > yesterday) continue;
        const a = pickA(rng.next());
        seen.set(a.id, date);
        addVisit({ date, repId: rep.id, accountId: a.id, type, outcome: rng.pick(OUTCOMES[type]), notes: rng.pick(VISIT_NOTES) });
      }
    }
  }
  // Every account opened in the window was opened on a placement visit.
  for (const a of accounts) {
    if (a.openedOn && a.openedOn >= visitStart && a.openedOn <= yesterday) {
      const rng = stream(cfg, `open:${a.id}`);
      addVisit({ date: a.openedOn, repId: a.repId, accountId: a.id, type: "Placement", outcome: "New account opened.", notes: rng.pick(VISIT_NOTES) });
    }
  }
  visits.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0)); // newest first

  // Status from the records themselves.
  const lastOrder = new Map<string, Ymd>();
  for (const o of orders) lastOrder.set(o.accountId, o.date);
  for (const a of accounts) {
    const lo = lastOrder.get(a.id);
    a.status = !a.openedOn
      ? "Prospect"
      : a.lostOn
        ? "Lost"
        : a.fadeOn || (lo && diffDays(anchor, lo) > 60)
          ? "At risk"
          : "Active";
  }

  /* ----------------------------- ranch days ------------------------------ */
  const R = cfg.ranch;
  const ranchDays: RanchDay[] = [];
  const cocktailWeight = R.cocktails.reduce((s, c) => s + c.weight, 0);
  for (const d of eachDay(windowStart, yesterday)) {
    const wd = weekday(d);
    if (wd !== 5 && wd !== 6) continue; // open Fri & Sat only; Sunday is private events
    const fri = wd === 5 ? d : addDays(d, -1);
    const wk = stream(cfg, `weekend:${fri}`);
    const act = R.acts[hash(`act:${fri}`) % R.acts.length];
    const headliner = wk.chance(0.3);
    const stage = headliner ? R.stages[0] : R.stages[1 + (hash(`stage:${fri}`) % 2)];

    const rng = stream(cfg, `ranch:${d}`);
    const isSat = wd === 6;
    const m = monthIndex(d);
    const spend = rng.range(28, 42);
    let visitors = (isSat ? 540 : 240) * R.visitorSeason[m] * (headliner ? 1.28 : 1) * rng.jitter(0.12);
    const [lo, hi] = isSat ? [12040, 29960] : [5040, 13960];
    visitors = Math.round(clamp(visitors * spend, lo, hi) / spend);
    const budget = visitors * spend;

    const shares = { cocktails: 0.4, food: 0.23, cigars: 0.09, tastings: 0.19, merch: 0.09 };
    const j = Object.fromEntries(Object.entries(shares).map(([k, v]) => [k, v * rng.jitter(0.1)])) as typeof shares;
    const jSum = j.cocktails + j.food + j.cigars + j.tastings + j.merch;

    const cocktailQty = R.cocktails.map((c) =>
      Math.max(0, Math.round(((budget * j.cocktails) / jSum) * (c.weight / cocktailWeight) / c.price * rng.jitter(0.15))),
    );
    const cocktails = cocktailQty.reduce((s, q, i) => s + q * R.cocktails[i].price, 0);

    const food = round((budget * j.food) / jSum);
    const guests = isSat && rng.chance(0.45) ? 2 : 1;
    const start = hash(`trucks:${fri}`) % R.guestTrucks.length;
    const guestNames = Array.from({ length: guests }, (_, g) => R.guestTrucks[(start + g + (isSat ? 1 : 0)) % R.guestTrucks.length]);
    const house = round(food * clamp(rng.range(0.55, 0.66), 0, 1));
    const trucks = [{ name: R.houseTruck, sales: house }];
    guestNames.forEach((name, g) => {
      const rest = food - house;
      const part = g === guests - 1 ? rest - trucks.slice(1).reduce((s, t) => s + t.sales, 0) : round(rest * rng.range(0.45, 0.6));
      trucks.push({ name, sales: part });
    });

    const cigars = round((budget * j.cigars) / jSum);
    const tastings = round((budget * j.tastings) / jSum);
    const total = round(budget);
    const merch = total - cocktails - food - cigars - tastings; // absorbs rounding, ~9% of sales

    const hours = isSat ? R.openHours.sat : R.openHours.fri;
    const shape = isSat ? [0.07, 0.09, 0.11, 0.13, 0.14, 0.15, 0.16, 0.15] : [0.18, 0.27, 0.31, 0.24];
    const raw = hours.map((_, i) => shape[i] * rng.jitter(0.12));
    const rawSum = raw.reduce((s, v) => s + v, 0);
    const hourly = raw.map((v) => round((total * v) / rawSum));
    hourly[hourly.length - 1] += total - hourly.reduce((s, v) => s + v, 0);

    const holiday = m === 10 || m === 11 ? 1.35 : 1;
    const bottleShop = round(visitors * 6.4 * holiday * rng.jitter(0.15));

    ranchDays.push({
      date: d, day: isSat ? "Sat" : "Fri", weekendOf: fri, act, stage, headliner, visitors,
      cocktails, food, cigars, tastings, merch, total, cocktailQty, trucks, hourly, bottleShop,
    });
  }
  // Keep each month's bottle shop inside its real-world range ($18–35k),
  // projecting the current partial month before deciding.
  for (const mk of months) {
    const days = ranchDays.filter((r) => monthKey(r.date) === mk);
    if (!days.length) continue;
    const sum = days.reduce((s, r) => s + r.bottleShop, 0);
    const openDaysInMonth = eachDay(`${mk}-01`, `${mk}-${String(daysInMonth(mk)).padStart(2, "0")}`).filter((d) => [5, 6].includes(weekday(d))).length;
    const projected = (sum * openDaysInMonth) / days.length;
    const scale = clamp(projected, 18500, 34500) / projected;
    if (Math.abs(scale - 1) > 0.001) for (const r of days) r.bottleShop = round(r.bottleShop * scale);
  }

  /* --------------------------- private events --------------------------- */
  const events: PrivateEvent[] = [];
  const typePickE = picker(R.eventTypes, (t) => ({ Wedding: 30, Corporate: 22, Fundraiser: 14, "Bach party": 16, Birthday: 18 })[t.type] ?? 10);
  let sunday = addDays(windowStart, (7 - weekday(windowStart)) % 7);
  for (; sunday <= addDays(anchor, 300); sunday = addDays(sunday, 7)) {
   for (const slot of [0, 1]) {
    const rng = stream(cfg, `event:${sunday}:${slot}`);
    const ahead = diffDays(sunday, anchor);
    const p = slot === 0 ? (ahead < 0 ? 0.85 : clamp(0.9 - ahead / 420, 0.2, 0.9)) : 0.4;
    if (!rng.chance(p)) continue;
    const bookedOn = addDays(sunday, -rng.int(20, 300));
    if (bookedOn > yesterday) continue; // not booked yet
    const t = typePickE(rng.next());
    const last = rng.pick(cfg.names.last);
    const host =
      t.type === "Wedding" ? `${last} & ${rng.pick(cfg.names.last)} wedding`
      : t.type === "Bach party" ? `${rng.pick(cfg.names.first)} ${last} bach party`
      : t.type === "Birthday" ? `${rng.pick(cfg.names.first)} ${last}'s birthday`
      : `${rng.pick(R.eventHosts)} ${t.type === "Corporate" ? "offsite" : "benefit"}`;
    const total = round(rng.range(t.price[0], t.price[1]), 50);
    const deposit = round(total * rng.pick([0.25, 0.3, 0.5]), 50);
    const past = sunday < anchor;
    const r = rng.next();
    const status: PrivateEvent["status"] = past ? "Completed" : r < 0.75 ? "Confirmed" : r < 0.9 ? "Deposit due" : "Tentative";
    events.push({
      id: `e${String(events.length + 1).padStart(3, "0")}`,
      date: sunday, type: t.type, host, guests: rng.int(t.guests[0], t.guests[1]), total, deposit,
      depositPaid: status === "Completed" || status === "Confirmed", bookedOn, status,
    });
   }
  }
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));

  /* ----------------------------- maintenance ---------------------------- */
  const mRng = stream(cfg, "maintenance");
  const staffIds = cfg.people.map((p) => p.id);
  const dueIn: Record<Priority, number> = { Critical: 3, High: 7, Medium: 14, Low: 28 };
  const maintenance: MaintenanceItem[] = cfg.maintenance.items.map((seed, i) => {
    const age = mRng.int(2, 115);
    const reportedOn = addDays(anchor, -age);
    const pDone = age > 60 ? 0.78 : age > 25 ? 0.45 : 0.12;
    const done = mRng.chance(pDone);
    const status: MaintenanceStatus = done ? "Done" : mRng.pick(["Open", "Open", "In progress", "In progress", "Waiting on parts"] as const);
    const closedOn = done ? (() => { const c = addDays(reportedOn, mRng.int(4, 45)); return c > yesterday ? yesterday : c; })() : null;
    const base = { Critical: 1800, High: 900, Medium: 350, Low: 120 }[seed.priority];
    return {
      id: `m${String(i + 1).padStart(2, "0")}`,
      ...seed,
      status,
      reporter: mRng.pick(staffIds),
      assignee: mRng.chance(0.7) ? "maint" : mRng.pick(["ops", "gm", "bottling"]),
      reportedOn,
      dueOn: addDays(reportedOn, dueIn[seed.priority]),
      closedOn,
      cost: done || status === "In progress" ? round(base * mRng.range(0.3, 2.2), 5) : null,
      photos: mRng.int(0, 3),
    };
  });

  let overdue = 0;
  for (const m of maintenance) {
    if (m.status === "Done" || m.dueOn >= anchor) continue;
    if (overdue < 4) {
      overdue++;
      m.dueOn = addDays(anchor, -mRng.int(1, 12));
      m.reportedOn = addDays(m.dueOn, -dueIn[m.priority]);
      continue;
    }
    const days = dueIn[m.priority];
    m.reportedOn = addDays(anchor, -mRng.int(1, Math.max(1, days - 1)));
    m.dueOn = addDays(m.reportedOn, days);
  }

  /* ------------------------------ projects ------------------------------ */
  const boards: Board[] = cfg.projects.map((b) => ({
    id: b.id,
    name: b.name,
    eventDate: b.anchor ? nextOccurrence(anchor, b.anchor.month, b.anchor.day) : null,
    items: b.items.map((it, i) => ({
      id: `${b.id}-${i + 1}`,
      boardId: b.id,
      name: it.name,
      owner: it.owner,
      group: it.group,
      status: it.status,
      priority: it.priority,
      start: addDays(anchor, it.start),
      due: addDays(anchor, it.due),
    })),
  }));

  /* ----------------------- other weekly series ------------------------- */
  const newsletterByWeek = weeks.map((ws) => {
    const rng = stream(cfg, `news:${ws}`);
    const v = ranchDays.filter((r) => r.date >= ws && r.date <= addDays(ws, 6)).reduce((s, r) => s + r.visitors, 0);
    return Math.round(v * 0.045 * rng.jitter(0.15) + 18);
  });
  const productionByWeek = weeks.map((ws) => stream(cfg, `prod:${ws}`).int(2, 5));

  return { anchor, months, weeks, accounts, contacts, visits, orders, ranchDays, events, maintenance, boards, newsletterByWeek, productionByWeek };
}
