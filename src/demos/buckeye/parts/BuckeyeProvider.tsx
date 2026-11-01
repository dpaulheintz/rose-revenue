"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addWork, buildShop, price, type Job, type Part, type PO, type Quote, type Shop, type Step } from "@demos/buckeye/data";
import { allPos, allQuotes, attention, emptyState, kpis, laneLabel, type LiveState } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { Tour } from "@demos/kit/blocks/Tour";
import { useDemo } from "@demos/kit/shell/DemoProvider";

const JobPanel = dynamic(() => import("./JobPanel"));

type NewQuote = { customerId: string; partId: string; materialId: string; qty: number; cycleMin: number; setupHr: number; margin: number };

function useShopState(anchor: string) {
  const { notify } = useDemo();
  const shop = useMemo(() => buildShop(anchor), [anchor]);
  const [st, setSt] = useState<LiveState>(emptyState);
  const [jobId, setJobId] = useState<string | null>(null);
  const [touring, setTouring] = useState(false);
  const k = useMemo(() => kpis(shop, st), [shop, st]);
  const needs = useMemo(() => attention(shop, k, st), [shop, k, st]);
  const quotes = useMemo(() => allQuotes(shop, st), [shop, st]);
  const pos = useMemo(() => allPos(shop, st), [shop, st]);

  const customer = useCallback((id: string) => shop.customers.find((c) => c.id === id)!, [shop]);
  const material = useCallback((id: string) => shop.materials.find((m) => m.id === id)!, [shop]);

  const moveJob = (id: string, to: string) => {
    setSt((s) => ({ ...s, assign: { ...s.assign, [id]: to }, moved: { ...s.moved, [id]: [...(s.moved[id] ?? []), { date: shop.today, text: `Moved to ${laneLabel(to)} on the board` }] } }));
  };
  const addQuote = (q: NewQuote, status: Quote["status"]) => {
    const part = shop.partOf(q.partId);
    const id = `${ind.formats.quote}${shop.seq.quote + st.extraQuotes.length + 1}`;
    const est = price(ind, { route: part.route, qty: q.qty, cycleMin: q.cycleMin, setupHr: q.setupHr, perPc: part.perPc, materialCost: material(q.materialId).cost, margin: q.margin });
    const quote: Quote = { ...q, id, date: shop.today, status, by: ind.staff[2].name, price: est.price };
    setSt((s) => ({ ...s, extraQuotes: [quote, ...s.extraQuotes] }));
    return quote;
  };
  const setQuoteStatus = (id: string, status: Quote["status"]) => {
    setSt((s) => ({ ...s, quoteStatus: { ...s.quoteStatus, [id]: status } }));
    notify();
  };
  /** The quote becomes a job: same part, quantity, material and price, typed by nobody. */
  const convert = (q: Quote) => {
    const part: Part = shop.partOf(q.partId);
    const n = st.extraJobs.length + 1;
    const id = `${ind.formats.job}${shop.seq.job + n}`;
    const est = price(ind, { route: part.route, qty: q.qty, cycleMin: q.cycleMin, setupHr: q.setupHr, perPc: part.perPc, materialCost: material(q.materialId).cost, margin: q.margin });
    const steps: Step[] = part.route.map((op, i) => {
      const o = ind.operations[op];
      const machine = o.center ? ind.machines.find((m) => m.center === o.center) : undefined;
      return { op, label: o.label, machineId: machine?.id, hours: est.lines.find((l) => l.op === op)?.hours ?? 0, state: i === 0 ? "now" : "next", date: addWork(shop.today, i) };
    });
    const heat = shop.heats.find((h) => h.materialId === q.materialId)?.heat ?? `${ind.formats.heat}pending`;
    const job: Job = {
      id, quoteId: q.id, partId: part.id, customerId: q.customerId, qty: q.qty, materialId: q.materialId, matNeed: est.matNeed, heat, lot: `${ind.formats.lot}${shop.seq.lot + n}`,
      orderDate: shop.today, dueDate: addWork(shop.today, part.route.length + 10), steps, current: 0, price: est.price, cost: est.cost, margin: q.margin, scrapQty: 0, inspector: ind.staff[1].name,
    };
    setSt((s) => ({ ...s, extraJobs: [...s.extraJobs, job], quoteStatus: { ...s.quoteStatus, [q.id]: "Won" }, quoteJob: { ...s.quoteJob, [q.id]: id } }));
    setJobId(id);
  };
  const createPo = (materialId: string, qty: number, expedite: boolean) => {
    const m = material(materialId);
    const id = `${ind.formats.po}${shop.seq.po + st.extraPos.length + 1}`;
    const po: PO = { id, materialId, supplierId: m.supplier, qty, orderDate: shop.today, eta: addWork(shop.today, expedite ? 2 : Math.ceil((m.leadDays * 5) / 7)), cost: Math.round(qty * m.cost * (expedite ? 1.12 : 1)), expedited: expedite };
    setSt((s) => ({ ...s, extraPos: [...s.extraPos, po] }));
    notify();
    return po;
  };
  const closeNc = (id: string, disposition: string) => { setSt((s) => ({ ...s, ncClosed: { ...s.ncClosed, [id]: disposition } })); notify(); };
  const markPm = (id: string) => { setSt((s) => ({ ...s, pmDone: { ...s.pmDone, [id]: shop.today } })); notify(); };

  return { shop, st, k, needs, quotes, pos, customer, material, jobId, openJob: setJobId, touring, setTouring, moveJob, addQuote, setQuoteStatus, convert, createPo, closeNc, markPm, notify };
}

type ShopCtx = ReturnType<typeof useShopState>;
const Ctx = createContext<ShopCtx | null>(null);

export function useShop(): ShopCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop outside BuckeyeProvider");
  return c;
}
export type { Shop };

export default function BuckeyeProvider({ anchor, children }: { anchor: string; children: ReactNode }) {
  const value = useShopState(anchor);
  return (
    <Ctx.Provider value={value}>
      {children}
      {value.jobId ? <JobPanel /> : null}
      {/* Lives up here because the tour walks away from the page that started it. */}
      {value.touring ? <Tour stops={ind.copy.tour} autoStart onActive={value.setTouring} /> : null}
    </Ctx.Provider>
  );
}
