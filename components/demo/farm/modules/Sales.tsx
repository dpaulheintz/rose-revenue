"use client";

import { useMemo, useState } from "react";
import { addDays, monthKey } from "@/lib/demo/dates";
import { money, moneyK, monthLabel, num, pct } from "@/lib/demo/format";
import { CHANNELS, monthToDate, pastOrders, profitByEnterprise, revenueByMonth, skuSales, sum } from "@/lib/demo/farm/derive";
import { BarList, ColumnChart, SplitBar } from "../../charts";
import { Avatar, Card, Note, PageHeader, Segmented, Stat } from "../../ui";
import { useFarm } from "../FarmProvider";

const COLORS = ["var(--d-c1)", "var(--d-c2)", "var(--d-c3)", "var(--d-c4)", "var(--d-c6)", "var(--d-c5)"];

export default function Sales() {
  const { ds, seed, sku, stats } = useFarm();
  const months = useMemo(() => revenueByMonth(ds, seed), [ds, seed]);
  const mtd = useMemo(() => monthToDate(ds, seed), [ds, seed]);
  const past = useMemo(() => pastOrders(ds).filter((o) => o.date >= ds.windowStart && o.date < `${monthKey(ds.anchor)}-01`), [ds]);
  const total = sum(months, (m) => m.total);
  const online = past.filter((o) => o.channel === "delivery" || o.channel === "pickup");
  const aov = sum(online, (o) => o.total) / Math.max(1, online.length);

  const [metric, setMetric] = useState<"revenue" | "units">("revenue");
  const [range, setRange] = useState<"13w" | "12m">("12m");
  const best = useMemo(() => {
    const from = range === "13w" ? ds.weeks[0] : ds.windowStart;
    const to = range === "13w" ? addDays(ds.weeks.at(-1)!, 6) : addDays(`${monthKey(ds.anchor)}-01`, -1);
    return [...skuSales(ds, from, to)].map(([id, v]) => ({ id, ...v })).sort((a, b) => b[metric] - a[metric]).slice(0, 10);
  }, [ds, metric, range]);

  // New vs. returning: distinct customers per month, "new" = their first order ever.
  const newVsReturning = useMemo(() => {
    const first = new Map<string, string>();
    for (const s of stats.values()) if (s.first && s.c.joined >= ds.simStart) first.set(s.c.id, monthKey(s.first));
    return ds.months.map((m) => {
      const ids = new Set(past.filter((o) => o.customer && o.date.startsWith(m)).map((o) => o.customer!));
      let fresh = 0;
      for (const id of ids) if (first.get(id) === m) fresh++;
      return { label: monthLabel(m), values: [fresh, ids.size - fresh] };
    });
  }, [stats, ds, past]);
  const newTotal = sum(newVsReturning, (m) => m.values[0]);

  const top = useMemo(() => [...stats.values()].sort((a, b) => b.spend - a.spend).slice(0, 8), [stats]);
  const ent = useMemo(() => profitByEnterprise(ds, seed), [ds, seed]);
  const chTotals = CHANNELS.map((c) => ({ label: c.label, value: sum(months, (m) => m.by[c.key]) }));

  return (
    <div className="space-y-5">
      <PageHeader title="Sales" meta={`${monthLabel(ds.months[0], true)} – ${monthLabel(ds.months.at(-1)!, true)} · orders from GrazeCart + farm store, herdshare fees from QuickBooks`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Revenue, last 12 months" value={moneyK(total)} sub={`${moneyK(total / 12)} a month on average`} />
        <Stat label={`${monthLabel(monthKey(ds.anchor))} so far`} value={moneyK(mtd.revenue)} sub={`${mtd.days} days in`} />
        <Stat label="Average order (online)" value={money(aov)} sub="Home delivery + pickup" />
        <Stat label="Orders, 12 months" value={num(past.length)} sub={`${num(past.filter((o) => o.channel === "store").length)} at the farm store`} />
        <Stat label="New customers" value={num(newTotal)} sub="First order in the last 12 months" />
      </div>

      <Card title="Revenue by channel">
        <ColumnChart
          title="Monthly revenue by channel"
          columns={months.map((m) => ({ label: monthLabel(m.month), values: CHANNELS.map((c) => Math.round(m.by[c.key])) }))}
          series={CHANNELS.map((c, i) => ({ name: c.label, color: COLORS[i] }))}
          format={moneyK}
          height={230}
        />
        <Note>Tap a month to see its split. Freezer bundles and holiday cheese drive the fall bump; November carries the Thanksgiving turkeys.</Note>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Channel mix, 12 months">
          <SplitBar parts={chTotals.map((c, i) => ({ label: c.label, value: c.value, color: COLORS[i] }))} format={moneyK} />
        </Card>
        <Card
          title="Best sellers"
          action={
            <div className="flex flex-wrap gap-2">
              <Segmented label="Measure" value={metric} onChange={setMetric} options={[{ value: "revenue", label: "Revenue" }, { value: "units", label: "Units" }]} />
              <Segmented label="Range" value={range} onChange={setRange} options={[{ value: "13w", label: "13 weeks" }, { value: "12m", label: "12 months" }]} />
            </div>
          }
        >
          <BarList
            rows={best.map((b) => ({ key: b.id, label: sku.get(b.id)?.name ?? b.id, value: b[metric], right: metric === "revenue" ? moneyK(b.revenue) : `${num(b.units)} ${sku.get(b.id)?.unit.split(",")[0]}` }))}
            format={metric === "revenue" ? moneyK : num}
          />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="New vs. returning customers">
          <ColumnChart title="Customers ordering each month" columns={newVsReturning} series={[{ name: "New", color: "var(--d-c2)" }, { name: "Returning", color: "var(--d-c1)" }]} mode="group" format={num} height={200} />
        </Card>
        <Card title="Top customers, 12 months">
          <ol className="divide-y divide-(--d-line)">
            {top.map((x, i) => (
              <li key={x.c.id} className="flex min-h-12 items-center gap-3 py-2">
                <span className="w-5 text-right text-[13px] text-(--d-muted)">{i + 1}</span>
                <Avatar name={x.c.name} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{x.c.name}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{x.count} orders · {x.segments.join(" · ") || x.c.town}</span>
                </span>
                <span className="font-semibold">{money(x.spend)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title="Profit by enterprise" action={<span className="text-[13px] text-(--d-muted)">Estimates · last 12 months</span>}>
        <div className="demo-scroll-x -mx-4 sm:-mx-5">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)">
                <th className="px-4 py-2.5 font-semibold sm:px-5">Enterprise</th>
                <th className="px-3 py-2.5 text-right font-semibold">Revenue</th>
                <th className="px-3 py-2.5 text-right font-semibold">Direct costs</th>
                <th className="px-3 py-2.5 text-right font-semibold">Margin</th>
                <th className="px-3 py-2.5 text-right font-semibold">Acres</th>
                <th className="px-3 py-2.5 text-right font-semibold">Margin / acre</th>
                <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Margin / labor hr</th>
              </tr>
            </thead>
            <tbody>
              {ent.map((e) => (
                <tr key={e.key} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2.5 font-semibold sm:px-5">{e.label}</td>
                  <td className="px-3 py-2.5 text-right">{moneyK(e.revenue)}</td>
                  <td className="px-3 py-2.5 text-right text-(--d-muted)">{moneyK(e.cost)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{moneyK(e.margin)} <span className="font-normal text-(--d-muted)">{pct(e.margin / Math.max(1, e.revenue))}</span></td>
                  <td className="px-3 py-2.5 text-right">{e.acres || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{e.perAcre == null ? "—" : money(e.perAcre)}</td>
                  <td className="px-4 py-2.5 text-right sm:px-5">{money(e.perHour)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>Direct costs here are sample ratios. In the real system they come from your QuickBooks categories (feed, processing, packaging) and labor hours from the chore log.</Note>
      </Card>
    </div>
  );
}
