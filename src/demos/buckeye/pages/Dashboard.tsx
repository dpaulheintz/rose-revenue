"use client";

import Link from "next/link";
import { dayDate, monthLabel, moneyK } from "@demos/kit/data/format";
import { shipLabel, machineName } from "@demos/buckeye/derive";
import { useRouter } from "next/navigation";
import { industry as ind } from "@demos/buckeye/industry";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { BarList, ColumnChart, Sparkline } from "@demos/kit/ui/charts";
import { Button, Card, PageHeader, Pill } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { Kpi, Num, StatusPill, Traveler, v } from "@demos/buckeye/parts/bits";

export default function Dashboard() {
  const { base } = useDemo();
  const router = useRouter();
  const { shop, k, needs, customer, openJob, touring, setTouring } = useShop();
  const go = (path: string) => router.push(`${base}/${path}`);
  const trend = (key: "onTime" | "scrap" | "utilization") => shop.weeks.map((w) => w[key]);
  const lastMonth = shop.months[shop.months.length - 2];
  const t = ind.targets;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Owner Dashboard"
        meta={`${dayDate(shop.today)} · ${ind.company.people} people · ${k.open.length} open ${v.jobs}`}
        actions={<Button variant="primary" onClick={() => setTouring(true)} disabled={touring}><Icon name="play" size={16} />Take the tour</Button>}
      />

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[4px] bg-(--d-header) px-3.5 py-2 text-[12.5px] text-(--d-on-header)">
        <span className="font-semibold">Pulling from:</span>
        {ind.systems.map(([name, min]) => (
          <span key={name} className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-1.5 rounded-full bg-[#4fc98b]" aria-hidden="true" />{name} <span className="opacity-70">{min} min ago</span></span>
        ))}
      </p>

      <div className="grid grid-cols-2 gap-3 *:min-w-0 md:grid-cols-4">
        <Kpi label={shipLabel(shop)} value={k.shipping.length} sub={`${k.shipping.reduce((s, j) => s + j.qty, 0).toLocaleString("en-US")} ${v.unit} · ${moneyK(k.shipping.reduce((s, j) => s + j.price, 0))}`} onClick={() => go("jobs")} />
        <Kpi label="Open orders" value={k.open.length} sub={`${moneyK(k.openValue)} on the floor`} onClick={() => go("jobs")} />
        <Kpi label="On-time delivery" value={`${k.week.onTime.toFixed(0)}%`} sub={`Last week · goal ${t.onTime}%`} tone={k.week.onTime >= t.onTime ? "good" : "warn"} trend={<Sparkline values={trend("onTime")} width={64} height={26} label="On-time trend, 13 weeks" />} onClick={() => go("scorecard")} />
        <Kpi label={`${v.Machine} utilization`} value={`${k.week.utilization.toFixed(0)}%`} sub={`Last week · goal ${t.utilization}%`} tone={k.week.utilization >= t.utilization ? "good" : "warn"} trend={<Sparkline values={trend("utilization")} width={64} height={26} label="Utilization trend, 13 weeks" />} onClick={() => go("scorecard")} />
        <Kpi label={`${v.Scrap} rate`} value={`${k.week.scrap.toFixed(1)}%`} sub={`Last week · goal under ${t.scrap}%`} tone={k.week.scrap <= t.scrap ? "good" : "warn"} trend={<Sparkline values={trend("scrap")} width={64} height={26} label="Scrap trend, 13 weeks" />} onClick={() => go("quality")} />
        <Kpi label="Cash collected this month" value={moneyK(k.cash)} sub={`${moneyK(lastMonth.cash)} last month · ${moneyK(k.ar)} still owed`} onClick={() => go("scorecard")} />
        <Kpi label="Quotes waiting for approval" value={k.waiting.length} sub={`${moneyK(k.waitingValue)} to review`} tone={k.waiting.length ? "warn" : "good"} onClick={() => go("quotes")} />
        <Kpi label={`Late ${v.jobs}`} value={k.late.length} sub={`${k.atRisk.length} more at risk`} tone={k.late.length ? "bad" : "good"} onClick={() => go("jobs")} />
      </div>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-[3fr_2fr]">
        <Card title={<span className="inline-flex items-center gap-2">Needs attention <Pill tone="bad">{needs.length}</Pill></span>} bodyClass="px-2 pb-2 pt-2 sm:px-3">
          <ul>
            {needs.map((n) => {
              const inner = (
                <>
                  <span className={`mt-1 grid size-7 shrink-0 place-items-center rounded-[4px] ${n.tone === "bad" ? "bg-[color-mix(in_oklab,var(--d-bad)_14%,transparent)] text-(--d-bad)" : "bg-[color-mix(in_oklab,var(--d-warn)_16%,transparent)] text-(--d-warn)"}`}><Icon name="alert" size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{n.title}</span>
                    <span className="block text-[13px] leading-snug text-(--d-muted)">{n.detail}</span>
                  </span>
                  <Icon name="arrow" size={16} className="mt-1.5 shrink-0 text-(--d-muted)" />
                </>
              );
              const cls = "flex min-h-12 w-full items-start gap-3 rounded-[4px] p-2.5 text-left hover:bg-(--d-panel2)";
              return (
                <li key={n.key} className="border-b border-(--d-line) last:border-0">
                  {n.jobId ? <button type="button" className={cls} onClick={() => openJob(n.jobId!)}>{inner}</button> : <Link className={cls} href={`${base}/${n.path}`}>{inner}</Link>}
                </li>
              );
            })}
            {!needs.length ? <li className="p-3 text-(--d-muted)">Nothing needs you right now.</li> : null}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card title={shipLabel(shop)} bodyClass="px-2 pb-2 pt-2 sm:px-3">
            <ul>
              {k.shipping.map((j) => (
                <li key={j.id} className="border-b border-(--d-line) last:border-0">
                  <button type="button" onClick={() => openJob(j.id)} className="flex min-h-12 w-full items-center gap-3 rounded-[4px] p-2.5 text-left hover:bg-(--d-panel2)">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold"><Num>{j.id}</Num> · {customer(j.customerId).name}</span>
                      <span className="mt-0.5 block"><Traveler steps={j.steps} current={j.current} /></span>
                    </span>
                    <StatusPill status={j.status} />
                  </button>
                </li>
              ))}
              {!k.shipping.length ? <li className="p-3 text-(--d-muted)">Nothing due to ship.</li> : null}
            </ul>
          </Card>
          <Card className="border-l-4 border-l-(--d-accent)">
            <p className="demo-display text-[19px] leading-tight">This could be running your {v.shop}.</p>
            <p className="mt-1.5 text-[14px] text-(--d-muted)">Rose Revenue builds it around how you already work. You own the code and the data, with no vendor to rent from.</p>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 *:min-w-0 md:grid-cols-2">
        <Card title="Cash collected by month">
          <ColumnChart title="Cash collected by month" mode="group" height={120} format={moneyK} series={[{ name: "Cash", color: "var(--d-accent)" }]} columns={shop.months.slice(-6).map((m) => ({ label: monthLabel(m.month), values: [m.cash] }))} />
        </Card>
        <Card title={`${v.Machine} utilization, last 4 weeks`}>
          <BarList rows={ind.machines.map((m) => ({ key: m.id, label: machineName(m.id), value: Math.round(shop.machineUse.get(m.id) ?? 0) })).sort((a, b) => b.value - a.value).slice(0, 5)} format={(n) => `${n}%`} />
        </Card>
      </div>
    </div>
  );
}
