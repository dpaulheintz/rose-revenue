"use client";

import { useEffect, useRef } from "react";
import { Sparkline } from "@demos/kit/ui/charts";

export type ScoreWeek = { id: string; label: string; values: Record<string, number> };
export type ScoreRow = { key: string; label: string; goalText: string; fmt: (n: number) => string; hit: (n: number) => boolean };

/**
 * Leadership scorecard: one row per measure, a goal, a sparkline, then a
 * column per week (usually 13). Weeks that miss the goal are flagged. On narrow
 * screens the table scrolls inside its card and opens on the latest weeks.
 */
export function Scorecard({ weeks, rows, label = "Scorecard" }: { weeks: ScoreWeek[]; rows: ScoreRow[]; label?: string }) {
  const scroller = useRef<HTMLElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth; }, []);
  return (
    <section ref={scroller} className="demo-card demo-scroll-x" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[960px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-(--d-line) text-[12px] text-(--d-muted)">
            <th scope="col" className="sticky left-0 z-10 bg-(--d-panel) px-3 py-2.5 text-left font-semibold">Measure</th>
            <th scope="col" className="px-2 py-2.5 text-left font-semibold">Goal</th>
            <th scope="col" className="px-2 py-2.5 text-left font-semibold">Trend</th>
            {weeks.map((w) => <th key={w.id} scope="col" className="px-1.5 py-2.5 text-right font-semibold whitespace-nowrap">{w.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-(--d-line) last:border-0">
              <th scope="row" className="sticky left-0 z-10 bg-(--d-panel) px-3 py-2 text-left font-semibold whitespace-nowrap">{r.label}</th>
              <td className="px-2 py-2 whitespace-nowrap text-(--d-muted)">{r.goalText}</td>
              <td className="px-2 py-2"><Sparkline values={weeks.map((w) => w.values[r.key])} width={72} height={24} label={`${r.label}, ${weeks.length} weeks`} /></td>
              {weeks.map((w) => (
                <td key={w.id} className={`px-1.5 py-2 text-right whitespace-nowrap ${r.hit(w.values[r.key]) ? "text-(--d-text)" : "bg-[color-mix(in_oklab,var(--d-bad)_11%,transparent)] font-semibold text-(--d-bad)"}`}>{r.fmt(w.values[r.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
