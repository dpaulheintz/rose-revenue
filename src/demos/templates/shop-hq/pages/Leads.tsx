"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { BarList } from "@demos/kit/ui/charts";
import Icon from "@demos/kit/ui/Icon";
import type { Lead } from "../data";
import { shortDay } from "../derive";
import { Chip, Grid, H, Panel, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";

export function LeadRows({ leads }: { leads: Lead[] }) {
  return <DrillList>{leads.map((l) => <DrillRow key={l.id} title={`${l.customer.name}, ${l.need}`} detail={`${shortDay(l.date)} ${l.time}, ${l.customer.town}. ${l.source}${l.afterHours ? ", after hours" : ""}`} right={l.status} />)}</DrillList>;
}

export default function Leads() {
  const { d, s, call } = useShop();
  const booked = s.afterHours.filter((l) => l.status === "Booked");
  const all30 = s.sources.flatMap((x) => x.leads);
  return (
    <div className="space-y-6">
      <Title sub="Every call and lead, and who's still waiting on you.">Calls &amp; Leads</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Calls today" value={d.callsToday} sub={`${s.leadsToday.length} new leads`} list={() => <LeadRows leads={s.leadsToday} />} title="New leads from today's calls" />
        <DrillStat label="Missed calls" value={d.missedToday} tone={d.missedToday ? "bad" : "good"} sub="Each got a text-back (concept)" list={() => <DrillList>{s.leadsToday.slice(0, d.missedToday).map((l) => <DrillRow key={l.id} title={l.customer.phone} detail={`${l.time}. Texted back automatically`} />)}</DrillList>} />
        <DrillStat label="After-hours, answered" value={s.afterHours.length} sub={`${booked.length} booked by the assistant`} tone="good" list={() => <LeadRows leads={s.afterHours} />} />
        <DrillStat label="Speed to first response" value={`${s.speed} min`} sub="Daytime, last 7 days" tone={s.speed > 20 ? "warn" : "good"} list={() => <LeadRows leads={d.leads.filter((l) => !l.afterHours && d.today >= l.date).slice(-20).reverse()} />} />
      </Grid>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <section>
          <H>Waiting on a callback ({s.waiting.length})</H>
          <ul className="space-y-2.5">
            {s.waiting.slice(0, 8).map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5">
                <span className="min-w-0 flex-1"><span className="block text-[16.5px] font-bold">{l.customer.name}</span><span className="block text-[14.5px] text-(--d-muted)">{l.need}, {l.customer.town}. {l.date === d.today ? `Today ${l.time}` : shortDay(l.date)}, {l.source}</span></span>
                <button type="button" onClick={() => call(l.id, l.customer.name)} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-(--d-accent) px-4 text-[15px] font-semibold text-(--d-on-accent)"><Icon name="phone" size={18} />Call</button>
              </li>
            ))}
            {!s.waiting.length ? <li className="rounded-[14px] border border-dashed border-(--d-line) p-5 text-center text-(--d-muted)">Everyone&apos;s been called back.</li> : null}
          </ul>
        </section>
        <Panel title="Where leads came from, 30 days" note="Tap a number for the leads behind it.">
          <BarList rows={s.sources.map((x) => ({ key: x.name, label: x.name, value: x.leads.length, sub: `${x.leads.filter((l) => l.status === "Booked").length} booked` }))} format={(n) => `${n} leads`} />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {s.sources.slice(0, 2).map((x) => <DrillStat key={x.name} big={false} label={`${x.name} leads`} value={x.leads.length} sub={`${Math.round((x.leads.length / Math.max(1, all30.length)) * 100)}% of all`} list={() => <LeadRows leads={x.leads.slice().reverse()} />} />)}
          </div>
          <p className="mt-3"><Chip tone="info">After-hours answering is a concept: an assistant picks up, books the call and texts you.</Chip></p>
        </Panel>
      </div>
    </div>
  );
}
