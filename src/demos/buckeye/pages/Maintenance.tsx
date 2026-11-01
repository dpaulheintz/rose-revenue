"use client";

import { addDays, diffDays } from "@demos/kit/data/dates";
import { machineName, pmDue, shortDay } from "@demos/buckeye/derive";
import type { PM } from "@demos/buckeye/data";
import { industry as ind } from "@demos/buckeye/industry";
import { PhotoTile } from "@demos/kit/blocks/PhotoTile";
import { ResponsiveTable } from "@demos/kit/blocks/ResponsiveTable";
import { usd } from "@demos/kit/data/format";
import { BarList } from "@demos/kit/ui/charts";
import { Button, Card, PageHeader, Pill } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { Kpi, v } from "@demos/buckeye/parts/bits";

export default function Maintenance() {
  const { shop, st, k, markPm } = useShop();
  const rows = [...shop.pms].sort((a, b) => (pmDue(a, st) < pmDue(b, st) ? -1 : 1));
  const soon = rows.filter((p) => pmDue(p, st) >= shop.today && pmDue(p, st) <= addDays(shop.today, 14)).length;
  const downtime = shop.repairs.reduce((s, r) => s + r.downtime, 0);
  const spend = shop.repairs.reduce((s, r) => s + r.cost, 0);
  const pill = (p: PM) => {
    const due = pmDue(p, st);
    const days = diffDays(due, shop.today);
    return days < 0 ? <Pill tone="bad">{-days} days overdue</Pill> : days <= 14 ? <Pill tone="warn">Due in {days} days</Pill> : <Pill tone="good">OK</Pill>;
  };
  const byMachine = ind.machines.map((m) => ({ key: m.id, label: m.name, value: +shop.repairs.filter((r) => r.machineId === m.id).reduce((s, r) => s + r.downtime, 0).toFixed(1) })).filter((x) => x.value).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      <PageHeader title={v.MachinesNav} meta={`${ind.machines.length} ${v.machines}. ${k.overdue.length} PMs overdue.`} />
      <div className="grid grid-cols-2 gap-3 *:min-w-0 md:grid-cols-4">
        <Kpi label="Overdue PMs" value={k.overdue.length} sub="Also on the Dashboard" tone={k.overdue.length ? "bad" : "good"} />
        <Kpi label="Due in 14 days" value={soon} />
        <Kpi label="Downtime, 12 months" value={`${Math.round(downtime)} hr`} sub={`${shop.repairs.length} repairs`} />
        <Kpi label="Repair spend, 12 months" value={usd(spend)} />
      </div>

      <section className="space-y-3">
        <h2 className="demo-display text-[22px]">PM schedule</h2>
        <ResponsiveTable
          rows={rows.slice(0, 12)} getKey={(p) => p.id} minWidth={720}
          columns={[
            { key: "m", header: v.Machine, primary: true, cell: (p) => machineName(p.machineId) },
            { key: "t", header: "Task", cell: (p) => p.task },
            { key: "e", header: "Every", cell: (p) => `${p.every} days` },
            { key: "d", header: "Due", cell: (p) => shortDay(pmDue(p, st)) },
            { key: "s", header: "Status", cell: pill },
            { key: "a", header: "", hideOnCard: true, cell: (p) => <Button onClick={() => markPm(p.id)}>Mark done</Button> },
          ]}
          card={(p) => (
            <>
              <span className="flex items-start justify-between gap-3"><span className="min-w-0 font-semibold">{machineName(p.machineId)}</span>{pill(p)}</span>
              <span className="mt-0.5 block text-[13.5px] text-(--d-muted)">{p.task} · every {p.every} days</span>
              <Button className="mt-2 w-full" onClick={() => markPm(p.id)}>Mark done</Button>
            </>
          )}
        />
      </section>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-[2fr_3fr]">
        <Card title={`Downtime by ${v.machine}, 12 months`}>
          <BarList rows={byMachine} format={(n) => `${n} hr`} />
        </Card>
        <Card title="Repair log">
          <ul className="space-y-4">
            {shop.repairs.slice(0, 5).map((r) => (
              <li key={r.id} className="border-b border-(--d-line) pb-4 last:border-0 last:pb-0">
                <p className="flex items-start justify-between gap-3"><span className="min-w-0 font-semibold">{machineName(r.machineId)}: {r.title}</span><span className="shrink-0 font-semibold">{usd(r.cost)}</span></p>
                <p className="text-[13px] text-(--d-muted)">{shortDay(r.date)} · {r.downtime} hr down · {r.by}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 *:min-w-0 sm:max-w-sm">
                  {Array.from({ length: r.photos }, (_, i) => <PhotoTile key={i} id={`${r.id}-${i}`} tag={i ? "After" : "Before"} caption={`${r.title}, photo placeholder`} color={ind.brand.accent} size="sm" />)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
