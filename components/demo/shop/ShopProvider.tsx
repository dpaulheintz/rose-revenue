"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getDemo, getShopSeed } from "@/demos/registry";
import { addDays, diffDays, weekday, type Ymd } from "@/lib/demo/dates";
import { buildShop } from "@/lib/demo/shop/generate";
import { estimateTotal, invoiceView, type Book, type InvoiceRow } from "@/lib/demo/shop/derive";
import type { CrewId, Customer, Estimate, Invoice, Job, Lead, LeadStage, Note, PayMethod, Payment, Photo, PhotoTag, ShopSeed, TimeEntry, Worker } from "@/lib/demo/shop/types";
import { useDemo } from "../DemoProvider";
import ShopOverlays from "./Overlays";

type Overlay =
  | { kind: "job"; id: string }
  | { kind: "estimate"; id: string | null; customer?: string }
  | { kind: "invoice"; id: string }
  | { kind: "quick"; what: "job" | "time" | "photo" | "lead"; job?: string }
  | { kind: "move"; id: string }
  | null;

type ShopCtx = {
  book: Book;
  seed: ShopSeed;
  rows: InvoiceRow[];
  worker: (id: string) => Worker;
  customer: (id: string) => Customer;
  job: (id: string) => Job;
  place: (j: Job) => { address: string; town: string };
  overlay: Overlay;
  open: (o: Overlay) => void;
  // visitor actions (in memory, each shows the demo toast)
  recordPayment: (invoice: string, amount: number, method: PayMethod) => void;
  sendInvoice: (invoice: string) => void;
  remind: (invoice: string) => void;
  saveEstimate: (e: Estimate, how: "draft" | "send") => void;
  convertEstimate: (e: Estimate) => string; // new invoice id
  signCO: (id: string) => void;
  moveJob: (id: string, start: Ymd, crew: CrewId) => void;
  setLeadStage: (id: string, stage: LeadStage) => void;
  addLead: (l: Omit<Lead, "id">) => void;
  addJob: (j: { customer: string; type: string; date: Ymd; crew: CrewId; title: string }) => void;
  addTime: (e: TimeEntry) => void;
  clocked: Record<string, { since: number; job: string | null }>;
  clockIn: (worker: string, job: string | null) => void;
  clockOut: (worker: string) => void;
  addPhoto: (job: string, tag: PhotoTag) => void;
  addNote: (job: string, text: string) => void;
  reviews: Set<string>;
  requestReview: (job: string) => void;
  message: () => void;
};

const Ctx = createContext<ShopCtx | null>(null);

export function useShop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop outside ShopProvider");
  return c;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const isWork = (d: Ymd) => weekday(d) !== 0 && weekday(d) !== 6;
const nextWork = (d: Ymd) => { while (!isWork(d)) d = addDays(d, 1); return d; };

/**
 * The shop dataset plus every change a visitor makes. Rebuilt identically on
 * server and client from (slug, anchor). Nothing persists.
 */
