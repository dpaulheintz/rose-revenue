// The one seeded generator for Atwood Door Company. Anchored to "today" and
// rebuilt the same on server and client. Every customer, job and number is invented.

import { addDays, diffDays, monthIndex, weekday, type Ymd } from "@demos/kit/data/dates";
import { emailFor, peopleNames, phone555 } from "@demos/kit/data/fake";
import { hash, makeRng } from "@demos/kit/data/rng";

export const JOB_TYPES = [
  { key: "repair", label: "Repair", price: [150, 340], hours: 1, share: 0.27 },
  { key: "spring", label: "Spring replacement", price: [260, 440], hours: 1.2, share: 0.24 },
  { key: "opener", label: "Opener install", price: [480, 760], hours: 2, share: 0.15 },
  { key: "door", label: "New door install", price: [1900, 4600], hours: 5, share: 0.08 },
  { key: "commercial", label: "Commercial service", price: [320, 980], hours: 2.5, share: 0.08 },
  { key: "tuneup", label: "Tune-up", price: [99, 129], hours: 0.75, share: 0.18 },
] as const;
export type JobType = (typeof JOB_TYPES)[number]["key"];
export const jobType = (k: JobType) => JOB_TYPES.find((t) => t.key === k)!;
/** Busy in spring and before winter. Jan = 0. */
const SEASON = [0.62, 0.7, 1.05, 1.3, 1.25, 0.95, 0.85, 0.85, 0.95, 1.25, 1.35, 0.9];

export const PARTS: Array<{ id: string; name: string; group: string; cost: number; min: number }> = [
  ...[".218 × 2 × 30", ".225 × 2 × 32", ".234 × 2 × 34", ".243 × 2 × 34", ".250 × 2 × 36", ".262 × 2 × 36", ".273 × 2 × 38", ".283 × 2 × 40"].map((s, i) => ({ id: `ts${i}`, name: `Torsion spring ${s}`, group: "Springs", cost: 38 + i * 4, min: 2 })),
  ...["90 lb", "110 lb", "130 lb", "150 lb"].map((s, i) => ({ id: `es${i}`, name: `Extension spring pair, ${s}`, group: "Springs", cost: 24 + i * 3, min: 1 })),
  { id: "rn", name: "Nylon rollers, 10-pack", group: "Rollers", cost: 42, min: 3 }, { id: "rs", name: "Steel rollers, 10-pack", group: "Rollers", cost: 22, min: 2 }, { id: "rc", name: "Commercial rollers, 3 in", group: "Rollers", cost: 9, min: 6 },
  { id: "c8", name: "Lift cables, 8 ft pair", group: "Cables", cost: 14, min: 3 }, { id: "c10", name: "Lift cables, 10 ft pair", group: "Cables", cost: 18, min: 2 }, { id: "c14", name: "Lift cables, 14 ft pair (commercial)", group: "Cables", cost: 26, min: 1 },
  { id: "dr", name: "Cable drums, pair", group: "Hardware", cost: 28, min: 2 }, { id: "bb", name: "Center bearing plate", group: "Hardware", cost: 12, min: 2 }, { id: "hg", name: "Hinges, assorted", group: "Hardware", cost: 4, min: 12 },
  { id: "sh", name: "Torsion shaft, 1 in × 16 ft", group: "Hardware", cost: 54, min: 1 }, { id: "wn", name: "Winding cones, pair", group: "Hardware", cost: 16, min: 2 }, { id: "tb", name: "Top brackets, pair", group: "Hardware", cost: 18, min: 2 },
  { id: "o1", name: "Belt-drive opener, 1/2 HP, Wi-Fi", group: "Openers", cost: 248, min: 2 }, { id: "o2", name: "Chain-drive opener, 1/2 HP", group: "Openers", cost: 168, min: 1 }, { id: "o3", name: "Wall-mount (jackshaft) opener", group: "Openers", cost: 389, min: 1 },
  { id: "o4", name: "Commercial operator, 1/2 HP trolley", group: "Openers", cost: 612, min: 0 },
  { id: "r1", name: "Remote, 3-button", group: "Remotes & keypads", cost: 26, min: 4 }, { id: "r2", name: "Remote, 1-button visor", group: "Remotes & keypads", cost: 18, min: 3 }, { id: "r3", name: "Universal remote", group: "Remotes & keypads", cost: 22, min: 3 },
  { id: "k1", name: "Wireless keypad", group: "Remotes & keypads", cost: 34, min: 3 }, { id: "k2", name: "Wall control, multi-function", group: "Remotes & keypads", cost: 28, min: 2 },
  { id: "ss", name: "Safety sensor pair", group: "Openers", cost: 36, min: 2 }, { id: "rr", name: "Opener rail extension, 8 ft door", group: "Openers", cost: 44, min: 1 },
  { id: "bs", name: "Bottom seal, 16 ft", group: "Seals", cost: 24, min: 3 }, { id: "bs9", name: "Bottom seal, 9 ft", group: "Seals", cost: 15, min: 3 }, { id: "ws", name: "Weather stop, 16 ft kit", group: "Seals", cost: 48, min: 1 },
  { id: "rt", name: "Bottom retainer, aluminum", group: "Seals", cost: 32, min: 1 }, { id: "lb", name: "Garage door lubricant", group: "Supplies", cost: 9, min: 3 }, { id: "an", name: "Lag screws and anchors", group: "Supplies", cost: 12, min: 2 },
  { id: "tp", name: "Track, 7 ft section", group: "Hardware", cost: 38, min: 1 }, { id: "sb", name: "Strut, 16 ft", group: "Hardware", cost: 22, min: 1 }, { id: "lk", name: "Side lock", group: "Hardware", cost: 14, min: 1 },
];
const partsFor: Record<JobType, Array<[string[], number]>> = {
  repair: [[["rn", "rs"], 1], [["c8", "c10"], 1], [["hg"], 3], [["bs", "bs9"], 1]],
  spring: [[["ts0", "ts1", "ts2", "ts3", "ts4", "ts5"], 2], [["lb"], 1]],
  opener: [[["o1", "o2", "o3"], 1], [["ss"], 1], [["r1"], 1], [["k1"], 1]],
  door: [[["o1"], 1], [["k1"], 1], [["an"], 1], [["bs"], 1]],
  commercial: [[["rc"], 6], [["c14"], 1], [["ts6", "ts7"], 2]],
  tuneup: [[["lb"], 1]],
};

