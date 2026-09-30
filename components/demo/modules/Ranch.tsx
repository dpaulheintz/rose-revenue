"use client";

import { categorySplit, hourlyAverages, lastWeekend, quarterDays, recentWeekends, topCocktails, truckLeaderboard } from "@/lib/demo/derive";
import { addDays } from "@/lib/demo/dates";
import { dayDate, money, moneyK, num, shortDate } from "@/lib/demo/format";
import { useDemo } from "../DemoProvider";
import { BarList, ColumnChart, SplitBar } from "../charts";
import Icon from "../Icon";
import { Card, PageHeader, Pill, Stat } from "../ui";

const CAT_COLORS: Record<string, string> = { cocktails: "var(--d-accent)", food: "#c47a4a", tastings: "#c9c4bb", cigars: "#8a6d52", merch: "#7a9e7e" };
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`;

export default function Ranch() {
  const { cfg, ds, anchor } = useDemo();
  const lw = lastWeekend(ds);
  const hourly = hourlyAverages(ds, cfg);
  const cocktails = topCocktails(ds, cfg, 10);
  const split = categorySplit(ds);
  const weekends = recentWeekends(ds, 12).reverse();
  const trucks = truckLeaderboard(ds);
  const upcoming = ds.events.filter((e) => e.date >= anchor).slice(0, 10);
  const quarter = quarterDays(ds);
  const onSite = quarter.reduce((s, d) => s + d.total, 0);
  const visitors = quarter.reduce((s, d) => s + d.visitors, 0);

  return (
    <>
      <PageHeader title="Ranch" meta="On-site sales · open Fri 4–8pm & Sat 12–8pm · Sundays are private events · 13-week views unless noted" />

      {lw ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Stat label="Last weekend" value={moneyK(lw.total)} sub={<><Icon name="music" size={14} className="mr-1 inline -translate-y-px" />{lw.act}{lw.headliner ? " · headliner" : ""}</>} />
          </div>
          <Stat label="Cocktails sold" value={num(lw.cocktailsSold)} sub={moneyK(lw.cocktails)} />
          <Stat label="Food trucks" value={moneyK(lw.food)} sub={`${lw.days.map((d) => d.trucks.length).reduce((a, b) => a + b, 0)} truck-days`} />
          <Stat label="Cigar lounge" value={moneyK(lw.cigars)} />
          <Stat label="Visitors" value={num(lw.visitors)} sub={`${shortDate(lw.weekendOf)}–${shortDate(addDays(lw.weekendOf, 1))}`} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[3fr_2fr]">
        <Card title="Sales by hour, Friday vs Saturday">
          <ColumnChart
            title="Average sales per hour, Friday versus Saturday"
            mode="group"
            format={money}
            height={210}
            series={[{ name: "Friday", color: "#c9c4bb" }, { name: "Saturday", color: "var(--d-accent)" }]}
            columns={hourly.hours.map((h, i) => ({ label: `${hourLabel(h)}m`, values: [hourly.fri[i] as number, hourly.sat[i] as number] }))}
          />
          <p className="mt-3 text-[12.5px] text-(--d-muted)">Average per open hour over the last 13 weeks. Fridays open at 4.</p>
        </Card>
        <Card title="Where the money comes from">
          <SplitBar format={moneyK} parts={split.map((c) => ({ label: c.label, value: c.value, color: CAT_COLORS[c.key] }))} />
          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-(--d-line) pt-4">
            {[
              ["On-site sales", moneyK(onSite)],
              ["Visitors", num(visitors)],
              ["Spend / visitor", `$${(onSite / Math.max(1, visitors)).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-[11.5px] uppercase tracking-[0.08em] text-(--d-muted)">{k}</dt><dd className="demo-display mt-1 text-[22px]">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-[12.5px] text-(--d-muted)">Last 13 weeks, on-site only. Bottle shop sales are on the Sales page.</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title="Top 10 cocktails">
          <BarList
            format={num}
            rows={cocktails.map((c) => ({ key: c.name, label: c.name, value: c.qty, right: `${num(c.qty)} sold`, sub: moneyK(c.revenue) }))}
          />
        </Card>
        <Card title="Last 12 weekends">
          <BarList
            format={moneyK}
            color="#c9c4bb"
            rows={weekends.map((w) => ({
              key: w.weekendOf,
              label: <>{shortDate(w.weekendOf)} · <span className="font-medium">{w.act}</span>{w.headliner ? <Pill tone="accent" className="ml-2">Headliner</Pill> : null}</>,
              value: w.total,
              sub: `${w.stage} · ${num(w.visitors)} visitors`,
            }))}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[3fr_2fr]">
        <Card title="Upcoming private events (Sundays)" bodyClass="pb-2">
          <ul className="divide-y divide-(--d-line)/60">
            {upcoming.map((e) => (
              <li key={e.id} className="grid gap-x-4 gap-y-1 px-5 py-3 text-[14px] sm:grid-cols-[110px_1fr_auto] sm:items-center">
                <span className="text-(--d-muted)">{dayDate(e.date)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.host}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{e.type} · {e.guests} guests · {money(e.total)}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="text-[13px] text-(--d-muted)">Deposit {money(e.deposit)}</span>
                  <Pill tone={e.status === "Confirmed" ? "good" : e.status === "Deposit due" ? "bad" : "warn"}>{e.status === "Confirmed" ? "Deposit paid" : e.status}</Pill>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Food truck leaderboard" bodyClass="pb-2">
          <ol className="divide-y divide-(--d-line)/60">
            {trucks.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3 px-5 py-2.5 text-[14px]">
                <span className="demo-display w-6 text-[16px] text-(--d-accent)">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.name}{t.name === cfg.ranch.houseTruck ? <Pill tone="accent" className="ml-2">House</Pill> : null}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{t.days} days on site · {moneyK(t.sales / t.days)}/day</span>
                </span>
                <span className="font-medium">{moneyK(t.sales)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