export default function ShopProvider({ slug, anchor, children }: { slug: string; anchor: Ymd; children: ReactNode }) {
  const { notify } = useDemo();
  const cfg = getDemo(slug)!;
  const seed = getShopSeed(slug)!;
  const ds = useMemo(() => buildShop(slug, cfg.seed, seed, anchor), [slug, cfg.seed, seed, anchor]);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [newInvoices, setNewInvoices] = useState<Invoice[]>([]);
  const [sent, setSent] = useState<Set<string>>(() => new Set());
  const [estimates, setEstimates] = useState<Record<string, Estimate>>({});
  const [signed, setSigned] = useState<Record<string, Ymd>>({});
  const [moves, setMoves] = useState<Record<string, { start: Ymd; crew: CrewId }>>({});
  const [stages, setStages] = useState<Record<string, LeadStage>>({});
  const [newLeads, setNewLeads] = useState<Lead[]>([]);
  const [newJobs, setNewJobs] = useState<Job[]>([]);
  const [time, setTime] = useState<TimeEntry[]>([]);
  const [clocked, setClocked] = useState<ShopCtx["clocked"]>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reviews, setReviews] = useState<Set<string>>(() => new Set());
  const [overlay, setOverlay] = useState<Overlay>(null);

  const book: Book = useMemo(() => {
    const jobs = [...ds.jobs, ...newJobs].map((j) => {
      const mv = moves[j.id];
      if (!mv) return j;
      // Only the work still ahead moves; days already worked stay put.
      const past = j.days.filter((d) => d < anchor);
      const ahead = j.days.filter((d) => d >= anchor);
      const delta = diffDays(mv.start, ahead[0] ?? j.start);
      const shifted: Ymd[] = [];
      let last = "";
      for (const d of ahead) {
        let nd = nextWork(addDays(d, delta));
        if (nd <= last) nd = nextWork(addDays(last, 1));
        shifted.push(nd);
        last = nd;
      }
      const days = [...past, ...shifted];
      return { ...j, crew: mv.crew, days, start: days[0], end: days.at(-1)!, status: past.length ? j.status : ("Scheduled" as const) };
    });
    const est = [...ds.estimates.map((e) => estimates[e.id] ?? e), ...Object.values(estimates).filter((e) => !ds.estimates.some((x) => x.id === e.id))];
    return {
      ...ds,
      jobs,
      estimates: est,
      changeOrders: ds.changeOrders.map((c) => (signed[c.id] ? { ...c, status: "Approved" as const, signed: signed[c.id] } : c)),
      invoices: [...ds.invoices, ...newInvoices].map((i) => (sent.has(i.id) ? { ...i, draft: false } : i)),
      payments: [...ds.payments, ...payments],
      leads: [...ds.leads, ...newLeads].map((l) => (stages[l.id] ? { ...l, stage: stages[l.id] } : l)),
      time: [...ds.time, ...time],
      photos: [...photos, ...ds.photos],
      notes: [...notes, ...ds.notes],
    };
  }, [ds, newJobs, moves, estimates, signed, newInvoices, sent, payments, newLeads, stages, time, photos, notes, anchor]);

  const rows = useMemo(() => invoiceView(book), [book]);
  const workers = useMemo(() => new Map(seed.workers.map((w) => [w.id, w])), [seed]);
  const customers = useMemo(() => new Map(book.customers.map((c) => [c.id, c])), [book]);
  const jobsById = useMemo(() => new Map(book.jobs.map((j) => [j.id, j])), [book]);
  const worker = useCallback((id: string) => workers.get(id) ?? { id, name: id === "you" ? "You" : id, role: "", crew: "service" as CrewId, cost: 0, rate: 0, phone: "" }, [workers]);
  const customer = useCallback((id: string) => customers.get(id)!, [customers]);
  const job = useCallback((id: string) => jobsById.get(id)!, [jobsById]);
  const place = useCallback((j: Job) => customers.get(j.customer)!.properties.find((p) => p.id === j.property) ?? customers.get(j.customer)!.properties[0], [customers]);

  const value: ShopCtx = {
    book, seed, rows, worker, customer, job, place, overlay,
    open: setOverlay,
    recordPayment: (invoice, amount, method) => {
      setPayments((ps) => [...ps, { id: `vp${ps.length + 1}`, invoice, date: anchor, amount: r2(amount), method, ref: method === "Check" ? "Check (entered today)" : method }]);
      notify();
    },
    sendInvoice: (id) => { setSent((s) => new Set(s).add(id)); notify(); },
    remind: () => notify(),
    saveEstimate: (e, how) => {
      setEstimates((m) => ({ ...m, [e.id]: { ...e, status: how === "send" ? "Sent" : e.status === "Approved" ? "Approved" : "Draft", sent: how === "send" ? anchor : e.sent } }));
      notify();
    },
    convertEstimate: (e) => {
      const total = estimateTotal(e, seed.taxRate);
      const id = `vinv${newInvoices.length + 1}`;
      const amount = e.depositPct > 0 ? Math.round(total * e.depositPct) : total;
      setNewInvoices((xs) => [...xs, { id, no: `INV-${3900 + xs.length + 1}`, job: e.job ?? `est:${e.id}`, customer: e.customer, kind: e.depositPct > 0 ? "Deposit" : "Final", issued: anchor, due: addDays(anchor, 7), amount, viewed: false, draft: false }]);
      setEstimates((m) => ({ ...m, [e.id]: { ...e, status: "Approved", decided: anchor } }));
      notify();
      return id;
    },
    signCO: (id) => { setSigned((s) => ({ ...s, [id]: anchor })); notify(); },
    moveJob: (id, start, crew) => { setMoves((m) => ({ ...m, [id]: { start, crew } })); notify(); },
    setLeadStage: (id, stage) => { setStages((s) => ({ ...s, [id]: stage })); notify(); },
    addLead: (l) => { setNewLeads((xs) => [{ ...l, id: `vl${xs.length + 1}` }, ...xs]); notify(); },
    addJob: ({ customer: cust, type, date, crew, title }) => {
      const t = seed.jobTypes.find((x) => x.key === type)!;
      const c = customers.get(cust)!;
      const price = Math.round((t.price[0] + t.price[1]) / 2);
      const days = t.big ? Array.from({ length: 10 }, (_, k) => k).reduce<Ymd[]>((acc) => [...acc, nextWork(acc.length ? addDays(acc.at(-1)!, 1) : date)], []) : [nextWork(date)];
      setNewJobs((xs) => [...xs, {
        id: `vj${xs.length + 1}`, no: `J-${2600 + xs.length + 1}`, type, group: t.group, customer: cust, property: c.properties[0].id, crew, title, scope: "Added from the quick-add button. Scope to follow.",
        sold: anchor, start: days[0], end: days.at(-1)!, days, startTime: crew === "remodel" ? "7:30" : "8:00", estimate: null, contract: price, lines: [{ kind: "Labor", desc: t.labor[0], qty: 1, unit: "lot", price, cost: price * 0.6 }],
        budget: { materials: r2(price * t.mat / 1.2), laborHours: Math.round((price * (1 - t.mat - t.sub)) / (crew === "remodel" ? 85 : 115)), laborCost: r2(price * (1 - t.mat - t.sub) * 0.42), subs: r2(price * t.sub / 1.15) }, status: "Scheduled",
      }]);
      notify();
    },
    addTime: (e) => { setTime((xs) => [...xs, e]); notify(); },
    clocked,
    clockIn: (w, j) => { setClocked((c) => ({ ...c, [w]: { since: Date.now(), job: j } })); notify(); },
    clockOut: (w) => {
      const c = clocked[w];
      if (c) {
        const hours = Math.max(0.25, Math.round(((Date.now() - c.since) / 3_600_000) * 4) / 4);
        setTime((xs) => [...xs, { worker: w, date: anchor, job: c.job, hours }]);
      }
      setClocked((m) => { const n = { ...m }; delete n[w]; return n; });
      notify();
    },
    addPhoto: (j, tag) => {
      const t = seed.jobTypes.find((x) => x.key === jobsById.get(j)!.type)!;
      setPhotos((xs) => [{ id: `vph${xs.length + 1}`, job: j, tag, caption: `${t.label} · from your phone`, date: anchor, by: "you" }, ...xs]);
      notify();
    },
    addNote: (j, text) => { setNotes((xs) => [{ id: `vn${xs.length + 1}`, job: j, date: anchor, by: "you", text }, ...xs]); notify(); },
    reviews,
    requestReview: (j) => { setReviews((s) => new Set(s).add(j)); notify(); },
    message: () => notify(),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ShopOverlays />
    </Ctx.Provider>
  );
}
