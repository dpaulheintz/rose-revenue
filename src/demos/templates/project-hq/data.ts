// The one seeded generator for Project HQ. It reads only the prospect config,
// so a new prospect.ts reshapes everything. No real buildings, owners or
// contractors: project and building names are descriptive and invented.

import { addDays, diffDays, weekStart, type Ymd } from "@demos/kit/data/dates";
import { peopleNames, phone555 } from "@demos/kit/data/fake";
import { hash, makeRng } from "@demos/kit/data/rng";
import type { ProjectProspect } from "./types";

const NAMES: Record<string, string[]> = {
  Healthcare: ["Northfield Medical Pavilion, Phase 2", "Cedar Hill Outpatient Clinic", "Westbrook Surgery Center Expansion", "Riverside Behavioral Health Wing", "Maple Run Imaging Suite", "Southgate Dialysis Center"],
  Education: ["Maple Grove Middle School Renovation", "Elmwood Elementary HVAC Replacement", "Lakeview High Science Wing", "Prairie Ridge Library Addition", "Hillcrest Career Center Shops", "Briar Creek Field House"],
  Industrial: ["Eastpoint Distribution Center", "Southfield Cold Storage Expansion", "Brookside Food Processing, Line 3", "Harbor Lane Packaging Plant", "Ironwood Fabrication Bay", "Kingsbury Warehouse Retrofit"],
  Office: ["Riverfront Tech Campus, Building C", "Commons Office Fit-Out, Floors 2-4", "Highpoint Financial Tower, Floors 6-9", "Gateway Office Park, Building 2", "Old Mill Lofts Office Conversion", "Northline Corporate Center"],
  "Lab and research": ["Innovation Park Research Lab", "Clearwater Analytical Lab Refit", "Bluestem Clean Room Suite", "Sycamore Vivarium Upgrade"],
};
const FALLBACK = ["Central Avenue Building Renovation", "Westside Facility Upgrade", "Parkview Addition", "Union Street Retrofit"];
const CO_SCOPE = ["Added VAV boxes per revised RCP", "Relocate main duct around new beam", "Owner-requested exhaust for new lab", "Upsize chilled water branch", "Added humidifiers to AHU-2", "Extra unit heaters at loading dock", "Controls points for new zones", "Reroute sanitary per field condition", "Med gas outlets added in two rooms", "Night shift premium for occupied area", "Asbestos abatement delay, standby time", "Added split system for IT room", "Value engineering credit: duct material", "Revised piping per RFI 42", "Firestopping at new penetrations"];
const BUILDINGS = ["Harbor View Office Building", "Maplewood Senior Living", "Cedar Point Credit Union Branch", "Stonegate Medical Offices", "Brookline Elementary", "North Ridge Church", "Lakeside Apartments", "Riverbend Library", "Willow Creek Fitness Center", "Oak Street Dental Group", "Parkside Community Center", "Fairview Animal Hospital", "Granite Hill Data Room", "Sunset Ridge Clinic", "Hollow Pine Manufacturing", "Millrace Office Park", "Kestrel Lane Warehouse", "Copper Beech Middle School", "Juniper Hall Dormitory", "Summit Crossing Retail Center", "Larkspur Assisted Living", "Bluffview Hotel", "Ashford Medical Plaza", "Thornbury Lofts", "Elm Court Condominiums", "Westgate Cold Storage", "Holloway Bakery Plant", "Foxfield Veterinary", "Quarry Road Shops", "Linden Place Offices", "Silverleaf Rehab Center", "Pinecrest Bank Branch", "Meadow Lane Daycare", "Brightwater Brewery", "Ravine Park Pavilion", "Canal Street Lofts", "Prospect Hill Clinic", "Wren Hollow Townhomes", "Bramble Court Offices", "Riverstone Gym", "Cardinal Point Labs", "Tamarack Storage", "Ironbridge Machine Shop", "Hawthorn Dental", "Glenmoor Event Hall"];

