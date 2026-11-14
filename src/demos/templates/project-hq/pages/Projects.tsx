"use client";

import { useState } from "react";
import { DrillStat } from "@demos/kit/blocks/DrillStat";
import { pctText, type Status, type VProject } from "../derive";
import { Chip, Grid, moneyM, Progress, SortTable, STATUS_TONE, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";
import { ProjectRows } from "./Dashboard";

export default function Projects() {
  const { v, openProject } = useProjects();
  const [only, setOnly] = useState<Status | "All">("All");
  const rows = v.projects.filter((x) => only === "All" || x.status === only);
  const by = (s: Status) => v.projects.filter((x) => x.status === s);
  return (
    <div className="space-y-5">
      <Title sub="One row per job. Sort by any column; open a job for its cost breakdown.">Projects</Title>
      <Grid cols="lg:grid-cols-3">
        {(["On track", "At risk", "Over budget"] as Status[]).map((s) => <DrillStat key={s} label={s} value={by(s).length} tone={s === "On track" ? "good" : s === "At risk" ? "warn" : "bad"} sub={moneyM(by(s).reduce((t, x) => t + x.revised, 0))} list={() => <ProjectRows rows={by(s)} right={(x) => `${pctText(x.costFactor - 1)} cost variance`} />} />)}
      </Grid>
      <div role="radiogroup" aria-label="Show" className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 md:mx-0 md:px-0">
        {(["All", "On track", "At risk", "Over budget"] as const).map((s) => <button key={s} type="button" role="radio" aria-checked={only === s} onClick={() => setOnly(s)} className={`min-h-12 shrink-0 rounded-full border px-4 text-[15px] font-semibold ${only === s ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{s}</button>)}
      </div>
      <SortTable<VProject>
        label="Projects" rows={rows} getKey={(x) => x.id} onOpen={(x) => openProject(x.id)} initial={{ key: "contract", dir: -1 }}
        cols={[
          { key: "name", header: "Project", cell: (x) => <>{x.name}<span className="block text-[13.5px] font-normal text-(--d-muted)">{x.type}</span></>, sort: (x) => x.name },
          { key: "contract", header: "Contract", align: "right", cell: (x) => moneyM(x.revised), sort: (x) => x.revised },
          { key: "budget", header: "Budget vs. actual", align: "right", cell: (x) => <>{moneyM(x.cost)}<span className="block text-[13.5px] text-(--d-muted)">of {moneyM(x.budget * x.pct)} to date</span></>, sort: (x) => x.cost / (x.budget * x.pct) },
          { key: "pct", header: "Complete", cell: (x) => <Progress pct={x.pct} />, sort: (x) => x.pct },
          { key: "billed", header: "Billed", align: "right", cell: (x) => moneyM(x.billed), sort: (x) => x.billed },
          { key: "ret", header: "Retainage", align: "right", cell: (x) => moneyM(x.retainage), sort: (x) => x.retainage },
          { key: "pm", header: "PM", cell: (x) => x.pm, sort: (x) => x.pm },
          { key: "status", header: "Status", cell: (x) => <Chip tone={STATUS_TONE[x.status]}>{x.status}</Chip>, sort: (x) => ["On track", "At risk", "Over budget"].indexOf(x.status) },
        ]}
        card={(x) => (
          <>
            <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-[16.5px] font-bold">{x.name}</span><span className="block text-[14.5px] text-(--d-muted)">{x.pm}. {moneyM(x.revised)} contract</span></span><Chip tone={STATUS_TONE[x.status]}>{x.status}</Chip></span>
            <span className="mt-2 block"><Progress pct={x.pct} /></span>
            <span className="mt-1 block text-[14px] text-(--d-muted)">Cost {moneyM(x.cost)} of {moneyM(x.budget * x.pct)} budgeted to date. Billed {moneyM(x.billed)}</span>
          </>
        )}
      />
    </div>
  );
}
