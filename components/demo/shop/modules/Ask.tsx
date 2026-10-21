"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { addDays, diffDays, weekday } from "@/lib/demo/dates";
import { dayDate, shortDate } from "@/lib/demo/format";
import { byJobType, estimateTotal, jobFinance, sum } from "@/lib/demo/shop/derive";
import { dayPlan, hhmm } from "@/lib/demo/shop/insights";
import { useDemo } from "../../DemoProvider";
import Icon from "../../Icon";
import { Button, PageHeader, Pill } from "../../ui";
import { usd } from "../bits";
import { useShop } from "../ShopProvider";

type Answer = { text: ReactNode; source: string };
type Msg = { id: number; q: string; a: Answer | null };

export default function Ask() {
  const { cfg, base } = useDemo();
  const { book, seed, rows, customer, worker } = useShop();
  const t = book.anchor;
  const nextWork = (d: string) => { while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1); return d; };

  const intents: Array<{ q: string; match: RegExp; run: () => Answer }> = [
    {
      q: "Who owes me money?", match: /owe|overdue|unpaid|outstanding|balance/i,
      run: () => {
        const open = rows.filter((r) => r.balance > 0 && r.status !== "Draft");
        const by = new Map<string, number>();
        for (const r of open) by.set(r.customer, (by.get(r.customer) ?? 0) + r.balance);
        const top = [...by].sort((a, b) => b[1] - a[1]).slice(0, 5);
        return { source: "money", text: <><b>{usd(sum(open, (r) => r.balance))}</b> is outstanding, <b>{usd(sum(open.filter((r) => r.status === "Overdue"), (r) => r.balance))}</b> of it overdue. Biggest balances: {top.map(([c, v], i) => <span key={c}>{i ? ", " : ""}{customer(c).name} {usd(v)}</span>)}.</> };
      },
    },
    {
      q: "What's my most profitable job type?", match: /profit|margin|best job|make the most/i,
      run: () => {
        const ty = byJobType(book, seed, rows).filter((r) => r.jobs >= 3);
        const byMargin = ty.slice().sort((a, b) => b.margin - a.margin);
        const byDollars = ty.slice().sort((a, b) => b.profit - a.profit);
        return { source: "sales", text: <>By margin: <b>{byMargin[0].t.label}</b> at {Math.round(byMargin[0].margin * 100)}%. By dollars: <b>{byDollars[0].t.label}</b>, {usd(byDollars[0].profit)} gross profit on {byDollars[0].jobs} jobs. Lowest margin: {byMargin.at(-1)!.t.label} ({Math.round(byMargin.at(-1)!.margin * 100)}%).</> };
      },
    },
    {
      q: "What's the crew doing tomorrow?", match: /tomorrow|crew|schedule|who.?s working/i,
      run: () => {
        const d = nextWork(addDays(t, 1));
        const plan = dayPlan(book, seed, d);
        return { source: "jobs", text: <>{dayDate(d)}: {seed.crews.map((c, i) => { const vs = plan.filter((v) => v.crew === c.id); return <span key={c.id}>{i ? " " : ""}<b>{c.name}</b>: {vs.length ? vs.map((v) => `${hhmm(v.start)} ${v.job.title} (${customer(v.job.customer).name.split(" ").at(-1)})`).join("; ") : "shop day"}.</span>; })}</> };
      },
    },
    {
      q: "Which jobs are over budget?", match: /budget|over|running/i,
      run: () => {
        const over = book.jobs.filter((j) => j.status === "In progress").map((j) => ({ j, f: jobFinance(book, seed, j, rows) })).filter((x) => x.f.over);
        return { source: "costing", text: over.length ? <>{over.map((x, i) => <span key={x.j.id}>{i ? "; " : ""}<b>{x.j.no} {x.j.title}</b>: {usd(x.f.actual.total)} spent vs. {usd(x.f.expected)} expected at {Math.round(x.f.progress * 100)}%</span>)}.</> : "Every live job is on pace." };
      },
    },
    {
      q: "How much did we collect last week?", match: /last week|collect|paid|came in/i,
      run: () => {
        const from = addDays(book.weeks.at(-1)!, 0), to = addDays(from, 6);
        const ps = book.payments.filter((p) => p.date >= from && p.date <= to);
        return { source: "money", text: <>Week of {shortDate(from)}: <b>{usd(sum(ps, (p) => p.amount))}</b> from {ps.length} payments ({["Card", "Check", "ACH", "Cash"].map((m) => `${m} ${usd(sum(ps.filter((p) => p.method === m), (p) => p.amount))}`).join(", ")}).</> };
      },
    },
    {
      q: "Which estimates are still waiting?", match: /estimate|quote|waiting|bid/i,
      run: () => {
        const w = book.estimates.filter((e) => e.status === "Sent" || e.status === "Viewed").sort((a, b) => ((a.sent ?? "") < (b.sent ?? "") ? -1 : 1));
        return { source: "money", text: <>{w.length} out, worth <b>{usd(sum(w, (e) => estimateTotal(e, seed.taxRate)))}</b>: {w.slice(0, 5).map((e, i) => <span key={e.id}>{i ? ", " : ""}{customer(e.customer).name} {usd(estimateTotal(e, seed.taxRate))} ({diffDays(t, e.sent!)}d{e.status === "Viewed" ? ", opened" : ""})</span>)}.</> };
      },
    },
    {
      q: "Any inspections this week?", match: /inspect|permit/i,
      run: () => {
        const ins = book.permits.flatMap((p) => p.inspections.filter((i) => i.result === "Scheduled" && i.date <= addDays(t, 7)).map((i) => ({ p, i }))).sort((a, b) => (a.i.date < b.i.date ? -1 : 1));
        return { source: "permits", text: ins.length ? <>{ins.map(({ p, i }, k) => <span key={k}>{k ? "; " : ""}<b>{dayDate(i.date)}</b> {i.kind.toLowerCase()} ({p.kind}) at {book.jobs.find((j) => j.id === p.job)!.title.toLowerCase()}, {p.town}, with {seed.inspectors.find((x) => x.id === i.inspector)!.name}</span>)}.</> : "Nothing booked in the next 7 days." };
      },
    },
    {
      q: "Who logged the most hours last week?", match: /hours|timesheet|overtime/i,
      run: () => {
        const from = book.weeks.at(-1)!, to = addDays(from, 6);
        const rowsW = seed.workers.map((w) => ({ w, h: sum(book.time.filter((e) => e.worker === w.id && e.date >= from && e.date <= to && e.job), (e) => e.hours) })).sort((a, b) => b.h - a.h);
        return { source: "crew", text: <>On-job hours, week of {shortDate(from)}: {rowsW.map((r, i) => <span key={r.w.id}>{i ? ", " : ""}{worker(r.w.id).name.split(" ")[0]} {r.h.toFixed(1)}</span>)}.</> };
      },
    },
  ];

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const id = useId();
  const end = useRef<HTMLDivElement>(null);
  const next = useRef(1);
  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs]);
  const ask = (text: string) => {
    const it = intents.find((i) => i.q === text) ?? intents.find((i) => i.match.test(text));
    setMsgs((m) => [...m, { id: next.current++, q: text, a: it ? it.run() : null }]);
    setQ("");
  };
  const mod = (key: string) => cfg.modules.find((m) => m.key === key)!;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ask the Shop" meta={<Pill tone="accent">Concept: ask questions of your own data</Pill>} />
      <div className="demo-card p-4 sm:p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-(--d-accent) text-(--d-on-accent)"><Icon name="chat" size={20} /></span>
          <p className="text-[15px]">Ask in plain words. Answers come straight from your jobs, invoices and timesheets, and say where they came from. Try one:</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {intents.map((i) => <button key={i.q} type="button" onClick={() => ask(i.q)} className="inline-flex min-h-12 items-center rounded-full border border-(--d-line) bg-(--d-panel) px-4 text-left text-[14px] font-medium hover:border-(--d-accent)">{i.q}</button>)}
        </div>
      </div>
      <ol className="mt-5 space-y-4" aria-live="polite">
        {msgs.map((m) => (
          <li key={m.id} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-[14px] rounded-br-[4px] bg-(--d-accent) px-4 py-2.5 text-[15px] text-(--d-on-accent)">{m.q}</p>
            <div className="demo-card max-w-[94%] p-4 text-[15px] leading-relaxed">
              {m.a ? (
                <>
                  <p>{m.a.text}</p>
                  <Link href={`${base}/${mod(m.a.source).path}`} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-(--d-accent)"><Icon name={mod(m.a.source).icon} size={16} />Source: {mod(m.a.source).label}<Icon name="arrow" size={14} /></Link>
                </>
              ) : (
                <p>I can&apos;t answer that one in the concept yet. The real version answers from all your records. Try money owed, profit by job type, tomorrow&apos;s crew, budgets, estimates, inspections or hours.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div ref={end} />
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q.trim()); }} className="sticky bottom-[84px] mt-5 flex gap-2 rounded-[14px] bg-(--d-bg)/90 py-2 backdrop-blur md:bottom-4">
        <label htmlFor={id} className="sr-only">Ask a question</label>
        <input id={id} className="demo-input" placeholder="e.g. Who owes me money?" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <Button type="submit" variant="primary" disabled={!q.trim()}><Icon name="arrow" size={18} /><span className="sr-only sm:not-sr-only">Ask</span></Button>
      </form>
    </div>
  );
}