const STREETS = ["Hickory Bend Dr", "Quail Run Ct", "Millstone Ln", "Copper Ridge Rd", "Bramblewood Ave", "Fox Meadow Dr", "Larch Hollow Ct", "Thornapple Way", "Sycamore Glen Dr", "Pheasant Run Rd", "Kestrel Ln", "Blue Spruce Ct", "Old Furnace Rd", "Wren Hollow Dr", "Cedar Knoll Ct", "Barnswallow Ln", "Elm Shadow Dr", "Gristmill Ct", "Prairie Crest Rd", "Hawthorn Bluff Dr"];
const TOWNS = ["Carroll", "Canal Winchester", "Pickerington", "Lancaster", "Baltimore", "Lithopolis", "Groveport", "Reynoldsburg", "Columbus", "Brice", "Millersport", "Pataskala", "Etna", "Bexley"];
const BIZ = ["Ridgeview Storage Units", "Lancaster Tire & Lube", "Twin Creek Auto Body", "Fairfield Feed & Supply", "Hilltop Self Storage", "Canal Street Fire Hall", "Pine Hollow Landscaping", "Carroll Community Church", "Blue Barn Machine", "Southside Truck Repair", "Oakmont Apartments", "Westgate Hardware", "Mill Run Brewing", "Lithopolis Village Garage", "Riverbend Marina", "Fox Run HOA", "Copper Kettle Bakery", "Brook Valley Farms", "Groveport Equipment Rental", "Little Walnut Vet Clinic"];
const SIZES = ["16 × 7", "16 × 7", "16 × 7", "8 × 7", "9 × 7", "9 × 7", "16 × 8", "18 × 7"];
const MODELS = ["Steel raised panel, insulated", "Steel carriage house, insulated", "Steel flush panel, non-insulated", "Steel long panel with windows", "Wood-look steel carriage, insulated", "Aluminum and glass, full view"];
const OPENERS = ["1/2 HP belt drive, Wi-Fi", "1/2 HP chain drive", "3/4 HP belt drive with battery backup", "Wall-mount jackshaft", "None (manual)"];
const COLORS = ["White", "Almond", "Sandstone", "Desert tan", "Brown", "Black"];