export const CATEGORIES = ["Labor", "Materials", "Equipment", "Subs"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Project = {
  id: string; name: string; type: string; pm: string; gc: string; contract: number; budget: number; start: Ymd; end: Ymd; pct: number; costFactor: number;
  billed: number; retainagePct: number; split: Record<Category, number>; crews: number[];
};
export type ChangeOrder = { id: string; project: string; scope: string; amount: number; status: "Pending" | "Approved" | "Rejected"; submitted: Ymd; decided?: Ymd; ball: "Us" | "GC" | "Owner" | "Architect" };
export type PayApp = { id: string; project: string; period: string; billed: Ymd; amount: number; paid?: Ymd };
export type Worker = { id: string; name: string; crew: number; project: string | null; hours: number };
export type Agreement = { id: string; building: string; plan: "Quarterly PM" | "Semi-annual PM" | "Full coverage"; annual: number; renews: Ymd; contact: { name: string; phone: string } };
export type ServiceCall = { id: string; building: string; date: Ymd; issue: string; tech: string; status: "Done" | "Scheduled" | "Parts on order" };

export function buildProjects(p: ProjectProspect, anchor: Ymd) {
  const today = anchor;
  const seed = hash(p.slug + p.name);
  const stream = (n: string) => makeRng(seed ^ hash(n));
  const pr = stream("projects");
  const used = new Set<string>();
  const nameFor = (type: string) => {
    const pool = (NAMES[type] ?? FALLBACK).filter((n) => !used.has(n));
    const n = pool.length ? pr.pick(pool) : `${pr.pick(FALLBACK)} ${used.size + 1}`;
    used.add(n);
    return n;
  };
  const [lo, hi] = p.contractRange;
  // Cost overrun pattern: most on budget, a few at risk, a few over.
  const factors = [1.14, 1.11, 1.06, 1.05, 1.045, ...Array.from({ length: Math.max(0, p.activeProjects - 5) }, () => pr.range(0.93, 1.025))];
  const projects: Project[] = Array.from({ length: p.activeProjects }, (_, i) => {
    const type = pr.weighted(p.projectTypes, (t) => t.share).type;
    const contract = Math.round(Math.exp(pr.range(Math.log(lo), Math.log(hi))) / 1000) * 1000;
    const months = Math.round(4 + (contract / hi) * 20 * pr.range(0.7, 1.2));
    const start = addDays(today, -pr.int(20, Math.round(months * 30 * 0.92)));
    const end = addDays(start, months * 30);
    const elapsed = diffDays(today, start) / diffDays(end, start);
    const pct = Math.min(0.97, Math.max(0.04, elapsed + pr.range(-0.08, 0.06)));
    const budget = Math.round(contract * (1 - pr.range(0.11, 0.19)));
    const billVar = i % 5 === 1 ? pr.range(-0.12, -0.06) : i % 5 === 3 ? pr.range(0.05, 0.09) : pr.range(-0.03, 0.04);
    const billed = Math.round(contract * Math.min(0.98, Math.max(0, pct + billVar)));
    const lab = pr.range(0.34, 0.44), mat = pr.range(0.28, 0.36), eq = pr.range(0.06, 0.12);
    return {
      id: `P-${2400 + i * 7}`, name: nameFor(type), type, pm: p.pms[i % p.pms.length], gc: pr.pick(p.gcs), contract, budget, start, end, pct, costFactor: factors[i] ?? 1,
      billed, retainagePct: pr.chance(0.7) ? 0.05 : 0.1, split: { Labor: lab, Materials: mat, Equipment: eq, Subs: Math.max(0.05, 1 - lab - mat - eq) }, crews: [],
    };
  }).sort((a, b) => b.contract - a.contract);
  // Shuffle the overrun pattern so it isn't always the biggest jobs.
  const order = pr.shuffle(projects.map((_, i) => i));
  const f = projects.map((x) => x.costFactor);
  order.forEach((to, from) => { projects[to].costFactor = f[from]; });

  /* change orders */
  const cr = stream("changes");
  const changes: ChangeOrder[] = [];
  let coNo = 0;
  for (let k = 0; k < 40; k++) {
    const pj = projects[k % projects.length];
    const r = cr.next();
    const status: ChangeOrder["status"] = r < 0.36 ? "Pending" : r < 0.86 ? "Approved" : "Rejected";
    const submitted = addDays(today, -cr.int(3, status === "Pending" ? 64 : 200));
    const credit = cr.chance(0.08);
    changes.push({
      id: `CO-${String(++coNo).padStart(3, "0")}`, project: pj.id, scope: credit ? "Value engineering credit: duct material" : cr.pick(CO_SCOPE.filter((s) => !s.startsWith("Value"))),
      amount: Math.round((credit ? -1 : 1) * pj.contract * cr.range(0.004, 0.035) / 100) * 100, status, submitted,
      decided: status === "Pending" ? undefined : addDays(submitted, cr.int(5, 40)), ball: status === "Pending" ? cr.weighted(["Us", "GC", "Owner", "Architect"] as const, (b) => ({ Us: 0.2, GC: 0.35, Owner: 0.3, Architect: 0.15 })[b]) : "Us",
    });
  }

  /* pay applications: monthly, last 6 months, net 30 */
  const ar = stream("payapps");
  const payapps: PayApp[] = [];
  let paNo = 900;
  for (const pj of projects) {
    const periods = Math.max(1, Math.min(6, Math.round(diffDays(today, pj.start) / 30)));
    let left = pj.billed;
    for (let k = periods; k >= 1; k--) {
      const billed = addDays(`${addDays(today, -30 * k).slice(0, 8)}25`, 0);
      if (billed > today || billed < pj.start) continue;
      const amount = Math.round((k === 1 ? left : left / (k + ar.range(0.5, 1.5))) / 100) * 100;
      left -= amount;
      const age = diffDays(today, billed);
      const paid = age > 75 ? ar.chance(0.94) : age > 45 ? ar.chance(0.82) : age > 25 ? ar.chance(0.5) : false;
      payapps.push({ id: `PA-${++paNo}`, project: pj.id, period: billed.slice(0, 7), billed, amount, paid: paid ? addDays(billed, ar.int(28, Math.min(age, 62))) : undefined });
    }
  }

  /* crews and workers */
  const wr = stream("workers");
  const names = peopleNames(wr, 120);
  const workers: Worker[] = [];
  p.crews.forEach((c, ci) => {
    for (let k = 0; k < c.size; k++) workers.push({ id: `W-${workers.length + 1}`, name: names[workers.length], crew: ci, project: null, hours: 0 });
  });
  const active = projects.filter((x) => x.pct < 0.95);
  for (const w of workers) {
    if (p.crews[w.crew].name.toLowerCase().includes("service")) { w.hours = Math.round(wr.range(36, 46)); continue; }
    const pj = wr.weighted(active, (x) => x.contract * (1 - Math.abs(x.pct - 0.55)));
    w.project = pj.id;
    w.hours = Math.round(wr.range(32, 46) * 2) / 2;
    if (!pj.crews.includes(w.crew)) pj.crews.push(w.crew);
  }

  /* 6-week manpower forecast: who each project needs vs. who we have */
  const fr = stream("forecast");
  const monday = weekStart(today);
  const field = workers.filter((w) => w.project).length;
  const forecast = Array.from({ length: 6 }, (_, i) => {
    const wk = addDays(monday, 7 * (i + 1));
    const need = Math.round(field * ([0.92, 1.1, 0.9, 1.16, 0.94, 0.86][i] ?? 1) + fr.int(-1, 1));
    const out = fr.int(0, 2); // vacation, training
    return { week: wk, need, have: field - out };
  });

  /* service agreements and calls */
  const sr = stream("service");
  const contacts = peopleNames(sr, 60);
  const agreements: Agreement[] = Array.from({ length: p.serviceAgreements }, (_, i) => {
    const plan = sr.pick(["Quarterly PM", "Quarterly PM", "Semi-annual PM", "Full coverage"] as const);
    return { id: `SA-${300 + i}`, building: BUILDINGS[i % BUILDINGS.length], plan, annual: Math.round(sr.range(plan === "Full coverage" ? 18000 : 4000, plan === "Full coverage" ? 62000 : 22000) / 100) * 100, renews: addDays(today, sr.int(-20, 345)), contact: { name: contacts[i], phone: phone555(sr, "614") } };
  });
  for (const a of agreements) while (a.renews < today) a.renews = addDays(a.renews, 365);
  const techs = workers.filter((w) => p.crews[w.crew].name.toLowerCase().includes("service"));
  const calls: ServiceCall[] = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(monday, sr.int(0, 5));
    return { id: `SC-${7100 + i}`, building: sr.pick(agreements).building, date, issue: sr.pick(["No heat in east wing", "RTU-3 tripping on high pressure", "Boiler lockout", "Leak above ceiling, room 204", "Quarterly PM", "Chiller alarm", "Water heater not recovering", "Exhaust fan noise", "BAS not responding"]), tech: techs.length ? sr.pick(techs).name : "Service tech", status: date < today ? (sr.chance(0.8) ? "Done" : "Parts on order") : "Scheduled" };
  });

  return { today, monday, projects, changes, payapps, workers, forecast, agreements, calls };
}
export type ProjData = ReturnType<typeof buildProjects>;
