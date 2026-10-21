// Contractor ("shop") demo model: the seed a shop config supplies and the
// dataset the generator builds from it. Nothing here names a real company.
//
// Money rules the generator guarantees:
// - a job's contract = its approved estimate option total; invoices on a
//   finished job add up to contract + approved change orders
// - payments never exceed an invoice
// - job actuals = sum of its POs + receipts (materials), sub bills (subs)
//   and timesheet hours × each worker's cost rate (labor)

import type { Ymd } from "../dates";

/* -------------------------------- seed -------------------------------- */

export type CrewId = "remodel" | "mech" | "service";
export type Group = "Remodel" | "Mechanical" | "Service";

export type Worker = { id: string; name: string; role: string; crew: CrewId; cost: number; rate: number; phone: string };
export type Crew = { id: CrewId; name: string; color: string; lead: string };

export type JobTypeSeed = {
  key: string;
  label: string;
  group: Group;
  crew: CrewId;
  perYear: number;
  price: [number, number]; // target contract range
  hours: [number, number]; // crew labor hours
  mechHours?: [number, number]; // rough-in hours from the mechanical crew on remodels
  mat: number; // share of price that is materials (at sell price)
  sub: number; // share that is subcontracted (at sell price)
  season: number[]; // Jan..Dec demand
  permits: Array<"Building" | "Plumbing" | "Mechanical" | "Electrical">;
  big: boolean; // deposit + progress billing, good/better/best
  titles: string[];
  materials: string[]; // estimate material line names
  subs: string[]; // sub trades used (keys into seed.subs trade)
  labor: string[]; // labor line names
};

export type SubSeed = { id: string; name: string; trade: string; contact: string };
export type SupplierSeed = { id: string; name: string; kind: string };
export type InspectorSeed = { id: string; name: string; town: string };

export type ShopSeed = {
  workers: Worker[];
  crews: Crew[];
  jobTypes: JobTypeSeed[];
  subs: SubSeed[];
  suppliers: SupplierSeed[];
  inspectors: InspectorSeed[];
  towns: string[];
  streets: string[];
  names: { first: string[]; last: string[] };
  companies: { pm: string[]; builder: string[] };
  markup: { materials: number; subs: number };
  taxRate: number; // on materials
  sources: Array<{ name: LeadSource; share: number }>;
  coIdeas: Record<string, string[]>; // change-order titles by job type
  callbackIssues: Record<string, string[]>;
  notes: string[];
};

/* ------------------------------- dataset ------------------------------ */

export type LeadSource = "Referral" | "Google" | "Instagram" | "Repeat";
export type CustomerKind = "Homeowner" | "Property manager" | "Builder";

export type Property = { id: string; address: string; town: string };
export type Customer = {
  id: string;
  kind: CustomerKind;
  name: string; // person (homeowner) or company
  contact: string; // person to call
  phone: string;
  email: string;
  properties: Property[];
  since: Ymd;
  source: LeadSource;
  priorSpend: number; // before the 12-month window
  note: string | null;
};

export type LineKind = "Labor" | "Materials" | "Subcontractor";
export type LineItem = { kind: LineKind; desc: string; qty: number; unit: string; price: number; cost: number }; // per unit
export type EstimateOption = { name: string; lines: LineItem[] };
export type EstimateStatus = "Draft" | "Sent" | "Viewed" | "Approved" | "Declined" | "Expired";
export type Estimate = {
  id: string;
  no: string;
  customer: string;
  property: string;
  type: string;
  title: string;
  created: Ymd;
  sent: Ymd | null;
  viewed: Ymd | null;
  decided: Ymd | null;
  status: EstimateStatus;
  options: EstimateOption[];
  chosen: number;
  depositPct: number;
  job: string | null;
  source: LeadSource;
};

export type JobStatus = "Scheduled" | "In progress" | "Complete" | "Paid";
export type Job = {
  id: string;
  no: string;
  type: string;
  group: Group;
  customer: string;
  property: string;
  crew: CrewId;
  title: string;
  scope: string;
  sold: Ymd;
  start: Ymd;
  end: Ymd; // planned / actual finish
  days: Ymd[]; // workdays the crew is on site
  startTime: string; // "7:30"
  estimate: string | null;
  contract: number;
  lines: LineItem[]; // what the customer is billed for (chosen estimate option, or the service ticket)
  budget: { materials: number; laborHours: number; laborCost: number; subs: number };
  status: JobStatus;
};

export type ChangeOrder = { id: string; no: string; job: string; title: string; amount: number; cost: number; created: Ymd; status: "Approved" | "Awaiting signature" | "Declined"; signed: Ymd | null };

export type InvoiceKind = "Deposit" | "Progress" | "Final" | "Service";
export type Invoice = { id: string; no: string; job: string; customer: string; kind: InvoiceKind; issued: Ymd; due: Ymd; amount: number; viewed: boolean; draft: boolean };
export type PayMethod = "Card" | "Check" | "ACH" | "Cash";
export type Payment = { id: string; invoice: string; date: Ymd; amount: number; method: PayMethod; ref: string };

export type TimeEntry = { worker: string; date: Ymd; job: string | null; hours: number }; // job null = shop / drive / estimates

export type PurchaseOrder = { id: string; no: string; job: string; supplier: string; date: Ymd; amount: number; status: "Ordered" | "Delivered" | "Billed"; items: string };
export type Receipt = { id: string; job: string; supplier: string; date: Ymd; amount: number; note: string; by: string };
export type SubBill = { id: string; job: string; sub: string; date: Ymd; amount: number; paid: boolean; work: string };

export type Inspection = { kind: string; date: Ymd; inspector: string; result: "Passed" | "Failed" | "Scheduled"; note: string | null };
export type Permit = { id: string; no: string; job: string; kind: string; town: string; applied: Ymd; issued: Ymd | null; inspections: Inspection[] };

export type PhotoTag = "Before" | "During" | "After";
export type Photo = { id: string; job: string; tag: PhotoTag; caption: string; date: Ymd; by: string };
export type Note = { id: string; job: string; date: Ymd; by: string; text: string };

export type Callback = { id: string; job: string; customer: string; opened: Ymd; issue: string; status: "Open" | "Scheduled" | "Resolved"; visit: Ymd | null; tech: string; cost: number };

export type LeadStage = "New" | "Contacted" | "Estimate sent" | "Won" | "Lost";
export type Lead = { id: string; name: string; customer: string | null; town: string; type: string; value: number; source: LeadSource; stage: LeadStage; created: Ymd; followUp: Ymd | null; estimate: string | null; note: string };

export type Weather = { date: Ymd; hi: number; lo: number; sky: "Sunny" | "Partly cloudy" | "Cloudy" | "Showers" | "Rain"; rain: number };

export type ShopData = {
  anchor: Ymd;
  windowStart: Ymd; // first day of the 12 reported months
  months: string[]; // 12 complete months, oldest first
  weeks: Ymd[]; // 13 completed Monday weeks
  horizon: Ymd; // last scheduled day (anchor + 6 weeks)
  customers: Customer[];
  estimates: Estimate[];
  jobs: Job[];
  changeOrders: ChangeOrder[];
  invoices: Invoice[];
  payments: Payment[];
  time: TimeEntry[]; // actual, through yesterday
  schedule: TimeEntry[]; // planned, today onward
  pos: PurchaseOrder[];
  receipts: Receipt[];
  subBills: SubBill[];
  permits: Permit[];
  photos: Photo[];
  notes: Note[];
  callbacks: Callback[];
  leads: Lead[];
  weather: Weather[];
};
