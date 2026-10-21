"use client";

import { useMemo } from "react";
import { monthLabel, shortDate } from "@/lib/demo/format";
import { byJobType, closedJobs, customerView, monthly, sum, winRate } from "@/lib/demo/shop/derive";
import { BarList, ColumnChart } from "../../charts";
import { Avatar, Card, Note, PageHeader, Stat } from "../../ui";
import { n, usd } from "../bits";
import { useShop } from "../ShopProvider";

const k = (n: number) => (Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 10_000 ? `$${(n / 1000).toFixed(1)}k` : usd(n));

export default function Sales() {
  const { book, seed, rows, open, customer } = useShop();
  const months = useMemo(() => monthly(book, rows), [book, rows]);
  const types = useMemo(() => byJobType(book, seed, rows), [book, seed, rows]);
  const closed = useMemo(() => closedJobs(book, seed, rows), [book, seed, rows]);
  const custs = useMemo(() => customerView(book, rows), [book, rows]);
  const wr = winRate(book);
  const invoiced = sum(months, (m) => m.invoiced);
  const collected = sum(months, (m) => m.collected);
  const revenue = sum(closed, (x) => x.f.total);
  const profit = sum(closed, (x) => x.f.profit);
  const big = closed.filter((x) => seed.jobTypes.find((t) => t.key === x.j.type)!.big);
  const ranked = closed.filter((x) => x.f.total >= 1500).sort((a, b) => b.f.margin - a.f.margin);

  // Lead sources: estimates decided in the window, by where the customer came from.
  const sources = seed.sources.map((s) => {
    const est = book.estimates.filter((e) => e.source === s.name && e.decided && e.decided >= book.windowStart);
    const won = est.filter((e) => e.status === "Approved");
    const jobs = closed.filter((x) => customer(x.j.customer).source === s.name);
    return { name: s.name, est: est.length, won: won.length, rate: est.length ? won.length / est.length : 0, revenue: sum(jobs, (x) => x.f.total), jobs: jobs.length };
  });
  const top = custs.filter((x) => x.paid > 0).sort((a, b) => b.paid - a.paid).slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader title="Sales" meta={`${monthLabel(book.months[0], true)} – ${monthLabel(book.months.at(-1)!, true)} · invoices, payments and finished jobs`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Invoiced, 12 months" value={k(invoiced)} sub={`${k(invoiced / 12)} a month`} />
        <Stat label="Collected, 12 months" value={k(collected)} sub={`${Math.round((collected / invoiced) * 100)}% of invoiced`} tone="good" />
        <Stat label="Gross profit" value={k(profit)} sub={`${Math.round((profit / revenue) * 100)}% margin on finished jobs`} />
        <Stat label="Average job" value={usd(revenue / Math.max(1, closed.length))} sub={`Big jobs avg ${k(sum(big, (x) => x.f.total) / Math.max(1, big.length))}`} />
        <Stat label="Estimate win rate" value={`${Math.round(wr.rate * 100)}%`} sub={`${wr.won} won of ${wr.decided}`} />
      </div>

      <Card title="Invoiced vs. collected, by month">
        <ColumnChart title="Invoiced and collected by month" mode="group" columns={months.map((m) => ({ label: monthLabel(m.month), values: [Math.round(m.invoiced), Math.round(m.collected)] }))} series={[{ name: "Invoiced", color: "var(--d-c1)" }, { name: "Collected", color: "var(--d-c2)" }]} format={k} height={220} />
        <Note>Remodels bill in spring and fall; HVAC calls spike in summer heat and the first cold snaps.</Note>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Revenue by job type">
          <BarList rows={types.map((r) => ({ key: r.t.key, label: r.t.label, value: r.revenue, right: k(r.revenue), sub: `${n(r.jobs, "job")} · avg ${usd(r.avg)}` }))} format={k} />
        </Card>
        <Card title="Gross profit + margin by job type">
          <div className="demo-scroll-x -mx-4 sm:-mx-5">
            <table className="w-full min-w-[420px] text-left text-[14px]">
              <thead className="text-[12.5px] text-(--d-muted)"><tr className="border-b border-(--d-line)"><th className="px-4 py-2 font-semibold sm:px-5">Type</th><th className="px-2 py-2 text-right font-semibold">Revenue</th><th className="px-2 py-2 text-right font-semibold">Profit</th><th className="px-4 py-2 text-right font-semibold sm:px-5">Margin</th></tr></thead>
              <tbody>
                {types.slice().sort((a, b) => b.margin - a.margin).map((r) => (
                  <tr key={r.t.key} className="border-b border-(--d-line) last:border-0">
                    <td className="px-4 py-2 font-semibold sm:px-5">{r.t.label}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{k(r.revenue)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{k(r.profit)}</td>
                    <td className="px-4 py-2 text-right sm:px-5"><span className={`font-semibold tabular-nums ${r.margin < 0.25 ? "text-(--d-warn)" : "text-(--d-good)"}`}>{Math.round(r.margin * 100)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>Finished jobs only. Profit = billed total minus materials, subs and crew hours at each person&apos;s cost.</Note>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Most vs. least profitable jobs">
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ title: "Best margin", xs: ranked.slice(0, 5), tone: "text-(--d-good)" }, { title: "Worst margin", xs: ranked.slice(-5).reverse(), tone: "text-(--d-bad)" }].map((g) => (
              <section key={g.title}>
                <h3 className="text-[13px] font-semibold text-(--d-muted)">{g.title}</h3>
                <ul className="mt-1 divide-y divide-(--d-line)">
                  {g.xs.map((x) => (
                    <li key={x.j.id}>
                      <button type="button" onClick={() => open({ kind: "job", id: x.j.id })} className="flex min-h-12 w-full items-center justify-between gap-2 py-1.5 text-left">
                        <span className="min-w-0"><span className="block truncate font-semibold">{x.j.title}</span><span className="block text-[12.5px] text-(--d-muted)">{x.j.no} · {shortDate(x.j.end)} · {usd(x.f.total)}</span></span>
                        <span className={`shrink-0 font-semibold tabular-nums ${g.tone}`}>{Math.round(x.f.margin * 100)}%</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>
        <Card title="Lead sources">
          <div className="demo-scroll-x -mx-4 sm:-mx-5">
            <table className="w-full min-w-[440px] text-left text-[14px]">
              <thead className="text-[12.5px] text-(--d-muted)"><tr className="border-b border-(--d-line)"><th className="px-4 py-2 font-semibold sm:px-5">Source</th><th className="px-2 py-2 text-right font-semibold">Estimates</th><th className="px-2 py-2 text-right font-semibold">Win rate</th><th className="px-4 py-2 text-right font-semibold sm:px-5">Revenue</th></tr></thead>
              <tbody>
                {sources.sort((a, b) => b.revenue - a.revenue).map((s) => (
                  <tr key={s.name} className="border-b border-(--d-line) last:border-0">
                    <td className="px-4 py-2 font-semibold sm:px-5">{s.name}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{s.est}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{Math.round(s.rate * 100)}%</td>
                    <td className="px-4 py-2 text-right tabular-nums sm:px-5">{k(s.revenue)} <span className="text-[12.5px] text-(--d-muted)">· {n(s.jobs, "job")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Top customers, 12 months">
        <ul className="grid *:min-w-0 gap-x-6 sm:grid-cols-2">
          {top.map((x, i) => (
            <li key={x.c.id} className="flex min-h-14 items-center gap-3 border-b border-(--d-line) py-2">
              <span className="w-5 text-right text-[13px] text-(--d-muted)">{i + 1}</span>
              <Avatar name={x.c.name} size={32} />
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.c.name}</span><span className="block text-[12.5px] text-(--d-muted)">{x.c.kind} · {n(x.jobs.length, "job")}</span></span>
              <span className="font-semibold tabular-nums">{usd(x.paid)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
