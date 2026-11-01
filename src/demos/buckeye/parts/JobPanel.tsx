"use client";

import Link from "next/link";
import { diffDays } from "@demos/kit/data/dates";
import { laneLabel, machineName, shortDay } from "@demos/buckeye/derive";
import { price } from "@demos/buckeye/data";
import { industry as ind } from "@demos/buckeye/industry";
import { usd } from "@demos/kit/data/format";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { Button, Pill } from "@demos/kit/ui/ui";
import { useShop } from "./BuckeyeProvider";
import { LotTag, Num, StatusPill, v } from "./bits";

/** Tapping a job anywhere opens this: one record, from quote to invoice. */
export default function JobPanel() {
  const { base } = useDemo();
  const { shop, st, k, quotes, jobId, openJob, customer, material, notify } = useShop();
  const live = k.open.find((j) => j.id === jobId);
  const past = shop.history.find((j) => j.id === jobId);
  const j = live ?? past;
  if (!j) return null;
  const part = shop.partOf(j.partId);
  const c = customer(j.customerId);
  const m = material(j.materialId);
  const q = quotes.find((x) => x.id === j.quoteId);
  const heat = shop.heats.find((h) => h.heat === j.heat);
  const est = q ? price(ind, { route: part.route, qty: q.qty, cycleMin: q.cycleMin, setupHr: q.setupHr, perPc: part.perPc, materialCost: m.cost, margin: q.margin }) : null;
  const shipped = !!j.shipDate;
  const stepAt = j.steps[j.current];
  const passed = shipped || j.steps.slice(0, j.current).some((s) => ind.operations[s.op]?.inspect);

  const flow = [
    { label: "Quote", value: j.quoteId, done: true },
    { label: v.Job, value: j.id, done: true },
    { label: "Material", value: j.heat, done: j.current > 0 },
    { label: v.Machine, value: live?.atMachine ?? (shipped ? "Complete" : stepAt.label), done: shipped, now: !shipped },
    { label: "Inspection", value: passed ? "Passed" : "Waiting", done: passed },
    { label: "Ship", value: shipped ? shortDay(j.shipDate!) : shortDay(j.dueDate), done: shipped },
    { label: "Invoice", value: j.invoice?.id ?? "On ship", done: !!j.invoice },
  ];
  const timeline = [
    ...(q ? [{ date: q.date, text: `Quote ${q.id} by ${q.by} at ${usd(q.price)}` }] : []),
    { date: j.orderDate, text: `Order received. Quote became ${j.id} with nothing retyped.` },
    ...j.steps.filter((s) => s.state === "done").map((s) => ({ date: s.date, text: `${s.label} done${s.machineId ? ` on ${machineName(s.machineId)}` : ""}${s.operator ? ` by ${s.operator}` : ""}` })),
    ...(live && stepAt ? [{ date: shop.today, text: `Now at ${stepAt.label}${live.atMachine ? ` on ${live.atMachine}` : ` (${laneLabel(live.at)})`}` }] : []),
    ...(st.moved[j.id] ?? []),
    ...(j.shipDate ? [{ date: j.shipDate, text: `Shipped, invoiced ${j.invoice?.id ?? ""}` }] : []),
  ].sort((a, b) => diffDays(b.date, a.date));

  return (
    <Dialog
      open drawer onClose={() => openJob(null)}
      title={<>{j.id} <span className="text-(--d-muted)">· {c.name}</span></>}
      subtitle={<span className="flex flex-wrap items-center gap-x-2 gap-y-1">{live ? <StatusPill status={live.status} /> : <Pill tone="good">Shipped</Pill>}<span>{part.name} · <Num>{part.number}</Num> rev {part.rev} · {j.qty.toLocaleString("en-US")} {v.unit}</span></span>}
      footer={<><Link href={`${base}/customers`} onClick={() => openJob(null)} className="inline-flex min-h-12 items-center rounded-xl px-4 text-[14.5px] font-semibold text-(--d-accent)">Open customer</Link><Button variant="primary" onClick={() => notify()}>Send status to customer</Button></>}
    >
      <div className="space-y-5 text-[14px]">
        {live ? <p className={live.status === "On track" ? "text-(--d-muted)" : live.status === "Late" ? "font-semibold text-(--d-bad)" : "font-semibold text-(--d-warn)"}>Due {shortDay(j.dueDate)}. {live.why}.</p> : null}

        <section aria-label="One record from quote to invoice">
          <h3 className="demo-display text-[17px]">Entered once, at the quote</h3>
          <p className="mb-2 text-[13px] text-(--d-muted)">Same record all the way through. Nobody retypes it.</p>
          <ol className="grid grid-cols-2 gap-1.5 *:min-w-0 sm:grid-cols-4">
            {flow.map((f) => (
              <li key={f.label} className={`rounded-[4px] border px-2 py-1.5 ${f.now ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_8%,var(--d-panel))]" : f.done ? "border-(--d-line) bg-(--d-panel2)" : "border-dashed border-(--d-line)"}`}>
                <span className="block text-[11.5px] text-(--d-muted)">{f.label}</span>
                <span className="demo-mono block truncate text-[12.5px]">{f.value}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="demo-display mb-1 text-[17px]">Routing</h3>
          <ol>
            {j.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 border-b border-(--d-line) py-2 last:border-0">
                <span className={`mt-1 grid size-5 shrink-0 place-items-center rounded-[3px] border-2 ${s.state === "done" ? "border-(--d-accent) bg-(--d-accent) text-white" : s.state === "now" ? "border-[#2a2208]" : "border-(--d-line)"}`} style={s.state === "now" ? { background: ind.brand.highlight } : undefined}>
                  {s.state === "done" ? <Icon name="check" size={12} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{s.label}</span>
                  <span className="block text-[13px] text-(--d-muted)">
                    {[s.state === "now" && live?.atMachine ? live.atMachine : machineName(s.machineId), s.operator, s.hours ? `${s.hours.toFixed(1)} hr` : null].filter(Boolean).join(" · ") || `Off the ${v.machines}`}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-(--d-muted)">{s.state === "done" ? shortDay(s.date) : s.state === "now" ? "Now" : `Plan ${shortDay(s.date)}`}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="demo-display mb-1 text-[17px]">Materials</h3>
          <div className="rounded-[4px] border border-(--d-line) p-3">
            <p className="font-semibold">{m.name}</p>
            <p className="text-[13px] text-(--d-muted)">Needs {Math.round(j.matNeed)} {m.unit} · {m.onHand} {m.unit} in stock</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">{v.heat} <LotTag>{j.heat}</LotTag> {heat ? <>{v.cert} <Num>{heat.cert}</Num></> : null} {v.Lot} <LotTag>{j.lot}</LotTag></p>
            {live?.short ? <p className="mt-2 text-[13px] font-semibold text-(--d-bad)">Short {live.short.short} {m.unit} on {shortDay(live.short.need)}. See Inventory.</p> : null}
          </div>
        </section>

        {q && est ? (
          <section>
            <h3 className="demo-display mb-1 text-[17px]">The quote it came from</h3>
            <div className="rounded-[4px] border border-(--d-line) p-3 text-[13px]">
              <p className="flex justify-between gap-3"><span><Num>{q.id}</Num> · {shortDay(q.date)} · {q.by}</span><span className="font-semibold">{usd(q.price)}</span></p>
              <p className="mt-1 text-(--d-muted)">{est.hours.toFixed(1)} machine hours · {usd(est.material)} material{est.outside ? ` · ${usd(est.outside)} outside` : ""} · {Math.round(q.margin * 100)}% margin</p>
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="demo-display mb-1 text-[17px]">Activity</h3>
          <ol className="space-y-1.5">
            {timeline.map((t, i) => (
              <li key={i} className="flex gap-3 text-[13.5px]"><span className="w-12 shrink-0 text-(--d-muted)">{shortDay(t.date)}</span><span className="min-w-0">{t.text}</span></li>
            ))}
          </ol>
        </section>
      </div>
    </Dialog>
  );
}