export type Door = { size: string; model: string; opener: string; springs: string; installed: Ymd; warrantyEnd: Ymd; color: string; windows: boolean; photos: number };
export type Customer = { id: string; name: string; commercial: boolean; street: string; town: string; phone: string; email: string; contact: string; door: Door; since: Ymd; notes: string };
export type Invoice = { id: string; amount: number; issued: Ymd; due: Ymd; paid?: Ymd; method?: "Card" | "Cash" | "Check" };
export type Job = {
  id: string; customer: string; date: Ymd; time: string; type: JobType; price: number; done: boolean; parts: Array<{ part: string; qty: number }>; notes: string; photos: number; miles: number;
  invoice?: Invoice; review?: { asked: Ymd; rating?: number; on?: Ymd };
};
export type Option = { tier: "Good" | "Better" | "Best"; model: string; price: number; insulated: string; warranty: string };
export type Estimate = { id: string; customer: string; date: Ymd; title: string; options: Option[]; chosen?: number; status: "Sent" | "Viewed" | "Approved" | "Declined"; deposit: number };
export type Expense = { id: string; date: Ymd; category: string; amount: number; note: string; receipt: boolean };

export const EXPENSE_CATS = ["Parts and supplies", "Fuel", "Truck payment and repairs", "Insurance", "Phone and software", "Tools", "Advertising"];
export const MILE_RATE = 0.7; // dollars per business mile (deduction estimate)
export const REVIEW_LINK = "g.page/r/atwood-door-co/review (placeholder)";

const isWorkday = (d: Ymd) => weekday(d) !== 0;
const times = ["8:00", "9:30", "11:00", "12:30", "2:00", "3:30"];

