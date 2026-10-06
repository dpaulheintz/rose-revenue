// Farm demo model: the seed a farm config supplies, and the dataset the
// generator simulates from it. Farm-agnostic: nothing here names a farm.

import type { Ymd } from "../dates";

/* ------------------------------- seed ------------------------------- */

export type Enterprise = "dairy" | "beef" | "pork" | "lamb" | "poultry" | "eggs" | "bakery" | "partner" | "events";

/** Where a SKU's stock comes from. Drives the supply side of the simulation. */
export type Source =
  | "beef" | "pork" | "lamb" | "broiler" | "turkey" | "eggs" | "cheese" | "butter" | "milk" | "cream"
  | "bakery" | "broth" | "partner" | "tickets" | "bundle";

export type SkuSeed = {
  id: string;
  name: string;
  category: string;
  enterprise: Enterprise;
  source: Source;
  unit: string; // what one unit is, e.g. "pkg, ~0.9 lb"
  price: number; // retail, per unit
  perLb?: number; // shelf price per lb, for display
  lbs: number; // average weight per unit (pack weights, cold packs)
  pop: number; // relative demand
  season?: number[]; // demand multiplier Jan..Dec
  par: number; // target on-hand units
  frozen?: boolean;
  herdshareOnly?: boolean;
  wholesale?: boolean;
  yieldPer?: number; // units per animal / per bird processed
  components?: Record<string, number>; // bundles
};

export type Person = { id: string; name: string; role: string; phone?: string };

export type Zone = { id: string; name: string; day: number; driver: string; miles: number };
export type PickupSite = { id: string; name: string; town: string; day: number; host: string };

export type WholesaleSeed = {
  id: string;
  name: string;
  type: "Retail store" | "Restaurant" | "Café" | "Market";
  town: string;
  contact: string;
  day: number; // delivery weekday
  every: 1 | 2; // weeks
  since: number; // months before today the account opened (negative = before window)
  standing: Record<string, number>; // sku -> qty per delivery
  lapsedDaysAgo?: number;
};

export type PaddockSeed = { id: string; name: string; use: "rotation" | "stockpile" | "hay" };

export type EquipmentSeed = {
  id: string;
  name: string;
  group: string;
  every: number; // service interval, days
  task: string; // routine service
  cost: number; // typical service cost
};

export type BoardSeed = {
  id: string;
  name: string;
  items: Array<{ name: string; owner: string; status: TaskStatus; priority: Priority; start: number; due: number }>;
};

export type TaskStatus = "Not started" | "Working on it" | "Stuck" | "Done";
export type Priority = "Low" | "Medium" | "High";

export type FarmSeed = {
  acres: number;
  established: number; // year
  chemicalFreeSince: number;
  people: Person[];
  vet: Person;
  processor: Person;
  lab: Person;
  skus: SkuSeed[];
  zones: Zone[];
  sites: PickupSite[];
  wholesale: WholesaleSeed[];
  paddocks: PaddockSeed[];
  cowNames: string[];
  breeds: Array<{ name: string; share: number }>;
  equipment: EquipmentSeed[];
  repairs: Array<{ equipment: string; title: string; cost: number }>;
  boards: BoardSeed[];
  chores: Array<{ time: string; task: string; owner: string; area: string }>;
  names: { first: string[]; last: string[] };
  towns: { delivery: Record<string, string[]>; pickup: Record<string, string[]> };
  notes: string[];
  tools: Array<{ name: string; what: string; mode: string; minutesAgo: number }>;
  herdshare: { pricePerGallon: number; shareFee: number };
};

/* ------------------------------ dataset ----------------------------- */

export type Channel = "delivery" | "pickup" | "store" | "wholesale" | "herdshare" | "events";

export type Line = { sku: string; qty: number; price: number };

export type Order = {
  id: string;
  no: number;
  date: Ymd; // fulfilment date
  channel: Channel;
  customer: string | null; // customer id (null = farm-store walk-in)
  account: string | null; // wholesale account id
  where: string; // zone / site id, "store", or account town
  lines: Line[];
  total: number;
  open: boolean; // today or later: still to pack / deliver
};

export type Customer = {
  id: string;
  first: string;
  last: string;
  name: string;
  email: string;
  phone: string;
  town: string;
  channel: "delivery" | "pickup";
  where: string; // zone or site id
  joined: Ymd;
  cadence: number; // typical days between orders
  stoppedOn: Ymd | null;
  priorSpend: number; // spend before the simulated window
  note: string | null;
  herdshare: HerdshareInfo | null;
};

export type HerdshareInfo = {
  shares: number;
  gallons: number; // per week
  since: Ymd;
  renews: Ymd;
  agreement: boolean;
  fee: "Paid" | "Due" | "Past due";
  site: string;
};

