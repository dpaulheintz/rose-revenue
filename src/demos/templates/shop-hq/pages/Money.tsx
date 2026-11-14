"use client";

import { AgingBuckets } from "@demos/kit/blocks/AgingBuckets";
import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { ColumnChart } from "@demos/kit/ui/charts";
import { monthName, shortDay } from "../derive";
import { Grid, money, moneyK, Panel, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";
import { JobRows } from "./Today";

export default function Money() {
  const { p, s } = useShop();
  const sum = (xs: Array<{ amount: number }>) => xs.reduce((t, j) => t + j.amount, 0);
  const year = s.months.reduce((t, m) => t + m.hvac + m.plumbing, 0);
  const both = p.trades.length > 1;
  const series = [{ name: "HVAC", color: "var(--d-c1)" }, { name: "Plumbing", color: "var(--d-c2)" }].filter((x) => p.trades.includes(x.name as "HVAC" | "Plumbing"));
  const cols = (ms: typeof s.months) => ms.map((m) => ({ label: monthName(m.month), values: series.map((x) => Math.round(x.name === "HVAC" ? m.hvac : m.plumbing)) }));
  return (
    <div className="space-y-6">
      <Title sub="What came in, what's out there, and how old it is.">Money</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Collected, last 7 days" value={money(sum(s.collected7))} tone="good" sub={`${s.collected7.length} payments`} list={() => <DrillList>{s.collected7.map((j) => <DrillRow key={j.id} title={j.customer.name} detail={`${j.invoice!.id}, paid ${shortDay(j.invoice!.paid!)}`} right={money(j.amount)} />)}</DrillList>} />
        <DrillStat label="Outstanding" value={money(sum(s.unpaid))} sub={`${s.unpaid.length} invoices`} list={() => <DrillList>{s.unpaid.map((j) => <DrillRow key={j.id} title={j.customer.name} detail={`${j.invoice!.id}, ${s.age(j)} days`} right={money(j.amount)} />)}</DrillList>} />
        <DrillStat label="Overdue" value={money(sum(s.overdue))} tone="bad" sub={`${s.overdue.length} past 15 days`} list={() => <DrillList>{s.overdue.map((j) => <DrillRow key={j.id} title={j.customer.name} detail={`${j.invoice!.id}, ${s.age(j)} days, ${j.customer.phone}`} right={money(j.amount)} />)}</DrillList>} />
        <DrillStat label="Last 12 months" value={moneyK(year)} list={() => <DrillList>{s.months.slice().reverse().map((m) => <DrillRow key={m.month} title={monthName(m.month)} detail={`${m.jobs.length} jobs`} right={money(m.hvac + m.plumbing)} />)}</DrillList>} />
      </Grid>

      <Panel title="Unpaid by age" note="Tap a bucket for the list.">
        <AgingBuckets title="Unpaid" items={s.unpaid} daysOf={s.age} amountOf={(j) => j.amount} getKey={(j) => j.id} money={money}
          renderItem={(j) => <div className="flex min-h-12 items-center justify-between gap-3 py-2"><span className="min-w-0"><span className="block font-semibold">{j.customer.name}</span><span className="text-[14px] text-(--d-muted)">{j.invoice!.id}, {s.age(j)} days</span></span><span className="font-semibold">{money(j.amount)}</span></div>} />
      </Panel>

      <Panel title={both ? "Revenue by month, HVAC and plumbing" : "Revenue by month"} note="Heating peaks in winter, cooling in summer. Tap a bar.">
        <div className="md:hidden"><ColumnChart title="Revenue, last 6 months" height={170} format={moneyK} series={series} columns={cols(s.months.slice(-6))} /></div>
        <div className="hidden md:block"><ColumnChart title="Revenue, last 12 months" height={190} format={moneyK} series={series} columns={cols(s.months)} /></div>
        <div className="mt-3"><DrillStat big={false} label="This month's jobs" value={s.months[11].jobs.length} list={() => <JobRows jobs={s.months[11].jobs.slice().reverse()} />} /></div>
      </Panel>
    </div>
  );
}
