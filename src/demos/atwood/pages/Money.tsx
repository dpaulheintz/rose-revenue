"use client";

import { useMemo } from "react";
import { BarList, ColumnChart } from "@demos/kit/ui/charts";
import Icon from "@demos/kit/ui/Icon";
import { Button } from "@demos/kit/ui/ui";
import { EXPENSE_CATS, MILE_RATE } from "@demos/atwood/data";
import { money as moneyStats, monthName, shortDay } from "@demos/atwood/derive";
import { H, money, moneyK, Tile, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

const Panel = ({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) => (
  <section className="min-w-0 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4"><H>{title}</H>{children}{note ? <p className="mt-2 text-[14px] text-(--d-muted)">{note}</p> : null}</section>
);

export default function Money() {
  const { d, w, open } = useAt();
  const m = useMemo(() => moneyStats(d, w), [d, w]);
  const now = m.byMonth[m.byMonth.length - 1];
  const year = m.byMonth.reduce((s, x) => s + x.revenue, 0);
  const yearProfit = m.byMonth.reduce((s, x) => s + x.profit, 0);
  const yearMiles = m.byMonth.reduce((s, x) => s + x.miles, 0);
  const since = new Date(Date.UTC(+d.today.slice(0, 4), +d.today.slice(5, 7) - 12, 1)).toISOString().slice(0, 10);
  const cats = EXPENSE_CATS.map((c) => ({ key: c, label: c, value: w.expenses.filter((e) => e.category === c && e.date >= since).reduce((s, e) => s + e.amount, 0) })).sort((a, b) => b.value - a.value);
  const recent = [...w.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  return (
    <div className="space-y-5">
      <Title sub="What came in, what went out, and what to keep for taxes." action={<Button variant="primary" onClick={() => open({ kind: "expense" })}><Icon name="plus" size={18} />Log expense</Button>}>Money</Title>

      <section className="rounded-[16px] border-2 border-(--d-accent) bg-(--d-panel) p-4">
        <p className="text-[15px] text-(--d-muted)">Set aside for taxes this quarter</p>
        <p className="demo-display text-[40px] leading-none">{money(m.setAside)}</p>
        <p className="mt-2 text-[15px] text-(--d-muted)">25% of profit since {shortDay(m.qStart)}: {money(m.qRevenue)} in, {money(m.qExpenses)} expenses, {m.qMiles.toLocaleString("en-US")} miles at {Math.round(MILE_RATE * 100)}¢. A rough guide; your accountant has the final word.</p>
      </section>

      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label={`${monthName(now.month)} so far`} value={moneyK(now.revenue)} sub={`${moneyK(now.profit)} profit`} />
        <Tile label="Last 12 months" value={moneyK(year)} />
        <Tile label="Profit, 12 months" value={moneyK(yearProfit)} tone="good" sub="After expenses" />
        <Tile label="Business miles" value={yearMiles.toLocaleString("en-US")} sub={`${moneyK(yearMiles * MILE_RATE)} deduction`} />
      </div>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <Panel title="Revenue by month" note="Busy in spring and before winter. Tap a bar.">
          <div className="md:hidden"><ColumnChart title="Revenue and expenses, last 6 months" height={160} mode="group" format={moneyK} series={[{ name: "Revenue", color: "#266e71" }, { name: "Expenses", color: "#b88a2b" }]} columns={m.byMonth.slice(-6).map((x) => ({ label: monthName(x.month), values: [Math.round(x.revenue), Math.round(x.expenses)], note: x === now ? "so far" : undefined }))} /></div>
          <div className="hidden md:block"><ColumnChart title="Revenue and expenses, last 12 months" height={160} mode="group" labelEvery={2} format={moneyK} series={[{ name: "Revenue", color: "#266e71" }, { name: "Expenses", color: "#b88a2b" }]} columns={m.byMonth.map((x) => ({ label: monthName(x.month), values: [Math.round(x.revenue), Math.round(x.expenses)], note: x === now ? "so far" : undefined }))} /></div>
        </Panel>
        <Panel title="By job type, 12 months">
          <BarList rows={[...m.byType].sort((a, b) => b.revenue - a.revenue).map((t) => ({ key: t.key, label: t.label, value: Math.round(t.revenue) }))} format={moneyK} />
        </Panel>
        <Panel title="Expenses, 12 months">
          <BarList color="#b88a2b" rows={cats.map((c) => ({ ...c, value: Math.round(c.value) }))} format={moneyK} />
        </Panel>
        <Panel title="Latest expenses">
          <ul className="divide-y divide-(--d-line)">
            {recent.map((e) => <li key={e.id} className="flex min-h-12 items-center justify-between gap-3 py-2 text-[15.5px]"><span className="min-w-0"><span className="block font-bold">{e.note}</span><span className="text-[14px] text-(--d-muted)">{shortDay(e.date)}, {e.category}{e.receipt ? ", receipt saved" : ""}</span></span><span className="shrink-0 font-bold">{money(e.amount)}</span></li>)}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
