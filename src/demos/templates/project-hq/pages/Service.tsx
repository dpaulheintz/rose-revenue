"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { diffDays } from "@demos/kit/data/dates";
import { Button } from "@demos/kit/ui/ui";
import type { Agreement } from "../data";
import { shortDay } from "../derive";
import { Chip, Grid, H, money, moneyM, SortTable, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";

export default function Service() {
  const { d, v, notify } = useProjects();
  const revenue = d.agreements.reduce((t, a) => t + a.annual, 0);
  const plans = ["Quarterly PM", "Semi-annual PM", "Full coverage"] as const;
  return (
    <div className="space-y-5">
      <Title sub="Maintenance agreements, renewals coming up, and this week's calls.">Service Contracts</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Agreements" value={d.agreements.length} list={() => <DrillList>{plans.map((pl) => { const xs = d.agreements.filter((a) => a.plan === pl); return <DrillRow key={pl} title={pl} detail={`${xs.length} buildings`} right={moneyM(xs.reduce((t, a) => t + a.annual, 0))} />; })}</DrillList>} />
        <DrillStat label="Contract revenue" value={moneyM(revenue)} sub={`${moneyM(revenue / 12)} a month`} tone="good" list={() => <DrillList>{[...d.agreements].sort((a, b) => b.annual - a.annual).map((a) => <DrillRow key={a.id} title={a.building} detail={a.plan} right={money(a.annual)} />)}</DrillList>} />
        <DrillStat label="Renewing in 90 days" value={v.renewing.length} sub={moneyM(v.renewing.reduce((t, a) => t + a.annual, 0))} tone="warn" list={() => <DrillList>{v.renewing.map((a) => <DrillRow key={a.id} title={a.building} detail={`${a.plan}. Renews ${shortDay(a.renews)}`} right={money(a.annual)} />)}</DrillList>} />
        <DrillStat label="Service calls this week" value={d.calls.length} sub={`${d.calls.filter((c) => c.status === "Done").length} done`} list={() => <DrillList>{d.calls.map((c) => <DrillRow key={c.id} title={`${c.building}: ${c.issue}`} detail={`${shortDay(c.date)}. ${c.tech}`} right={c.status} />)}</DrillList>} />
      </Grid>

      <section>
        <H action={<Button onClick={() => notify(`Renewal letters drafted for ${v.renewing.length} agreements (demo).`)}>Draft renewal letters</Button>}>Renewing in the next 90 days</H>
        <SortTable<Agreement>
          label="Renewals" rows={v.renewing} getKey={(a) => a.id} onOpen={(a) => notify(`${a.building}: ${a.contact.name}, ${a.contact.phone}. (Demo: nothing dials.)`)} initial={{ key: "renews", dir: 1 }}
          cols={[
            { key: "building", header: "Building", cell: (a) => a.building, sort: (a) => a.building },
            { key: "plan", header: "Plan", cell: (a) => a.plan, sort: (a) => a.plan },
            { key: "annual", header: "Annual value", align: "right", cell: (a) => money(a.annual), sort: (a) => a.annual },
            { key: "renews", header: "Renews", cell: (a) => <span className={diffDays(a.renews, d.today) <= 30 ? "font-semibold text-(--d-bad)" : ""}>{shortDay(a.renews)}</span>, sort: (a) => a.renews },
            { key: "contact", header: "Contact", cell: (a) => <>{a.contact.name}<span className="block text-[13.5px] text-(--d-muted)">{a.contact.phone}</span></>, sort: (a) => a.contact.name },
          ]}
          card={(a) => (
            <>
              <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-[16.5px] font-bold">{a.building}</span><span className="block text-[14.5px] text-(--d-muted)">{a.plan}. {a.contact.name}</span></span><span className="shrink-0 font-bold tabular-nums">{money(a.annual)}</span></span>
              <span className={`mt-1 block text-[14.5px] ${diffDays(a.renews, d.today) <= 30 ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}`}>Renews {shortDay(a.renews)}</span>
            </>
          )}
        />
      </section>

      <section>
        <H>Service calls this week</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {d.calls.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3.5">
              <span className="min-w-0"><span className="block text-[16px] font-bold">{c.building}</span><span className="block text-[14.5px] text-(--d-muted)">{c.issue}. {shortDay(c.date)}, {c.tech}</span></span>
              <Chip tone={c.status === "Done" ? "good" : c.status === "Parts on order" ? "warn" : "neutral"}>{c.status}</Chip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
