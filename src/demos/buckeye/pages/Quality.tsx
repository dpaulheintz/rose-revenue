"use client";

import { useState } from "react";
import { addDays } from "@demos/kit/data/dates";
import { lookup, machineName, ncsLive, shortDay } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { ResponsiveTable } from "@demos/kit/blocks/ResponsiveTable";
import { BarList, LineChart } from "@demos/kit/ui/charts";
import { EmptyState } from "@demos/kit/ui/EmptyState";
import Icon from "@demos/kit/ui/Icon";
import { Button, Card, Field, PageHeader, Pill } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { LotTag, Num, v } from "@demos/buckeye/parts/bits";

export default function Quality() {
  const { shop, st, k, customer, material, openJob, closeNc, notify } = useShop();
  const ncs = ncsLive(shop, st);
  const samples = [shop.history[shop.history.length - 9], shop.history[shop.history.length - 40]];
  const [q, setQ] = useState(samples[0].lot);
  const found = lookup(shop, st.extraJobs, q);

  const atInspect = k.open.filter((j) => ind.operations[j.steps[j.current].op]?.inspect);
  const [checkJob, setCheckJob] = useState(atInspect[0]?.id ?? k.open[0].id);
  const [marks, setMarks] = useState<Record<string, "pass" | "fail">>({});
  const items = ind.inspectionSteps.map((s) => ({ s, key: `${checkJob}|${s}`, val: marks[`${checkJob}|${s}`] }));
  const done = items.filter((i) => i.val).length;
  const fails = items.filter((i) => i.val === "fail").length;

  const causes = new Map<string, number>();
  for (const j of shop.history) if (j.scrapQty && j.scrapCause) causes.set(j.scrapCause, (causes.get(j.scrapCause) ?? 0) + j.scrapQty);
  const closeBy = addDays(shop.today, 1);

  return (
    <div className="space-y-5">
      <PageHeader title="Quality & Traceability" meta={`${k.openNcs.length} open ${v.nc}${k.openNcs.length === 1 ? "" : "s"}. ${v.Scrap} last week ${k.week.scrap.toFixed(1)}%.`} />

      <Card title={`Look up a ${v.lot}`}>
        <Field label={`Type a ${v.lot}`}>
          <span className="relative block">
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
            <input className="demo-input demo-mono pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${ind.formats.lot}51234`} autoComplete="off" spellCheck={false} />
          </span>
        </Field>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-(--d-muted)">
          Try:
          <button type="button" className="inline-flex min-h-12 items-center" onClick={() => setQ(samples[0].lot)}><LotTag>{samples[0].lot}</LotTag></button>
          <button type="button" className="inline-flex min-h-12 items-center" onClick={() => setQ(samples[1].heat)}><LotTag>{samples[1].heat}</LotTag></button>
        </p>
        {found.length ? (
          <ul className="mt-2 space-y-3">
            {found.map((j) => {
              const heat = shop.heats.find((h) => h.heat === j.heat);
              const main = j.steps.filter((s) => s.machineId && s.state !== "next").at(-1);
              const part = shop.partOf(j.partId);
              const facts: Array<[string, React.ReactNode]> = [
                [v.cert, heat ? <><Num>{heat.cert}</Num><span className="block text-[12.5px] text-(--d-muted)">{v.heat} {j.heat}, {material(j.materialId).name}</span></> : j.heat],
                [v.Job, <button key="j" type="button" onClick={() => openJob(j.id)} className="inline-flex min-h-12 items-center font-semibold text-(--d-accent) underline underline-offset-2"><Num>{j.id}</Num></button>],
                [v.Machine, machineName(main?.machineId) ?? "Not started"],
                [v.Operator, main?.operator ?? "Not started"],
                ["Inspection", j.shipDate ? (j.scrapQty >= j.qty * 0.03 ? `Passed after sort, ${j.scrapQty} rejected · ${j.inspector}` : `Passed · ${j.inspector}`) : "Not yet"],
                ["Ship date", j.shipDate ? shortDay(j.shipDate) : `Due ${shortDay(j.dueDate)}`],
              ];
              return (
                <li key={j.id} className="rounded-[4px] border border-(--d-line) p-3.5">
                  <p className="flex flex-wrap items-center gap-2 font-semibold"><LotTag>{j.lot}</LotTag>{part.name}</p>
                  <p className="text-[13px] text-(--d-muted)">{customer(j.customerId).name} · <Num>{part.number}</Num> · {j.qty.toLocaleString("en-US")} {v.unit}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 *:min-w-0 md:grid-cols-3">
                    {facts.map(([label, val]) => <div key={label}><dt className="text-[12.5px] text-(--d-muted)">{label}</dt><dd className="text-[14px]">{val}</dd></div>)}
                  </dl>
                </li>
              );
            })}
          </ul>
        ) : <div className="mt-3"><EmptyState title={`Nothing found for that ${v.lot}`} hint="Tap one of the examples above." /></div>}
      </Card>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <Card title={`${v.Scrap} trend, 13 weeks`}>
          <LineChart title={`${v.Scrap} rate by week`} height={150} labelEvery={3} labels={shop.weeks.map((w) => w.label)} format={(n) => `${n.toFixed(1)}%`} target={{ value: ind.targets.scrap, label: "Goal" }} series={[{ name: v.Scrap, color: "var(--d-accent)", values: shop.weeks.map((w) => +w.scrap.toFixed(2)) }]} />
          <h3 className="demo-display mt-4 mb-2 text-[17px]">{v.Scrap} by cause, 12 months</h3>
          <BarList rows={[...causes].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ key: label, label, value }))} format={(n) => `${n.toLocaleString("en-US")} ${v.unit}`} />
        </Card>

        <Card title="Inspection checklist" action={fails ? <Pill tone="bad">{fails} failed</Pill> : done === items.length ? <Pill tone="good">All passed</Pill> : <Pill>{done} of {items.length}</Pill>}>
          <Field label={`${v.Job} at the bench`}>
            <select className="demo-input" value={checkJob} onChange={(e) => setCheckJob(e.target.value)}>
              {[...atInspect, ...k.open.filter((j) => !atInspect.includes(j))].map((j) => <option key={j.id} value={j.id}>{j.id} · {shop.partOf(j.partId).name}</option>)}
            </select>
          </Field>
          <ul className="mt-2">
            {items.map(({ s, key, val }) => (
              <li key={s} className="flex items-center justify-between gap-3 border-b border-(--d-line) py-1 last:border-0">
                <span className="min-w-0 text-[14px]">{s}</span>
                <span className="flex shrink-0 gap-1" role="group" aria-label={s}>
                  {(["pass", "fail"] as const).map((m) => (
                    <button key={m} type="button" aria-pressed={val === m} onClick={() => setMarks((x) => ({ ...x, [key]: m }))} className={`min-h-12 w-14 rounded-[4px] border text-[13.5px] font-semibold capitalize ${val === m ? (m === "pass" ? "border-(--d-good) bg-(--d-good) text-white" : "border-(--d-bad) bg-(--d-bad) text-white") : "border-(--d-line) text-(--d-muted)"}`}>{m}</button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end"><Button variant="primary" disabled={done < items.length} onClick={() => notify()}>Sign off inspection</Button></div>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="demo-display text-[22px]">{v.NC} log</h2>
        <ResponsiveTable
          rows={ncs.slice(0, 16)} getKey={(n) => n.id} minWidth={820}
          columns={[
            { key: "id", header: "No.", primary: true, cell: (n) => <Num>{n.id}</Num> },
            { key: "d", header: "Date", cell: (n) => shortDay(n.date) },
            { key: "j", header: v.Job, cell: (n) => <Num>{n.jobId}</Num> },
            { key: "c", header: "Cause", cell: (n) => n.cause },
            { key: "q", header: "Qty", align: "right", cell: (n) => n.qty },
            { key: "s", header: "Status", cell: (n) => (n.status === "Open" ? <Pill tone="bad">Open</Pill> : <Pill tone="good">{n.disposition}</Pill>) },
            { key: "a", header: "", hideOnCard: true, cell: (n) => (n.status === "Open" ? <Dispose onPick={(d) => closeNc(n.id, d)} label={n.id} /> : null) },
          ]}
          card={(n) => (
            <>
              <span className="flex items-start justify-between gap-3"><span className="min-w-0 font-semibold"><Num>{n.id}</Num> · <Num>{n.jobId}</Num></span>{n.status === "Open" ? <Pill tone="bad">Open</Pill> : <Pill tone="good">{n.disposition}</Pill>}</span>
              <span className="mt-0.5 block text-[13px] text-(--d-muted)">{shortDay(n.date)} · {n.qty} {v.unit} · {n.cause}</span>
              {n.status === "Open" ? <span className="mt-2 block"><Dispose onPick={(d) => closeNc(n.id, d)} label={n.id} /></span> : null}
            </>
          )}
        />
        <p className="text-[13px] text-(--d-muted)">Close one out and it clears from the Dashboard too. Target: every open one decided by {shortDay(closeBy)}.</p>
      </section>
    </div>
  );
}

function Dispose({ onPick, label }: { onPick: (d: string) => void; label: string }) {
  return (
    <select className="demo-input" aria-label={`Disposition for ${label}`} value="" onChange={(e) => e.target.value && onPick(e.target.value)}>
      <option value="">Decide...</option>
      {ind.dispositions.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  );
}
