"use client";

import { useState } from "react";
import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { diffDays } from "@demos/kit/data/dates";
import Dialog from "@demos/kit/ui/Dialog";
import { Button } from "@demos/kit/ui/ui";
import type { ChangeOrder } from "../data";
import { shortDay } from "../derive";
import { Chip, Grid, money, moneyM, SortTable, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";

type Row = ChangeOrder & { days: number; projectName: string };
const WHO = { Us: "Us", GC: "GC", Owner: "Owner", Architect: "Architect" } as const;

export default function ChangeOrders() {
  const { d, v, setCo, passBall, openProject } = useProjects();
  const [tab, setTab] = useState<ChangeOrder["status"]>("Pending");
  const [open, setOpen] = useState<Row | null>(null);
  const rows: Row[] = v.changes.map((c) => ({ ...c, days: diffDays(c.decided ?? d.today, c.submitted), projectName: v.projects.find((x) => x.id === c.project)!.name }));
  const of = (s: ChangeOrder["status"]) => rows.filter((c) => c.status === s);
  const list = (xs: Row[]) => <DrillList>{xs.map((c) => <DrillRow key={c.id} title={`${c.id}: ${c.scope}`} detail={`${c.projectName}. ${c.days} days${c.status === "Pending" ? `, ${c.ball}` : ""}`} right={money(c.amount)} onClick={() => setOpen(c)} />)}</DrillList>;
  const waitingOn = (b: ChangeOrder["ball"]) => of("Pending").filter((c) => c.ball === b);
  return (
    <div className="space-y-5">
      <Title sub="What's waiting, how long, and who owes the next step.">Change Orders</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Pending" value={of("Pending").length} sub={moneyM(of("Pending").reduce((t, c) => t + c.amount, 0))} tone="warn" list={() => list(of("Pending"))} />
        <DrillStat label="Approved" value={of("Approved").length} sub={moneyM(of("Approved").reduce((t, c) => t + c.amount, 0))} tone="good" list={() => list(of("Approved"))} />
        <DrillStat label="Rejected" value={of("Rejected").length} sub={moneyM(of("Rejected").reduce((t, c) => t + c.amount, 0))} list={() => list(of("Rejected"))} />
        <DrillStat label="Waiting 30+ days" value={of("Pending").filter((c) => c.days > 30).length} tone="bad" list={() => list(of("Pending").filter((c) => c.days > 30))} />
      </Grid>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        {(Object.keys(WHO) as Array<ChangeOrder["ball"]>).map((b) => <DrillStat key={b} big={false} label={`Next step: ${b === "Us" ? "us" : b === "GC" ? "the GC" : `the ${b.toLowerCase()}`}`} value={waitingOn(b).length} sub={moneyM(waitingOn(b).reduce((t, c) => t + c.amount, 0))} list={() => list(waitingOn(b))} />)}
      </div>
      <div role="tablist" aria-label="Status" className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 md:mx-0 md:px-0">
        {(["Pending", "Approved", "Rejected"] as const).map((s) => <button key={s} type="button" role="tab" aria-selected={tab === s} onClick={() => setTab(s)} className={`min-h-12 shrink-0 rounded-full border px-4 text-[15px] font-semibold ${tab === s ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{s} ({of(s).length})</button>)}
      </div>
      <SortTable<Row>
        label="Change orders" rows={of(tab)} getKey={(c) => c.id} onOpen={setOpen} initial={{ key: "days", dir: -1 }}
        cols={[
          { key: "id", header: "CO", cell: (c) => <>{c.id}<span className="block text-[13.5px] font-normal text-(--d-muted)">{c.scope}</span></>, sort: (c) => c.id },
          { key: "project", header: "Project", cell: (c) => c.projectName, sort: (c) => c.projectName },
          { key: "amount", header: "Value", align: "right", cell: (c) => money(c.amount), sort: (c) => c.amount },
          { key: "days", header: tab === "Pending" ? "Days waiting" : "Days to decide", align: "right", cell: (c) => <span className={tab === "Pending" && c.days > 30 ? "font-semibold text-(--d-bad)" : ""}>{c.days}</span>, sort: (c) => c.days },
          { key: "ball", header: "Next step", cell: (c) => (c.status === "Pending" ? <Chip tone={c.ball === "Us" ? "bad" : "neutral"}>{c.ball}</Chip> : <span className="text-(--d-muted)">{shortDay(c.decided!)}</span>), sort: (c) => c.ball },
        ]}
        card={(c) => (
          <>
            <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-[16.5px] font-bold">{c.id}: {c.scope}</span><span className="block text-[14.5px] text-(--d-muted)">{c.projectName}</span></span><span className="shrink-0 font-bold tabular-nums">{money(c.amount)}</span></span>
            <span className="mt-2 flex items-center gap-2 text-[14px]">{c.status === "Pending" ? <><Chip tone={c.ball === "Us" ? "bad" : "neutral"}>Next: {c.ball}</Chip><span className={c.days > 30 ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}>{c.days} days waiting</span></> : <span className="text-(--d-muted)">{c.status} {shortDay(c.decided!)}</span>}</span>
          </>
        )}
      />
      {open ? (
        <Dialog open sheet onClose={() => setOpen(null)} title={`${open.id}: ${open.scope}`} subtitle={`${open.projectName}. ${money(open.amount)}`}
          footer={open.status === "Pending" ? <><Button onClick={() => { passBall(open.id, open.ball === "Us" ? "GC" : open.ball); setOpen(null); }}>{open.ball === "Us" ? "Send to GC" : `Nudge the ${open.ball === "GC" ? "GC" : open.ball.toLowerCase()}`}</Button><Button variant="primary" onClick={() => { setCo(open.id, "Approved"); setOpen(null); }}>Mark approved</Button></> : null}>
          <dl className="grid grid-cols-2 gap-2 text-[15px]">
            <div className="rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-(--d-muted)">Submitted</dt><dd className="font-bold">{shortDay(open.submitted)}</dd></div>
            <div className="rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-(--d-muted)">{open.status === "Pending" ? "Waiting" : "Took"}</dt><dd className="font-bold">{open.days} days</dd></div>
            <div className="rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-(--d-muted)">Status</dt><dd className="font-bold">{open.status}</dd></div>
            <div className="rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-(--d-muted)">Next step</dt><dd className="font-bold">{open.status === "Pending" ? open.ball : "None"}</dd></div>
          </dl>
          <Button className="mt-4" onClick={() => { const pid = open.project; setOpen(null); openProject(pid); }}>Open the project</Button>
        </Dialog>
      ) : null}
    </div>
  );
}