export type Account = WholesaleSeed & { opened: Ymd; stoppedOn: Ymd | null; phone: string; email: string };

export type Visit = { id: string; account: string; date: Ymd; by: string; kind: "Delivery" | "Visit" | "Call" | "Tasting"; note: string };

export type Cow = {
  id: string;
  tag: string;
  name: string;
  breed: string;
  born: Ymd;
  lactation: number;
  calvings: Ymd[]; // within / around the window
  nextDue: Ymd;
  status: "Milking" | "Dry";
  dim: number | null; // days in milk at anchor
  peak: number; // gallons/day at peak
  bred: Ymd | null;
  pregCheck: "Confirmed" | "Pending" | "Open";
  dip: boolean; // recent milk drop (health watch)
  avg7: number; // gallons/day, last 7 days
  avgPrev: number; // gallons/day, the 7 days before that
};

export type Steer = { id: string; tag: string; born: Ymd; kill: Ymd; back: Ymd; hanging: number; lot: string };
export type Batch = { id: string; kind: "beef" | "pork" | "lamb" | "broiler"; lot: string; kill: Ymd; back: Ymd; head: number; animals: string[]; yields: Record<string, number> };
export type BroilerBatch = { id: string; no: number; arrived: Ymd; processing: Ymd; chicks: number; alive: number; lot: string; avgLb: number };
export type Flock = { id: string; name: string; coop: string; hatched: Ymd; hens: number; layingFrom: Ymd };

export type MilkDay = { date: Ymd; gallons: number; herdshare: number; extras: number; calves: number; cheese: number; butter: number; other: number };
export type EggDay = { date: Ymd; byFlock: number[]; eggs: number; dozensSold: number; dozensCulled: number };

export type CheeseMake = { id: string; lot: string; date: Ymd; kind: string; sku: string; gallons: number; lbs: number; blocks: number; ready: Ymd };
export type ButterMake = { date: Ymd; gallons: number; units: number };
export type Bake = { date: Ymd; loaves: Record<string, number> };
export type MilkTest = { week: Ymd; spc: number; coliform: number; scc: number; pass: boolean; note: string | null };

export type TurkeyPreorder = { id: string; customer: string; size: "Small (12–15 lb)" | "Medium (16–19 lb)" | "Large (20–24 lb)"; placed: Ymd; deposit: number; pickup: Ymd };

export type Paddock = PaddockSeed & { acres: number; poly: Array<[number, number]>; center: [number, number] };

export type EquipmentItem = EquipmentSeed & { lastService: Ymd; nextDue: Ymd; log: Array<{ date: Ymd; title: string; cost: number; by: string }> };

export type Task = { id: string; board: string; name: string; owner: string; status: TaskStatus; priority: Priority; start: Ymd; due: Ymd };

export type Weather = { date: Ymd; hi: number; lo: number; sky: "Sunny" | "Partly cloudy" | "Cloudy" | "Showers" | "Rain"; rain: number };

export type Stockout = { sku: string; date: Ymd; customer: string | null };

export type FarmData = {
  anchor: Ymd;
  simStart: Ymd;
  windowStart: Ymd; // first day of the 12 reported months
  months: string[]; // 12 complete months, oldest first
  weeks: Ymd[]; // 13 completed Monday-start weeks, oldest first
  orders: Order[]; // window + open, sorted by date
  customers: Customer[];
  accounts: Account[];
  visits: Visit[];
  stock: Record<string, number>; // on hand at end of yesterday
  committed: Record<string, number>; // in open orders
  supplied: Record<string, number>; // units added in the window (by sku)
  stockouts: Stockout[]; // last 45 days
  cows: Cow[];
  heifers: { bred: number; yearlings: number; calves: number };
  steers: Steer[]; // processed in window + scheduled
  hogs: { sows: number; boar: number; growers: number };
  sheep: { ewes: number; rams: number; lambs: number };
  batches: Batch[];
  broilers: BroilerBatch[];
  flocks: Flock[];
  milk: MilkDay[]; // window
  eggs: EggDay[]; // window
  cheese: CheeseMake[];
  butter: ButterMake[];
  bakes: Bake[];
  tests: MilkTest[];
  turkeys: { allocation: number; preorders: TurkeyPreorder[]; processing: Ymd; pickup: Ymd };
  paddocks: Paddock[];
  farmstead: Array<[number, number]>;
  rotation: { order: string[]; days: Record<string, number>; cycle: number; position: number };
  equipment: EquipmentItem[];
  tasks: Task[];
  weather: Weather[];
  events: Array<{ date: Ymd; name: string; visitors: number }>;
};