export function buildAtwood(anchor: Ymd) {
  const today = anchor;
  const seed = hash("atwood-door");
  const stream = (n: string) => makeRng(seed ^ hash(n));

  /* customers */
  const cr = stream("customers");
  const names = peopleNames(cr, 240);
  const customers: Customer[] = [];
  for (let i = 0; i < 220; i++) {
    const commercial = i % 11 === 5;
    const contact = names[i];
    const name = commercial ? BIZ[Math.floor(i / 11) % BIZ.length] : contact;
    const installed = addDays(today, -cr.int(200, 6200));
    const size = commercial ? cr.pick(["10 × 10", "12 × 12", "12 × 14", "14 × 14"]) : cr.pick(SIZES);
    customers.push({
      id: `c${i + 1}`, name, commercial, street: `${cr.int(12, 980)} ${cr.pick(STREETS)}`, town: cr.pick(TOWNS), phone: phone555(cr, cr.pick(["614", "740", "380"])), email: emailFor(contact), contact,
      door: {
        size, model: commercial ? cr.pick(["Steel sectional, 2 in insulated", "Rolling steel, 24 gauge"]) : cr.pick(MODELS), opener: commercial ? "1/2 HP trolley operator" : cr.pick(OPENERS),
        springs: commercial ? "Torsion, 2 springs, 25,000 cycle" : cr.chance(0.82) ? (cr.chance(0.6) ? "Torsion, 2 springs" : "Torsion, 1 spring") : "Extension, with safety cables",
        installed, warrantyEnd: addDays(installed, 365 * cr.pick([1, 3, 5, 10])), color: cr.pick(COLORS), windows: cr.chance(0.4), photos: cr.int(1, 4),
      },
      since: addDays(today, -cr.int(30, 2600)), notes: cr.pick(["Dog in the back yard. Knock first.", "Prefers texts over calls.", "Code for the side door is in the job notes.", "Wants a heads-up 30 minutes out.", "Pays by check.", "Second door on the back of the garage.", "Ask about an opener upgrade next visit."]),
    });
  }

  /* jobs: ~12 months back, ~2 weeks ahead */
  const jr = stream("jobs");
  const jobs: Job[] = [];
  let jobNo = 3200, invNo = 7400;
  const pickType = () => jr.weighted(JOB_TYPES, (t) => t.share).key as JobType;
  const pickParts = (t: JobType) => partsFor[t].filter(() => jr.chance(0.75)).map(([opts, qty]) => ({ part: jr.pick(opts), qty }));
  for (let back = 364; back >= -14; back--) {
    const date = addDays(today, -back);
    if (!isWorkday(date)) continue;
    const future = back < 0;
    const isToday = back === 0;
    const n = isToday ? 5 : future ? (back > -4 ? jr.int(2, 4) : jr.int(0, 2)) : Math.max(0, Math.round(1.55 * SEASON[monthIndex(date)] * jr.jitter(0.45) - (weekday(date) === 6 ? 1 : 0)));
    for (let k = 0; k < Math.min(n, times.length); k++) {
      const type = pickType();
      const t = jobType(type);
      const c = type === "commercial" ? jr.pick(customers.filter((x) => x.commercial)) : jr.pick(customers.filter((x) => !x.commercial));
      const price = Math.round(jr.range(t.price[0], t.price[1]) / 5) * 5;
      const done = !future && !isToday;
      const j: Job = {
        id: `J-${++jobNo}`, customer: c.id, date, time: times[k], type, price, done, parts: pickParts(type), photos: jr.int(1, 4), miles: jr.int(6, 34),
        notes: jr.pick(["Door was off track on the left side.", "Customer wants a quote on a new door next spring.", "Lubed and balanced, all good.", "Replaced both springs to match.", "Programmed two remotes and the keypad.", "Old opener was 20 years old.", "Bottom seal was torn.", "Cable frayed on the right drum."]),
      };
      if (done) {
        const age = diffDays(today, date);
        const r = jr.next();
        const paid = age > 40 ? r < 0.985 : age > 12 ? r < 0.94 : r < 0.8;
        j.invoice = { id: `INV-${++invNo}`, amount: price, issued: date, due: addDays(date, type === "commercial" ? 30 : 14), paid: paid ? addDays(date, type === "commercial" ? jr.int(5, 28) : jr.int(0, 6)) : undefined, method: jr.pick(["Card", "Card", "Card", "Check", "Cash"]) };
        if (j.invoice.paid && j.invoice.paid > today) j.invoice.paid = undefined;
        if (j.invoice.paid && jr.chance(0.72)) {
          const asked = j.invoice.paid;
          const reviewed = jr.chance(0.46);
          j.review = { asked, rating: reviewed ? (jr.chance(0.86) ? 5 : 4) : undefined, on: reviewed ? addDays(asked, jr.int(0, 5)) : undefined };
          if (j.review.on && j.review.on > today) j.review = { asked };
        }
      }
      jobs.push(j);
    }
  }
  // Today's route: five stops in order.
  const todays = jobs.filter((j) => j.date === today);
  todays.forEach((j, i) => { j.time = times[i]; });

  /* last service per customer */
  const lastService = new Map<string, Ymd>();
  for (const j of jobs) if (j.done) lastService.set(j.customer, j.date);
  // Customers with no job in the window were last seen 13-26 months ago (tune-up candidates).
  for (const c of customers) if (!lastService.has(c.id)) lastService.set(c.id, addDays(today, -cr.int(370, 790)));

  /* estimates waiting on an answer, plus a few decided */
  const er = stream("estimates");
  const estimates: Estimate[] = Array.from({ length: 11 }, (_, i) => {
    const c = er.pick(customers.filter((x) => !x.commercial));
    const base = er.range(1700, 2400);
    const status: Estimate["status"] = i < 4 ? "Sent" : i < 7 ? "Viewed" : i < 9 ? "Approved" : "Declined";
    return {
      id: `E-${640 + i}`, customer: c.id, date: addDays(today, -er.int(1, status === "Sent" ? 6 : 20)), title: `New ${c.door.size} garage door${er.chance(0.5) ? " and opener" : ""}`, status, deposit: 0.3, chosen: status === "Approved" ? er.int(1, 2) : undefined,
      options: [
        { tier: "Good", model: "Steel raised panel, non-insulated", price: Math.round(base / 10) * 10, insulated: "No", warranty: "Limited lifetime door, 1-year labor" },
        { tier: "Better", model: "Steel raised panel, insulated R-12", price: Math.round((base * 1.35) / 10) * 10, insulated: "R-12", warranty: "Limited lifetime door, 2-year labor" },
        { tier: "Best", model: "Carriage house, insulated R-18, windows", price: Math.round((base * 1.9) / 10) * 10, insulated: "R-18", warranty: "Limited lifetime door, 5-year labor" },
      ],
    };
  });

  /* expenses */
  const xr = stream("expenses");
  const expenses: Expense[] = [];
  let exNo = 0;
  for (let back = 364; back >= 0; back -= 7) {
    const d = addDays(today, -back);
    const busy = SEASON[monthIndex(d)];
    expenses.push({ id: `x${++exNo}`, date: d, category: "Fuel", amount: Math.round(xr.range(70, 120) * busy), note: "Fuel", receipt: xr.chance(0.8) });
    expenses.push({ id: `x${++exNo}`, date: addDays(d, 1), category: "Parts and supplies", amount: Math.round(xr.range(820, 1380) * busy), note: xr.pick(["Spring supply order", "Rollers and cables", "Openers (2)", "Remotes and keypads"]), receipt: true });
    if (back % 28 < 7) {
      expenses.push({ id: `x${++exNo}`, date: addDays(d, 2), category: "Truck payment and repairs", amount: 612 + (xr.chance(0.25) ? xr.int(90, 640) : 0), note: "Truck payment", receipt: true });
      expenses.push({ id: `x${++exNo}`, date: addDays(d, 2), category: "Insurance", amount: 214, note: "Liability and truck", receipt: true });
      expenses.push({ id: `x${++exNo}`, date: addDays(d, 3), category: "Phone and software", amount: 96, note: "Phone and invoicing", receipt: true });
      expenses.push({ id: `x${++exNo}`, date: addDays(d, 4), category: "Advertising", amount: xr.int(60, 220), note: "Local ads", receipt: xr.chance(0.6) });
      if (xr.chance(0.4)) expenses.push({ id: `x${++exNo}`, date: addDays(d, 5), category: "Tools", amount: xr.int(40, 380), note: xr.pick(["Winding bars", "Impact driver", "Ladder", "Spring gauge"]), receipt: true });
    }
  }
  const exps = expenses.filter((e) => e.date <= today);

  /* truck stock, set from what jobs use */
  const sr = stream("stock");
  const used = new Map<string, number>();
  for (const j of jobs.filter((x) => x.done && diffDays(today, x.date) <= 30)) for (const p of j.parts) used.set(p.part, (used.get(p.part) ?? 0) + p.qty);
  const stock = PARTS.map((p) => ({ ...p, onTruck: ["ts3", "rn", "k1", "c8"].includes(p.id) ? Math.max(0, p.min - sr.int(1, 2)) : p.min + sr.int(0, 5) + Math.round((used.get(p.id) ?? 0) / 4) }));

  return { today, customers, jobs, estimates, expenses: exps, stock, lastService, seq: { job: jobNo, inv: invNo } };
}
export type AtData = ReturnType<typeof buildAtwood>;
