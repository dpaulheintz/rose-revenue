// The one seeded generator for Shop HQ. It reads only the prospect config, so
// a new prospect.ts reshapes everything. All people and records are invented.

import { addDays, monthIndex, weekStart, weekday, type Ymd } from "@demos/kit/data/dates";
import { peopleNames, phone555 } from "@demos/kit/data/fake";
import { hash, makeRng } from "@demos/kit/data/rng";
import type { ShopProspect } from "./types";

const STREETS = ["Linden Bend Dr", "Quarry Hollow Ct", "Saddlebrook Ln", "Copper Mill Rd", "Wrenfield Ave", "Hawthorne Glen Dr", "Briar Gate Ct", "Tamarack Run", "Foxfire Way", "Old Kiln Rd", "Willow Crest Dr", "Larkhaven Ct", "Stonepath Ln", "Meadowlark Bend", "Juniper Hill Rd", "Cobble Creek Dr"];
/** Columbus normal highs by month (°F). */
const HIGHS = [36, 40, 51, 63, 73, 81, 85, 83, 77, 65, 51, 40];
/** How much of each kind of work there is by month (Jan = 0): heating in winter, cooling in summer, tune-ups in spring and fall. */
const DEMAND = {
  heat: [1.9, 1.7, 1.0, 0.4, 0.15, 0.05, 0.05, 0.05, 0.2, 0.7, 1.4, 1.9],
  cool: [0.05, 0.05, 0.2, 0.5, 1.1, 1.9, 2.1, 1.8, 0.9, 0.2, 0.05, 0.05],
  furnaceTune: [0.2, 0.1, 0.05, 0, 0, 0, 0, 0.1, 1.2, 1.8, 1.5, 0.6],
  acTune: [0, 0, 0.6, 1.6, 1.8, 0.9, 0.2, 0, 0, 0, 0, 0],
  plumbing: [1.2, 1.1, 1, 1, 1, 0.9, 0.9, 0.9, 1, 1, 1.1, 1.2],
};
const weight = (name: string, kind: string, m: number) => {
  const n = name.toLowerCase();
  if (n.includes("heat") || n.includes("furnace replacement")) return DEMAND.heat[m];
  if (n.includes("cool") || n.includes("ac replacement")) return DEMAND.cool[m];
  if (n.includes("furnace tune")) return DEMAND.furnaceTune[m] * 0.85;
  if (n.includes("ac tune")) return DEMAND.acTune[m] * 0.85;
  return kind === "Install" ? 0.5 : 0.8;
};
const TIMES = ["8:00", "10:30", "1:00", "3:00"];

export type Customer = { name: string; street: string; town: string; phone: string };
export type Invoice = { id: string; sent: Ymd; amount: number; paid?: Ymd };
export type Job = { id: string; date: Ymd; time: string; crew: number; service: number; customer: Customer; amount: number; done: boolean; invoice?: Invoice; callback?: { reason: string; scheduled: boolean } };
export type Estimate = { id: string; date: Ymd; crew: number; service: number; customer: Customer; amount: number; status: "Won" | "Lost" | "Open" };
export type Lead = { id: string; date: Ymd; time: string; source: string; customer: Customer; need: string; responseMin: number; status: "Booked" | "Waiting" | "Lost"; afterHours: boolean };
export type Member = { id: string; customer: Customer; plan: number; start: Ymd; renews: Ymd; lastFurnace?: Ymd; lastAc?: Ymd };
export type Permit = { id: string; job: string; kind: "Permit" | "Inspection"; date: Ymd; status: "Approved" | "Pending" | "Scheduled" };

