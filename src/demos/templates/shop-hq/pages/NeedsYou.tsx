"use client";

import { AgingBuckets } from "@demos/kit/blocks/AgingBuckets";
import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { Button } from "@demos/kit/ui/ui";
import { diffDays } from "@demos/kit/data/dates";
import { shortDay } from "../derive";
import { Chip, Grid, H, money, Panel, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";

export default function NeedsYou() {
  const { p, d, s, invoice, book, nudge } = useShop();
  const unpaidTotal = s.unpaid.reduce((t, j) => t + j.amount, 0);
  return (
    <div className="space-y-6">
      <Title sub="The money and follow-ups that slip when you're busy.">Needs You</Title>
      <Grid cols="lg:grid-cols-5">
        <DrillStat label="Unpaid invoices" value={s.unpaid.length} sub={money(unpaidTotal)} tone="warn" list={() => <DrillList>{s.unpaid.map((j) => <DrillRow key={j.id} title={`${j.customer.name}, ${p.services[j.service].name}`} detail={`${j.invoice!.id}, sent ${shortDay(j.invoice!.sent)}, ${s.age(j)} days`} right={money(j.amount)} />)}</DrillList>} />
        <DrillStat label="Done, not invoiced" value={s.notInvoiced.length} tone={s.notInvoiced.length ? "bad" : "good"} sub={money(s.notInvoiced.reduce((t, j) => t + j.amount, 0))} list={() => <DrillList>{s.notInvoiced.map((j) => <DrillRow key={j.id} title={`${j.customer.name}, ${p.services[j.service].name}`} detail={`Finished ${shortDay(j.date)} by ${p.crew[j.crew].name}`} right={money(j.amount)} />)}</DrillList>} />
        <DrillStat label="Estimates waiting 7+ days" value={s.staleEstimates.length} sub={money(s.staleEstimates.reduce((t, e) => t + e.amount, 0))} list={() => <DrillList>{s.staleEstimates.map((e) => <DrillRow key={e.id} title={`${e.customer.name}, ${p.services[e.service].name}`} detail={`${e.id}, ${diffDays(d.today, e.date)} days. ${p.crew[e.crew].name}`} right={money(e.amount)} />)}</DrillList>} />
        <DrillStat label="Permits and inspections" value={s.permits.length} sub="Next 2 weeks" list={() => <DrillList>{s.permits.map((x) => <DrillRow key={x.id} title={`${x.kind} for ${x.job}`} detail={`${shortDay(x.date)}. ${x.status}`} />)}</DrillList>} />
        <DrillStat label="Callbacks to schedule" value={s.callbacks.length} tone={s.callbacks.length ? "bad" : "good"} list={() => <DrillList>{s.callbacks.map((j) => <DrillRow key={j.id} title={j.customer.name} detail={`${j.callback!.reason}. ${p.services[j.service].name} on ${shortDay(j.date)}`} />)}</DrillList>} />
      </Grid>

      <Panel title="Unpaid invoices by age" note="Tap a bucket to see who owes what.">
        <AgingBuckets title="Unpaid" items={s.unpaid} daysOf={s.age} amountOf={(j) => j.amount} getKey={(j) => j.id} money={money}
          renderItem={(j) => <div className="flex min-h-12 items-center justify-between gap-3 py-2"><span className="min-w-0"><span className="block font-semibold">{j.customer.name}</span><span className="text-[14px] text-(--d-muted)">{j.invoice!.id}, {s.age(j)} days, {j.customer.phone}</span></span><span className="font-semibold">{money(j.amount)}</span></div>} />
      </Panel>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <section>
          <H>Finished, not invoiced</H>
          <ul className="space-y-2.5">
            {s.notInvoiced.map((j) => (
              <li key={j.id} className="flex items-center gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{j.customer.name}</span><span className="block text-[14.5px] text-(--d-muted)">{p.services[j.service].name}, {shortDay(j.date)}. {money(j.amount)}</span></span>
                <Button variant="primary" onClick={() => invoice(j.id)}>Send invoice</Button>
              </li>
            ))}
            {!s.notInvoiced.length ? <li className="text-(--d-muted)">Everything finished is invoiced.</li> : null}
          </ul>
        </section>
        <section>
          <H>Callbacks to schedule</H>
          <ul className="space-y-2.5">
            {s.callbacks.map((j) => (
              <li key={j.id} className="flex items-center gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{j.customer.name}</span><span className="block text-[14.5px] text-(--d-muted)">{j.callback!.reason}. {p.crew[j.crew].name}</span></span>
                <Button onClick={() => book(j.id)}>Schedule</Button>
              </li>
            ))}
            {!s.callbacks.length ? <li className="text-(--d-muted)">No callbacks waiting.</li> : null}
          </ul>
          <H>Estimates waiting 7+ days</H>
          <ul className="space-y-2.5">
            {s.staleEstimates.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{e.customer.name}</span><span className="block text-[14.5px] text-(--d-muted)">{p.services[e.service].name}, {money(e.amount)}. {diffDays(d.today, e.date)} days</span></span>
                <Button onClick={() => nudge(e.id)}>Follow up</Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section>
        <H>Permits and inspections, next 2 weeks</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {s.permits.map((x) => {
            const j = s.jobs.find((y) => y.id === x.job)!;
            return <li key={x.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5"><span className="min-w-0"><span className="block text-[16px] font-bold">{x.kind}: {j.customer.town}</span><span className="block text-[14.5px] text-(--d-muted)">{shortDay(x.date)}. {p.services[j.service].name}, {j.customer.name}</span></span><Chip tone={x.status === "Pending" ? "warn" : "good"}>{x.status}</Chip></li>;
          })}
        </ul>
      </section>
    </div>
  );
}
