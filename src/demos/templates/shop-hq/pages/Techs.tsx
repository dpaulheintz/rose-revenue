"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { BarList } from "@demos/kit/ui/charts";
import { shortDay } from "../derive";
import { Chip, money, moneyK, Panel, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";
import { JobRows } from "./Today";

export default function Techs() {
  const { p, s } = useShop();
  return (
    <div className="space-y-6">
      <Title sub="Last 30 days for revenue and tickets, 90 days for close rate and callbacks.">Tech Scorecard</Title>
      <Panel title="Revenue per tech, 30 days">
        <BarList rows={s.techs.map((t) => ({ key: String(t.i), label: t.c.name, value: Math.round(t.revenue), sub: t.c.role }))} format={moneyK} />
      </Panel>
      <ul className="grid gap-3 *:min-w-0 md:grid-cols-2 xl:grid-cols-3">
        {s.techs.map((t) => (
          <li key={t.i} className="rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4">
            <p className="mb-3 flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-[17px] font-bold">{t.c.name}</span><span className="text-[14.5px] text-(--d-muted)">{t.c.role}</span></span><Chip tone={t.c.install ? "info" : "neutral"}>{t.c.install ? "Install" : t.c.trade}</Chip></p>
            <div className="grid grid-cols-2 gap-2">
              <DrillStat big={false} label="Revenue" value={moneyK(t.revenue)} list={() => <JobRows jobs={t.jobs30.slice().reverse()} />} title={`${t.c.name}: jobs, 30 days`} />
              <DrillStat big={false} label="Close rate" value={t.close == null ? "No estimates" : `${Math.round(t.close * 100)}%`} sub={`${t.estimates.length} estimates`} list={() => <DrillList>{t.estimates.map((e) => <DrillRow key={e.id} title={`${e.customer.name}, ${p.services[e.service].name}`} detail={shortDay(e.date)} right={e.status} />)}</DrillList>} />
              <DrillStat big={false} label="Average ticket" value={money(t.avg)} list={() => <JobRows jobs={t.jobs30.slice().reverse()} />} title={`${t.c.name}: tickets, 30 days`} />
              <DrillStat big={false} label="Callbacks" value={t.callbacks.length} tone={t.callbacks.length > 1 ? "bad" : t.callbacks.length ? "warn" : "good"} list={() => <DrillList>{t.callbacks.map((j) => <DrillRow key={j.id} title={j.customer.name} detail={`${j.callback!.reason}. ${shortDay(j.date)}`} />)}</DrillList>} />
            </div>
            <div className="mt-2"><DrillStat big={false} label="Jobs completed this week" value={t.week.length} list={() => <JobRows jobs={t.week} />} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
