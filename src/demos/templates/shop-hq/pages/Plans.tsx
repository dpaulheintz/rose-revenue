"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { BarList } from "@demos/kit/ui/charts";
import { Button } from "@demos/kit/ui/ui";
import type { Member } from "../data";
import { shortDay } from "../derive";
import { Grid, money, moneyK, Panel, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";

export default function Plans() {
  const { p, d, s, st, remind } = useShop();
  const rows = (ms: Member[]) => <DrillList>{ms.slice(0, 60).map((m) => <DrillRow key={m.id} title={m.customer.name} detail={`${p.plans[m.plan].name}, ${m.customer.town}. Renews ${shortDay(m.renews)}`} right={money(p.plans[m.plan].price)} />)}</DrillList>;
  const kind = s.fall ? "Furnace" : "AC";
  return (
    <div className="space-y-6">
      <Title sub="Members, renewals and the tune-ups this season.">Maintenance Plans</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Active members" value={d.members.length} list={() => rows(d.members)} title="Members (first 60)" />
        <DrillStat label="Renewals this month" value={s.renewals.length} sub={money(s.renewals.reduce((t, m) => t + p.plans[m.plan].price, 0))} tone="warn" list={() => rows(s.renewals)} />
        <DrillStat label={`${kind} tune-ups due`} value={s.tuneDue.length} sub={s.fall ? "Fall season" : "Spring season"} list={() => rows(s.tuneDue)} />
        <DrillStat label="Plan revenue" value={moneyK(s.planRevenue)} sub={`${moneyK(s.planRevenue / 12)} a month`} tone="good" list={() => <DrillList>{p.plans.map((pl, i) => { const n = d.members.filter((m) => m.plan === i).length; return <DrillRow key={pl.name} title={pl.name} detail={`${n} members at ${money(pl.price)}`} right={money(n * pl.price)} />; })}</DrillList>} />
      </Grid>

      <section className="rounded-[16px] border-2 border-(--d-accent) bg-(--d-panel) p-4">
        <p className="text-[16px]"><span className="font-bold">{s.renewals.length} members renew this month.</span> Send each a text with their renewal link, and book their {kind.toLowerCase()} tune-up while you&apos;re at it.</p>
        <Button variant="primary" className="mt-3 w-full sm:w-auto" disabled={st.reminded} onClick={remind}>{st.reminded ? "Reminders sent" : `Send ${s.renewals.length} renewal reminders`}</Button>
      </section>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <Panel title="Members by plan">
          <BarList rows={p.plans.map((pl, i) => ({ key: pl.name, label: `${pl.name}, ${money(pl.price)}/yr`, value: d.members.filter((m) => m.plan === i).length }))} format={(n) => `${n}`} />
        </Panel>
        <Panel title={`${kind} tune-ups due, by town`}>
          <BarList rows={p.towns.map((t) => ({ key: t, label: t, value: s.tuneDue.filter((m) => m.customer.town === t).length })).sort((a, b) => b.value - a.value).slice(0, 6)} format={(n) => `${n}`} />
        </Panel>
      </div>
    </div>
  );
}