export function buildShop(p: ShopProspect, anchor: Ymd) {
  const today = anchor;
  const seed = hash(p.slug + p.name);
  const stream = (n: string) => makeRng(seed ^ hash(n));
  const names = peopleNames(stream("people"), 900);
  let ni = 0;
  const cr = stream("customers");
  const newCustomer = (): Customer => ({ name: names[ni++ % names.length], street: `${cr.int(110, 9800)} ${cr.pick(STREETS)}`, town: cr.pick(p.towns), phone: phone555(cr, cr.pick(["614", "380"])) });
  const techs = p.crew.map((c, i) => ({ ...c, i })).filter((c) => !c.install);
  const installs = p.crew.map((c, i) => ({ ...c, i })).filter((c) => c.install);
  const servicesFor = (trade: string, install: boolean) => p.services.map((s, i) => ({ ...s, i })).filter((s) => (install ? s.kind === "Install" : s.kind !== "Install") && (install || s.trade === trade));

  /* jobs: 12 months back, 2 weeks ahead */
  const jr = stream("jobs");
  const jobs: Job[] = [];
  let jobNo = 18400, invNo = 52100;
  for (let back = 364; back >= -14; back--) {
    const date = addDays(today, -back);
    const wd = weekday(date);
    if (wd === 0) continue;
    const m = monthIndex(date);
    const busy = (DEMAND.heat[m] + DEMAND.cool[m]) / 2 + 0.55;
    const crews = wd === 6 ? techs.filter((_, i) => i % 3 === 0) : [...techs, ...installs];
    for (const c of crews) {
      const n = c.install ? (jr.chance(0.85) ? 1 : 0) : Math.max(0, Math.round(1.2 * busy * jr.jitter(0.4)));
      for (let k = 0; k < Math.min(n, TIMES.length); k++) {
        const pool = servicesFor(c.trade, !!c.install);
        const s = jr.weighted(pool, (x) => weight(x.name, x.kind, m));
        const amount = Math.round(jr.range(s.ticket[0], s.ticket[1]) / 5) * 5;
        const done = back > 0;
        const j: Job = { id: `J-${++jobNo}`, date, time: TIMES[k], crew: c.i, service: s.i, customer: newCustomer(), amount, done };
        if (done) {
          const age = back;
          const notYet = age <= 4 && jr.chance(0.18);
          if (!notYet) {
            const sent = addDays(date, jr.chance(0.8) ? 0 : 1);
            const r = jr.next();
            const paid = age > 95 ? r < 0.9985 : age > 60 ? r < 0.99 : age > 30 ? r < 0.975 : age > 8 ? r < 0.955 : r < 0.74;
            j.invoice = { id: `INV-${++invNo}`, sent, amount, paid: paid ? addDays(sent, s.kind === "Install" ? jr.int(0, 12) : jr.int(0, 5)) : undefined };
            if (j.invoice.paid && j.invoice.paid > today) j.invoice.paid = undefined;
          }
          if (s.kind !== "Tune-up" && jr.chance(0.035)) j.callback = { reason: jr.pick(["Still not heating upstairs", "Drip came back", "Thermostat not holding", "Noise after repair", "Breaker tripping"]), scheduled: age > 21 || jr.chance(0.35) };
        }
        jobs.push(j);
      }
    }
  }

  // A few slow payers in every age band, so the aging buckets look like a real shop's.
  for (const [from, to, n] of [[31, 60, 4], [61, 90, 3], [91, 200, 2]] as const) {
    const band = jobs.filter((j) => j.invoice && j.invoice.paid && j.date >= addDays(today, -to) && j.date <= addDays(today, -from));
    for (const j of jr.shuffle(band).slice(0, n)) j.invoice!.paid = undefined;
  }

  /* estimates (replacements and bigger repairs) */
  const er = stream("estimates");
  const estimates: Estimate[] = [];
  let estNo = 7700;
  for (let back = 120; back >= 0; back -= 1) {
    const date = addDays(today, -back);
    if (weekday(date) === 0) continue;
    for (const c of techs) {
      if (!er.chance(0.32)) continue;
      const pool = p.services.map((s, i) => ({ ...s, i })).filter((s) => s.kind === "Install" && (s.trade === c.trade));
      if (!pool.length) continue;
      const s = er.pick(pool);
      const close = 0.38 + (c.i % 4) * 0.07;
      const status = back <= 14 ? (er.chance(0.5) ? "Open" : er.chance(close) ? "Won" : "Lost") : back <= 30 && er.chance(0.12) ? "Open" : er.chance(close) ? "Won" : "Lost";
      estimates.push({ id: `E-${++estNo}`, date, crew: c.i, service: s.i, customer: newCustomer(), amount: Math.round(er.range(s.ticket[0], s.ticket[1]) / 10) * 10, status });
    }
  }

  /* calls and leads */
  const lr = stream("leads");
  const leads: Lead[] = [];
  let leadNo = 9100;
  for (let back = 30; back >= 0; back--) {
    const date = addDays(today, -back);
    const m = monthIndex(date);
    const n = Math.round((weekday(date) === 0 ? 3 : 9) * ((DEMAND.heat[m] + DEMAND.cool[m]) / 2 + 0.6) * lr.jitter(0.25));
    for (let k = 0; k < n; k++) {
      const afterHours = lr.chance(0.24);
      const hour = afterHours ? lr.pick([19, 20, 21, 22, 23, 5, 6]) : lr.int(7, 18);
      const source = lr.weighted(p.leadSources, (s) => s.share).name;
      const svc = lr.pick(p.services);
      const isToday = back === 0;
      const status: Lead["status"] = isToday ? (lr.chance(0.55) ? "Booked" : "Waiting") : lr.chance(0.72) ? "Booked" : lr.chance(0.4) ? "Waiting" : "Lost";
      leads.push({ id: `L-${++leadNo}`, date, time: `${((hour + 11) % 12) + 1}:${String(lr.int(0, 5) * 10).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`, source, customer: newCustomer(), need: svc.name, responseMin: afterHours ? lr.int(0, 2) : Math.round(lr.range(2, 48)), status: back > 2 && status === "Waiting" ? "Booked" : status, afterHours });
    }
  }
  const callsToday = leads.filter((l) => l.date === today).length + lr.int(6, 14); // plus existing customers calling about jobs
  const missedToday = Math.round(callsToday * lr.range(0.06, 0.12));

  /* maintenance plan members */
  const mr = stream("members");
  const members: Member[] = Array.from({ length: p.members }, (_, i) => {
    const start = addDays(today, -mr.int(20, 1400));
    let renews = start;
    while (renews <= addDays(today, -1)) renews = addDays(renews, 365);
    const tuned = (season: number[]) => {
      const d = addDays(today, -mr.int(10, 420));
      return season[monthIndex(d)] > 0.5 ? d : undefined;
    };
    return { id: `M-${3000 + i}`, customer: newCustomer(), plan: mr.weighted(p.plans.map((_, k) => k), (k) => [0.55, 0.3, 0.15][k] ?? 0.1), start, renews, lastFurnace: tuned(DEMAND.furnaceTune) ?? (mr.chance(0.5) ? addDays(today, -mr.int(30, 60)) : undefined), lastAc: tuned(DEMAND.acTune) };
  });

  /* permits and inspections for upcoming installs */
  const pr = stream("permits");
  const permits: Permit[] = jobs.filter((j) => !j.done && p.services[j.service].kind === "Install").flatMap((j, i) => [
    { id: `P-${400 + i * 2}`, job: j.id, kind: "Permit" as const, date: addDays(j.date, -pr.int(2, 6)), status: pr.chance(0.7) ? "Approved" as const : "Pending" as const },
    { id: `P-${401 + i * 2}`, job: j.id, kind: "Inspection" as const, date: addDays(j.date, pr.int(1, 5)), status: "Scheduled" as const },
  ]);

  /* weather strip (made up, but in season) */
  const wr = stream(`weather-${today}`);
  const weather = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(today, i);
    const hi = Math.round(HIGHS[monthIndex(d)] + wr.range(-8, 8));
    return { date: d, hi, lo: hi - wr.int(10, 18), sky: wr.pick(hi > 70 ? ["Sunny", "Partly cloudy", "Storms"] : hi < 40 ? ["Snow", "Cloudy", "Partly cloudy"] : ["Cloudy", "Partly cloudy", "Rain", "Sunny"]) };
  });

  return { today, monday: weekStart(today), jobs, estimates, leads, callsToday, missedToday, members, permits, weather };
}
export type ShopData = ReturnType<typeof buildShop>;
