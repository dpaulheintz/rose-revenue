"use client";

import { useState } from "react";
import Icon from "@demos/kit/ui/Icon";
import { Button } from "@demos/kit/ui/ui";
import { jobType } from "@demos/atwood/data";
import { invoiceState, shortDay } from "@demos/atwood/derive";
import { Card, Chip, H, money, PAY_TONE, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

type Tab = "estimates" | "Unpaid" | "Overdue" | "Paid";

export default function Billing() {
  const { d, w, customer, open } = useAt();
  const [tab, setTab] = useState<Tab>("Unpaid");
  const [limit, setLimit] = useState(20);
  const invoices = w.jobs.filter((j) => j.invoice).map((j) => ({ j, state: invoiceState(d.today, j.invoice!) }));
  const count = (s: Tab) => (s === "estimates" ? w.estimates.filter((e) => e.status === "Sent" || e.status === "Viewed").length : invoices.filter((x) => x.state === s).length);
  const shown = invoices.filter((x) => x.state === tab).reverse();
  const label: Record<Tab, string> = { estimates: "Estimates", Unpaid: "Unpaid", Overdue: "Overdue", Paid: "Paid" };
  return (
    <div className="space-y-4">
      <Title sub="Good, better, best estimates, deposits, invoices and payments." action={<Button variant="primary" onClick={() => open({ kind: "newEstimate" })}><Icon name="plus" size={18} />New estimate</Button>}>Estimates &amp; invoices</Title>
      <div role="tablist" aria-label="Billing" className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1">
        {(["Unpaid", "Overdue", "estimates", "Paid"] as Tab[]).map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setLimit(20); }} className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-[15.5px] font-bold ${tab === t ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{label[t]}<span className={`rounded-full px-1.5 text-[13px] ${tab === t ? "bg-black/15" : "bg-(--d-panel2) text-(--d-muted)"}`}>{count(t)}</span></button>)}
      </div>

      {tab === "estimates" ? (
        <section>
          <H>Estimates</H>
          <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
            {w.estimates.map((e) => {
              const c = customer(e.customer);
              const o = e.options[e.chosen ?? 1];
              return <li key={e.id}><Card title={c.name} meta={<>{e.title}<br />{e.status === "Approved" ? `${o.tier}, ${money(o.price)}. Deposit ${money(o.price * e.deposit)}` : `${money(e.options[0].price)} to ${money(e.options[2].price)}. Sent ${shortDay(e.date)}`}</>} right={<Chip tone={e.status === "Approved" ? "good" : e.status === "Declined" ? "bad" : e.status === "Viewed" ? "info" : "neutral"}>{e.status}</Chip>} onClick={() => open({ kind: "estimate", id: e.id })} /></li>;
            })}
          </ul>
        </section>
      ) : (
        <section>
          <H>{shown.length} {label[tab].toLowerCase()} {shown.length === 1 ? "invoice" : "invoices"}, {money(shown.reduce((s, x) => s + x.j.invoice!.amount, 0))}</H>
          <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
            {shown.slice(0, limit).map(({ j, state }) => (
              <li key={j.id}>
                <div className="rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4">
                  <button type="button" onClick={() => open({ kind: "invoice", id: j.id })} className="block min-h-12 w-full text-left">
                    <span className="flex items-start justify-between gap-3"><span className="text-[17px] leading-snug font-bold">{customer(j.customer).name}</span><Chip tone={PAY_TONE[state]}>{state}</Chip></span>
                    <span className="mt-0.5 block text-[15px] text-(--d-muted)">{j.invoice!.id}, {jobType(j.type).label}. {state === "Paid" ? `Paid ${shortDay(j.invoice!.paid!)} by ${j.invoice!.method?.toLowerCase()}` : `Due ${shortDay(j.invoice!.due)}`}</span>
                    <span className="demo-display mt-1 block text-[22px]">{money(j.invoice!.amount)}</span>
                  </button>
                  {state !== "Paid" ? <Button variant="primary" className="mt-2 w-full" onClick={() => open({ kind: "pay", id: j.id })}><Icon name="dollar" size={18} />Take payment</Button> : null}
                </div>
              </li>
            ))}
          </ul>
          {shown.length > limit ? <div className="mt-3 flex justify-center"><Button onClick={() => setLimit((l) => l + 20)}>Show more</Button></div> : null}
          {!shown.length ? <p className="rounded-[14px] border border-dashed border-(--d-line) p-6 text-center text-(--d-muted)">Nothing here.</p> : null}
        </section>
      )}
    </div>
  );
}
