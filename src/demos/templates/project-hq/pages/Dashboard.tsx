"use client";

import { useRouter } from "next/navigation";
import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { NeedsList } from "@demos/kit/blocks/NeedsList";
import { dayDate } from "@demos/kit/data/format";
import { RoseNote } from "@demos/kit/shell/ProspectShell";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { SplitBar } from "@demos/kit/ui/charts";
import { pctText, shortDay, type VProject } from "../derive";
import { Grid, H, moneyM, Panel, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";

export function ProjectRows({ rows, right }: { rows: VProject[]; right: (x: VProject) => React.ReactNode }) {
  const { openProject } = useProjects();
  return <DrillList>{rows.map((x) => <DrillRow key={x.id} title={x.name} detail={`${x.pm}. ${pctText(x.pct)} complete, ${x.status.toLowerCase()}`} right={right(x)} onClick={() => openProject(x.id)} />)}</DrillList>;
}

export default function Dashboard() {
  const { base } = useDemo();
  const router = useRouter();
  const { p, d, v, openProject } = useProjects();
  const go = (path: string) => router.push(`${base}/${path}`);
  const over = v.projects.filter((x) => x.status === "Over budget");
  const atRisk = v.projects.filter((x) => x.status === "At risk");
  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. ${v.projects.length} active projects. Tap any number to see what's behind it.`}>Owner Dashboard</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Active projects" value={v.projects.length} sub={`${v.projects.filter((x) => x.status === "On track").length} on track`} list={() => <ProjectRows rows={v.projects} right={(x) => moneyM(x.revised)} />} />
        <DrillStat label="Total contract value" value={moneyM(v.totals.contract)} sub="With approved change orders" list={() => <ProjectRows rows={[...v.projects].sort((a, b) => b.revised - a.revised)} right={(x) => moneyM(x.revised)} />} />
        <DrillStat label="Billed vs. remaining" value={pctText(v.totals.billed / v.totals.contract)} sub={`${moneyM(v.totals.billed)} billed, ${moneyM(v.totals.contract - v.totals.billed)} to go`} list={() => <ProjectRows rows={v.projects} right={(x) => `${moneyM(x.billed)} of ${moneyM(x.revised)}`} />} />
        <DrillStat label="Cash collected this month" value={moneyM(v.totals.collected)} tone="good" list={() => <DrillList>{v.collectedMonth.map((a) => <DrillRow key={a.id} title={v.projects.find((x) => x.id === a.project)!.name} detail={`${a.id}, paid ${shortDay(a.paid!)}`} right={moneyM(a.amount)} />)}</DrillList>} />
        <DrillStat label="Open change orders" value={v.pending.length} sub={moneyM(v.totals.pending)} tone="warn" list={() => <DrillList>{v.pending.map((c) => <DrillRow key={c.id} title={`${c.id}: ${c.scope}`} detail={`${c.project.name}. ${c.days} days, waiting on ${c.ball}`} right={moneyM(c.amount)} onClick={() => openProject(c.project.id)} />)}</DrillList>} />
        <DrillStat label="Labor hours this week" value={v.laborHours.toLocaleString("en-US")} sub={`${moneyM(v.totals.laborCost)} at ${moneyM(p.laborRate)}/hr`} list={() => <ProjectRows rows={[...v.projects].filter((x) => x.hoursWeek).sort((a, b) => b.hoursWeek - a.hoursWeek)} right={(x) => `${x.hoursWeek} hr`} />} />
        <DrillStat label="Jobs over budget" value={over.length} tone={over.length ? "bad" : "good"} sub={`${atRisk.length} more at risk`} list={() => <ProjectRows rows={[...over, ...atRisk]} right={(x) => `+${pctText(x.costFactor - 1)}`} />} />
        <DrillStat label="Overdue receivables" value={moneyM(v.totals.overdue)} tone="bad" sub={`${v.overdue.length} pay apps past 45 days`} list={() => <DrillList>{v.overdue.map((a) => <DrillRow key={a.id} title={a.project.name} detail={`${a.id}, billed ${shortDay(a.billed)}, ${a.age} days. ${a.project.gc}`} right={moneyM(a.amount)} />)}</DrillList>} />
      </Grid>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-[3fr_2fr]">
        <section>
          <H>Needs attention</H>
          <NeedsList items={v.needs.map((n) => ({ ...n, onClick: () => (n.kind === "project" ? openProject(n.id) : go(n.kind === "co" ? "change-orders" : n.kind === "labor" ? "labor" : n.kind === "service" ? "service" : "billing")) }))} />
        </section>
        <div className="space-y-5">
          <Panel title="Billed vs. remaining">
            <SplitBar format={moneyM} parts={[{ label: "Billed", value: v.totals.billed, color: "var(--d-accent)" }, { label: "Remaining", value: v.totals.contract - v.totals.billed, color: "#c9d0d5" }]} />
            <p className="mt-3 text-[14.5px] text-(--d-muted)">Retainage held across all jobs: <span className="font-semibold text-(--d-text)">{moneyM(v.totals.retainage)}</span></p>
          </Panel>
          <RoseNote connects={p.connects} />
        </div>
      </div>
    </div>
  );
}
