"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addDays, type Ymd } from "@demos/kit/data/dates";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { PRODUCTS, SKUS, type BrandKey, type Stage } from "@demos/simpletimes/catalog";
import { buildSimpleTimes, nextWorkday, quotePrice, type Account, type Client, type Order, type Quote, type Run, type RunStatus, type Tasting } from "@demos/simpletimes/data";
import { emptyLive, world, type BrandFilter, type Live } from "@demos/simpletimes/derive";

const Sheets = dynamic(() => import("./Sheets"));

export type SheetState =
  | { kind: "account"; id: string }
  | { kind: "run"; id: string }
  | { kind: "client"; id: string }
  | { kind: "tasting"; id: string }
  | { kind: "visit" | "logTasting" | "order" | "addAccount"; account?: string }
  | { kind: "scheduleRun" | "receive" | "addClient" }
  | { kind: "po"; item: string }
  | null;

function useStState(anchor: Ymd) {
  const { notify } = useDemo();
  const d = useMemo(() => buildSimpleTimes(anchor), [anchor]);
  const [st, setSt] = useState<Live>(emptyLive);
  const [sheet, setSheet] = useState<SheetState>(null);
  const w = useMemo(() => world(d, st), [d, st]);
  const account = useCallback((id: string) => w.accounts.find((a) => a.id === id)!, [w]);
  const client = useCallback((id: string) => w.clients.find((c) => c.id === id)!, [w]);

  const setBrand = (brand: BrandFilter) => setSt((s) => ({ ...s, brand }));
  const logVisit = (accountId: string, note: string) => {
    setSt((s) => ({ ...s, visits: { ...s.visits, [accountId]: [{ id: `vx${Object.values(s.visits).flat().length + 1}`, date: d.today, rep: "you", note }, ...(s.visits[accountId] ?? [])] } }));
    notify("Visit logged. In your system it lands on the account and the rep's route.");
  };
  const logTasting = (t: Omit<Tasting, "id" | "cost" | "upcoming">) => {
    setSt((s) => ({ ...s, tastings: [...s.tastings, { ...t, id: `tx${s.tastings.length + 1}`, cost: Math.round(t.samples * 4.2 + 3 * 22 + 12), upcoming: false }] }));
    notify("Tasting logged. Reorders from this store over the next 30 days will count toward it.");
  };
  const addOrder = (accountId: string, brand: BrandKey, cases: Record<string, number>) => {
    const lines = Object.entries(cases).filter(([, q]) => q > 0).map(([sku, qty]) => ({ sku, qty, amount: qty * SKUS.find((x) => x.id === sku)!.wholesale }));
    if (!lines.length) return;
    const a = account(accountId);
    const o: Order = { id: `SO-${d.seq.order + st.orders.length + 1}`, account: accountId, date: d.today, brand, lines, total: lines.reduce((s, l) => s + l.amount, 0), channel: a.type === "Distributor" ? "Distributor" : a.type === "Grocery" || a.type === "Liquor store" ? "Retail" : "Wholesale", open: true };
    setSt((s) => ({ ...s, orders: [...s.orders, o] }));
    notify(`Order ${o.id} saved. Sales, the account and its reorder date are already updated.`);
  };
  const addAccount = (a: Omit<Account, "id" | "visits" | "since" | "cadence" | "notes">) => {
    const id = `ax${st.accounts.length + 1}`;
    setSt((s) => ({ ...s, accounts: [...s.accounts, { ...a, id, visits: [], since: d.today, cadence: 28, notes: "Added from the phone." }] }));
    notify();
    return id;
  };
  const moveClient = (id: string, stage: Stage) => setSt((s) => ({ ...s, stage: { ...s.stage, [id]: stage } }));
  const addClient = (c: Pick<Client, "name" | "products" | "minRun" | "contact">) => {
    setSt((s) => ({ ...s, clients: [...s.clients, { ...c, id: `cx${s.clients.length + 1}`, stage: "Inquiry", next: "Intro call", nextDate: nextWorkday(addDays(d.today, 2)), value: c.minRun * 30, since: d.today }] }));
    notify();
  };
  const setRunStatus = (id: string, status: RunStatus) => { setSt((s) => ({ ...s, runStatus: { ...s.runStatus, [id]: status } })); notify(); };
  const scheduleRun = (r: { owner: string; product: string; base: string; date: Ymd; line: string; gallons: number; size: "375 ml" | "750 ml"; price: number }) => {
    const q = quotePrice({ gallons: r.gallons, size: r.size, labels: "We print", margin: 0.3, base: r.base });
    const run: Run = { id: `R-${d.seq.run + st.runs.length + 1}`, ...r, bottles: q.bottles, status: "Scheduled", recipe: "v1.0", lots: [], yieldPct: 0, checks: [], firstPass: true, operator: "Unassigned", cost: q.cost };
    setSt((s) => ({ ...s, runs: [...s.runs, run] }));
    return run.id;
  };
  const receive = (stockId: string, qty: number) => { setSt((s) => ({ ...s, received: { ...s.received, [stockId]: (s.received[stockId] ?? 0) + qty } })); notify("Received. Stock and the run plan are updated."); };
  const createPo = (item: string, qty: number, expedite: boolean, lead: number, cost: number) => {
    setSt((s) => ({ ...s, pos: [...s.pos, { id: `PO-${5121 + s.pos.length}`, item, qty, ordered: d.today, eta: nextWorkday(addDays(d.today, expedite ? 2 : lead)), cost: Math.round(qty * cost * (expedite ? 1.15 : 1)), expedited: expedite }] }));
    notify("Purchase order sent to the supplier (demo).");
  };
  const saveQuote = (q: Omit<Quote, "id" | "date">) => {
    const quote = { ...q, id: `Q-${740 + st.quotes.length}`, date: d.today };
    setSt((s) => ({ ...s, quotes: [quote, ...s.quotes] }));
    return quote;
  };
  const setQuoteStatus = (id: string, status: Quote["status"]) => setSt((s) => ({ ...s, quoteStatus: { ...s.quoteStatus, [id]: status } }));
  const convertQuote = (q: Quote) => {
    const c = client(q.client);
    const base = "client";
    const date = nextWorkday(addDays(d.today, 7));
    const id = scheduleRun({ owner: c.id, product: q.product, base, date, line: q.gallons > 150 ? "k2" : "k1", gallons: q.gallons, size: q.size, price: quotePrice({ ...q, base }).price });
    setSt((s) => ({ ...s, quoteStatus: { ...s.quoteStatus, [q.id]: "Accepted" }, stage: { ...s.stage, [c.id]: "Production" } }));
    notify(`Quote ${q.id} is now run ${id}, on the schedule for the week of ${date.slice(5).replace("-", "/")}.`);
    setSheet({ kind: "run", id });
  };
  return { d, st, w, brand: st.brand, setBrand, sheet, open: setSheet, account, client, logVisit, logTasting, addOrder, addAccount, moveClient, addClient, setRunStatus, scheduleRun, receive, createPo, saveQuote, setQuoteStatus, convertQuote, notify, products: PRODUCTS };
}

type Ctx = ReturnType<typeof useStState>;
const C = createContext<Ctx | null>(null);
export function useSt(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useSt outside StProvider");
  return c;
}

export default function StProvider({ anchor, children }: { anchor: string; children: ReactNode }) {
  const v = useStState(anchor);
  return (
    <C.Provider value={v}>
      {children}
      {v.sheet ? <Sheets /> : null}
    </C.Provider>
  );
}
