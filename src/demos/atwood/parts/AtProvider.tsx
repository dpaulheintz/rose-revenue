"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addDays, type Ymd } from "@demos/kit/data/dates";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { buildAtwood, jobType, type Estimate, type Invoice, type Job, type JobType } from "@demos/atwood/data";
import { emptyLive, world, type Live } from "@demos/atwood/derive";

const Sheets = dynamic(() => import("./Sheets"));

export type Sheet =
  | { kind: "job" | "customer" | "invoice" | "estimate"; id: string }
  | { kind: "pay"; id: string }
  | { kind: "newJob" | "newEstimate" | "expense" | "review"; customer?: string }
  | null;

function useAtState(anchor: Ymd) {
  const { notify } = useDemo();
  const d = useMemo(() => buildAtwood(anchor), [anchor]);
  const [st, setSt] = useState<Live>(emptyLive);
  const [sheet, setSheet] = useState<Sheet>(null);
  const w = useMemo(() => world(d, st), [d, st]);
  const customer = useCallback((id: string) => d.customers.find((c) => c.id === id)!, [d]);
  const job = useCallback((id: string) => w.jobs.find((j) => j.id === id)!, [w]);

  const takePayment = (jobId: string, method: NonNullable<Invoice["method"]>) => {
    setSt((s) => ({ ...s, paid: { ...s.paid, [jobId]: { on: d.today, method } } }));
    notify(`${method} payment recorded. The invoice is marked paid and a review request is ready.`);
  };
  const askReview = (jobIds: string[]) => {
    setSt((s) => ({ ...s, asked: { ...s.asked, ...Object.fromEntries(jobIds.map((id) => [id, d.today])) } }));
    notify(jobIds.length > 1 ? `${jobIds.length} review requests sent (demo).` : "Review request texted (demo).");
  };
  const finishJob = (jobId: string) => { setSt((s) => ({ ...s, done: { ...s.done, [jobId]: true } })); notify("Job done. Parts came off the truck stock and the invoice is ready."); };
  const reschedule = (jobId: string, date: Ymd, time: string) => { setSt((s) => ({ ...s, moved: { ...s.moved, [jobId]: { date, time } } })); notify("Rescheduled. The customer gets a text with the new time (demo)."); };
  const addJob = (customerId: string, type: JobType, date: Ymd, time: string) => {
    const t = jobType(type);
    const j: Job = { id: `J-${d.seq.job + st.jobs.length + 1}`, customer: customerId, date, time, type, price: Math.round((t.price[0] + t.price[1]) / 2 / 5) * 5, done: false, parts: [], notes: "Booked from the phone.", photos: 0, miles: 14 };
    setSt((s) => ({ ...s, jobs: [...s.jobs, j] }));
    notify("Job booked. It's on the calendar and the customer gets a confirmation text (demo).");
    return j.id;
  };
  const addEstimate = (e: Omit<Estimate, "id" | "date" | "status">) => {
    const est: Estimate = { ...e, id: `E-${660 + st.estimates.length}`, date: d.today, status: "Sent" };
    setSt((s) => ({ ...s, estimates: [est, ...s.estimates] }));
    notify("Estimate texted to the customer with a link to approve (demo).");
    return est.id;
  };
  const setEstimate = (id: string, status: Estimate["status"], chosen?: number) => setSt((s) => ({ ...s, estStatus: { ...s.estStatus, [id]: { status, chosen } } }));
  const logExpense = (category: string, amount: number, note: string, receipt: boolean) => {
    setSt((s) => ({ ...s, expenses: [...s.expenses, { id: `xx${s.expenses.length + 1}`, date: d.today, category, amount, note, receipt }] }));
    notify("Expense saved. Money and the tax set-aside are updated.");
  };
  const remind = (ids: string[]) => { setSt((s) => ({ ...s, reminded: { ...s.reminded, ...Object.fromEntries(ids.map((id) => [id, d.today])) } })); notify(ids.length > 1 ? `Tune-up reminder texted to ${ids.length} customers (demo).` : "Tune-up reminder texted (demo)."); };
  const nextDays = (n: number) => Array.from({ length: n }, (_, i) => addDays(d.today, i + 1));

  return { d, st, w, customer, job, sheet, open: setSheet, takePayment, askReview, finishJob, reschedule, addJob, addEstimate, setEstimate, logExpense, remind, nextDays, notify };
}

type Ctx = ReturnType<typeof useAtState>;
const C = createContext<Ctx | null>(null);
export function useAt(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useAt outside AtProvider");
  return c;
}

export default function AtProvider({ anchor, children }: { anchor: string; children: ReactNode }) {
  const v = useAtState(anchor);
  return (
    <C.Provider value={v}>
      {children}
      {v.sheet ? <Sheets /> : null}
    </C.Provider>
  );
}
