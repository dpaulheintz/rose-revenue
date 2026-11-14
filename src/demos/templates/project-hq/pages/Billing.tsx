"use client";

import { AgingBuckets } from "@demos/kit/blocks/AgingBuckets";
import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { Button } from "@demos/kit/ui/ui";
import { shortDay, type VProject } from "../derive";
import { Grid, H, money, moneyM, Panel, SortTable, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";
import { ProjectRows } from "./Dashboard";

export default function Billing() {
  const { v, st, sendPayApp, openProject } = useProjects();
  const under = v.projects.filter((x) => x.overUnder < 0).sort((a, b) => a.overUnder - b.overUnder);
  const overB = v.projects.filter((x) => x.overUnder > 0).sort((a, b) => b.overUnder - a.overUnder);
  const upTotal = v.upcoming.reduce((t, u) => t + u.amount, 0);
  return (
    <div className="space-y-5">
      <Title sub="Pay apps, retainage, what's late, and where billing is ahead of or behind the work.">Billing</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label={`Pay apps due ${shortDay(v.nextPayDate)}`} value={v.upcoming.length} sub={moneyM(upTotal)} list={() => <DrillList>{v.upcoming.map((u) => <DrillRow key={u.project.id} title={u.project.name} detail={u.project.gc} right={moneyM(u.amount)} onClick={() => openProject(u.project.id)} />)}</DrillList>} />
        <DrillStat label="Retainage owed to us" value={moneyM(v.totals.retainage)} list={() => <ProjectRows rows={[...v.projects].sort((a, b) => b.retainage - a.retainage)} right={(x) => moneyM(x.retainage)} />} />
        <DrillStat label="Overdue receivables" value={moneyM(v.totals.overdue)} tone="bad" sub={`${v.overdue.length} pay apps past 45 days`} list={() => <DrillList>{v.overdue.map((a) => <DrillRow key={a.id} title={a.project.name} detail={`${a.id}, ${a.age} days. ${a.project.gc}`} right={moneyM(a.amount)} />)}</DrillList>} />
        <DrillStat label="Under-billed" value={moneyM(-under.reduce((t, x) => t + x.overUnder, 0))} tone="warn" sub={`${under.length} jobs behind the work`} list={() => <ProjectRows rows={under} right={(x) => moneyM(-x.overUnder)} />} />
      </Grid>

      <Panel title="Receivables by age" note="Tap a bucket to see the pay apps in it.">
        <AgingBuckets title="Receivables" items={v.unpaid} daysOf={(a) => a.age} amountOf={(a) => a.amount} getKey={(a) => a.id} money={moneyM}
          renderItem={(a) => <button type="button" onClick={() => openProject(a.project.id)} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"><span className="min-w-0"><span className="block font-semibold">{a.project.name}</span><span className="text-[14px] text-(--d-muted)">{a.id}, billed {shortDay(a.billed)}. {a.project.gc}</span></span><span className="font-semibold tabular-nums">{moneyM(a.amount)}</span></button>} />
      </Panel>

      <section>
        <H>Upcoming pay applications, due {shortDay(v.nextPayDate)}</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2 xl:grid-cols-3">
          {v.upcoming.slice(0, 9).map((u) => (
            <li key={u.project.id} className="flex items-center gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3.5">
              <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{u.project.name}</span><span className="block text-[14.5px] text-(--d-muted)">About {moneyM(u.amount)}. {u.project.gc}</span></span>
              <Button disabled={!!st.sent[u.project.id]} onClick={() => sendPayApp(u.project.id)}>{st.sent[u.project.id] ? "Drafted" : "Draft it"}</Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <H>Estimated over/under billing by job</H>
        <SortTable<VProject>
          label="Over and under billing" rows={[...under, ...overB]} getKey={(x) => x.id} onOpen={(x) => openProject(x.id)} initial={{ key: "ou", dir: 1 }}
          cols={[
            { key: "name", header: "Project", cell: (x) => x.name, sort: (x) => x.name },
            { key: "earned", header: "Earned (work done)", align: "right", cell: (x) => moneyM(x.earned), sort: (x) => x.earned },
            { key: "billed", header: "Billed", align: "right", cell: (x) => moneyM(x.billed), sort: (x) => x.billed },
            { key: "ou", header: "Over / under", align: "right", cell: (x) => <span className={x.overUnder < -50000 ? "font-semibold text-(--d-bad)" : x.overUnder > 0 ? "text-(--d-good)" : ""}>{x.overUnder > 0 ? "+" : ""}{money(x.overUnder)}</span>, sort: (x) => x.overUnder },
            { key: "pm", header: "PM", cell: (x) => x.pm, sort: (x) => x.pm },
          ]}
          card={(x) => (
            <>
              <span className="block text-[16.5px] font-bold">{x.name}</span>
              <span className="mt-1 flex justify-between gap-3 text-[15px]"><span className="text-(--d-muted)">Earned {moneyM(x.earned)}, billed {moneyM(x.billed)}</span><span className={`font-bold tabular-nums ${x.overUnder < 0 ? "text-(--d-bad)" : "text-(--d-good)"}`}>{x.overUnder > 0 ? "+" : ""}{moneyM(x.overUnder)}</span></span>
            </>
          )}
        />
        <p className="mt-2 text-[14px] text-(--d-muted)">Under-billed means work is done that hasn&apos;t been billed yet: cash you&apos;re carrying for the GC.</p>
      </section>
    </div>
  );
}
