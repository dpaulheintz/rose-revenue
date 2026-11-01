"use client";

import { useEffect, useRef, useState } from "react";
import { addWork } from "@demos/buckeye/data";
import { shortDay } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { moneyK } from "@demos/kit/data/format";
import { Sparkline } from "@demos/kit/ui/charts";
import { Card, PageHeader, Pill } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";

type Row = { key: "onTime" | "scrap" | "utilization" | "cash" | "quotesWon"; label: string; goal: number; goalText: string; fmt: (n: number) => string; lowerIsBetter?: boolean };

export default function Scorecard() {
  const { shop, notify } = useShop();
  const t = ind.targets;
  // Narrow screens scroll this table; start on the latest weeks, which matter most.
  const scroller = useRef<HTMLElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth; }, []);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const rows: Row[] = [
    { key: "onTime", label: "On-time delivery", goal: t.onTime, goalText: `${t.onTime}%`, fmt: (n) => `${n.toFixed(0)}%` },
    { key: "scrap", label: ind.vocab.Scrap, goal: t.scrap, goalText: `Under ${t.scrap}%`, fmt: (n) => `${n.toFixed(1)}%`, lowerIsBetter: true },
    { key: "utilization", label: "Utilization", goal: t.utilization, goalText: `${t.utilization}%`, fmt: (n) => `${n.toFixed(0)}%` },
    { key: "cash", label: "Cash collected", goal: t.cash, goalText: moneyK(t.cash), fmt: (n) => moneyK(n) },
    { key: "quotesWon", label: "Quotes won", goal: t.quotesWon, goalText: `${t.quotesWon}`, fmt: (n) => `${n}` },
  ];
  const hit = (r: Row, n: number) => (r.lowerIsBetter ? n <= r.goal : n >= r.goal);
  const weeks = shop.weeks;
  const last = weeks[weeks.length - 1];
  const onTrack = rows.filter((r) => hit(r, last[r.key])).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Weekly Scorecard" meta={`Week of ${last.label}: ${onTrack} of ${rows.length} on goal. Built from the same ${ind.vocab.jobs} as every other screen, with no spreadsheet.`} />

      <section ref={scroller} className="demo-card demo-scroll-x" aria-label="Scorecard, last 13 weeks" tabIndex={0}>
        <table className="w-full min-w-[960px] border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-(--d-line) text-[12px] text-(--d-muted)">
              <th scope="col" className="sticky left-0 z-10 bg-(--d-panel) px-3 py-2.5 text-left font-semibold">Measure</th>
              <th scope="col" className="px-2 py-2.5 text-left font-semibold">Goal</th>
              <th scope="col" className="px-2 py-2.5 text-left font-semibold">Trend</th>
              {weeks.map((w) => <th key={w.start} scope="col" className="px-1.5 py-2.5 text-right font-semibold whitespace-nowrap">{w.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-(--d-line) last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-(--d-panel) px-3 py-2 text-left font-semibold whitespace-nowrap">{r.label}</th>
                <td className="px-2 py-2 whitespace-nowrap text-(--d-muted)">{r.goalText}</td>
                <td className="px-2 py-2"><Sparkline values={weeks.map((w) => w[r.key])} width={72} height={24} label={`${r.label}, 13 weeks`} /></td>
                {weeks.map((w) => (
                  <td key={w.start} className={`px-1.5 py-2 text-right whitespace-nowrap ${hit(r, w[r.key]) ? "text-(--d-text)" : "bg-[color-mix(in_oklab,var(--d-bad)_11%,transparent)] font-semibold text-(--d-bad)"}`}>{r.fmt(w[r.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <Card title="To-dos" action={<Pill>{ind.todos.length - Object.values(done).filter(Boolean).length} open</Pill>} bodyClass="px-2 pb-2 pt-2 sm:px-3">
          <ul>
            {ind.todos.map(([text, who, days], i) => (
              <li key={text} className="border-b border-(--d-line) last:border-0">
                <label className="flex min-h-12 items-center gap-3 rounded-[4px] px-2.5 py-1.5 hover:bg-(--d-panel2)">
                  <input type="checkbox" className="size-5 shrink-0 accent-(--d-accent)" checked={!!done[i]} onChange={(e) => { setDone((d) => ({ ...d, [i]: e.target.checked })); if (e.target.checked) notify(); }} />
                  <span className={`min-w-0 flex-1 ${done[i] ? "text-(--d-muted) line-through" : ""}`}>{text}<span className="block text-[12.5px] text-(--d-muted) no-underline">{ind.staff.find((s) => s.id === who)?.name} · due {shortDay(addWork(shop.today, days))}</span></span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Issues" action={<Pill tone="warn">{ind.issues.length - Object.values(solved).filter(Boolean).length} to solve</Pill>} bodyClass="px-2 pb-2 pt-2 sm:px-3">
          <ul>
            {ind.issues.map((text, i) => (
              <li key={text} className="border-b border-(--d-line) last:border-0">
                <label className="flex min-h-12 items-center gap-3 rounded-[4px] px-2.5 py-1.5 hover:bg-(--d-panel2)">
                  <input type="checkbox" className="size-5 shrink-0 accent-(--d-accent)" checked={!!solved[i]} onChange={(e) => { setSolved((d) => ({ ...d, [i]: e.target.checked })); if (e.target.checked) notify(); }} />
                  <span className={`min-w-0 flex-1 ${solved[i] ? "text-(--d-muted) line-through" : ""}`}>{text}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
