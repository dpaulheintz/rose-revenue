"use client";

import { useMemo, useState } from "react";
import { addDays } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import { jobFinance, sum } from "@/lib/demo/shop/derive";
import { FilterChip, Note, PageHeader, Pill, Stat } from "../../ui";
import { BudgetBar } from "../JobSheet";
import { CrewDot, usd } from "../bits";
import { useShop } from "../ShopProvider";

type Filter = "live" | "finished" | "over";

export default function Costing() {
  const { book, seed, rows, customer, open } = useShop();
  const [filter, setFilter] = useState<Filter>("live");
  const all = useMemo(
    () => book.jobs.filter((j) => j.start < book.anchor && j.end >= addDays(book.anchor, -120)).map((j) => ({ j, f: jobFinance(book, seed, j, rows) })),
    [book, seed, rows],
  );
  const live = all.filter((x) => !x.f.done);
  const finished = all.filter((x) => x.f.done && seed.jobTypes.find((t) => t.key === x.j.type)!.group !== "Service");
  const over = all.filter((x) => x.f.over);
  const list = (filter === "live" ? live : filter === "finished" ? finished : over).sort((a, b) => b.f.variance - a.f.variance);
  return (
    <div className="space-y-5">
      <PageHeader title="Job costing" meta="Budget = the estimate's cost side (materials, crew hours at cost, subs) plus approved change orders. Actuals = POs + receipts, sub bills and timesheets." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live jobs" value={String(live.length)} sub={`${usd(sum(live, (x) => x.f.actual.total))} spent so far`} />
        <Stat label="Running over" value={String(live.filter((x) => x.f.over).length)} sub="More than 8% over plan" tone="bad" />
        <Stat label="Finished, 120 days" value={String(finished.length)} sub={`${Math.round((sum(finished, (x) => x.f.profit) / Math.max(1, sum(finished, (x) => x.f.total))) * 100)}% avg margin`} />
        <Stat label="Over budget, 120 days" value={String(over.length)} sub={`${usd(sum(over, (x) => Math.max(0, x.f.variance)))} over plan`} tone="warn" />
      </div>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip on={filter === "live"} onClick={() => setFilter("live")} count={live.length}>In progress</FilterChip>
        <FilterChip on={filter === "finished"} onClick={() => setFilter("finished")} count={finished.length}>Finished projects</FilterChip>
        <FilterChip on={filter === "over"} onClick={() => setFilter("over")} count={over.length}>Over budget</FilterChip>
      </div>
      <ul className="grid *:min-w-0 gap-3 lg:grid-cols-2">
        {list.map(({ j, f }) => (
          <li key={j.id}>
            <button type="button" onClick={() => open({ kind: "job", id: j.id })} className={`demo-card w-full space-y-3 p-4 text-left hover:border-(--d-accent) ${f.over ? "border-(--d-bad)/60" : ""}`}>
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold"><CrewDot crew={j.crew} /><span className="truncate">{j.title}</span></span>
                  <span className="block truncate text-[13px] text-(--d-muted)">{j.no} · {customer(j.customer).name} · {f.done ? `finished ${shortDate(j.end)}` : `${Math.round(f.progress * 100)}% of crew days`}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block font-semibold tabular-nums ${f.variance > 0 ? "text-(--d-bad)" : "text-(--d-good)"}`}>{f.variance > 0 ? "+" : "−"}{usd(Math.abs(f.variance))}</span>
                  {f.over ? <Pill tone="bad">Over budget</Pill> : <Pill tone="good">On track</Pill>}
                </span>
              </span>
              <BudgetBar label="Materials" budget={f.exp.materials} actual={f.actual.materials} />
              <BudgetBar label={`Labor · ${Math.round(f.actual.laborHours)} hr`} budget={f.exp.laborCost} actual={f.actual.laborCost} />
              {f.budget.subs ? <BudgetBar label="Subs" budget={f.exp.subs} actual={f.actual.subs} /> : null}
              <span className="block text-[13px] text-(--d-muted)">Contract {usd(f.total)} · {f.done ? "profit" : "projected"} {usd(f.profit)} ({Math.round(f.margin * 100)}%)</span>
            </button>
          </li>
        ))}
      </ul>
      {!list.length ? <p className="text-(--d-muted)">Nothing here.</p> : null}
      <Note>For live jobs each bar shows what should be spent by now (materials early, subs late, labor with crew days), so &ldquo;over&rdquo; means over pace.</Note>
    </div>
  );
}
