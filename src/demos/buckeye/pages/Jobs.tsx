"use client";

import { useState } from "react";
import { LANE, laneLabel, shortDay, type JobStatus, type OpenJob } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { ResponsiveTable, type Column } from "@demos/kit/blocks/ResponsiveTable";
import { EmptyState } from "@demos/kit/ui/EmptyState";
import Kanban from "@demos/kit/ui/Kanban";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { ChipRow, FilterChip, PageHeader, Tabs } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { Num, StatusPill, Traveler, v } from "@demos/buckeye/parts/bits";

const LANES = [...ind.machines.map((m) => m.id), LANE];

export default function Jobs() {
  const { shop, k, customer, openJob, moveJob } = useShop();
  const [tab, setTab] = useState<"list" | "board">("list");
  const [status, setStatus] = useState<JobStatus | "All">("All");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const name = (j: OpenJob) => shop.partOf(j.partId).name;
  const rows = k.open.filter((j) => (status === "All" || j.status === status) && (!needle || `${j.id} ${customer(j.customerId).name} ${name(j)} ${shop.partOf(j.partId).number}`.toLowerCase().includes(needle)));

  const columns: Column<OpenJob>[] = [
    { key: "job", header: v.Job, primary: true, cell: (j) => <Num>{j.id}</Num> },
    { key: "customer", header: "Customer", cell: (j) => customer(j.customerId).name },
    { key: "part", header: v.Part, cell: (j) => <>{name(j)}<span className="block text-[12.5px] text-(--d-muted)"><Num>{shop.partOf(j.partId).number}</Num></span></> },
    { key: "qty", header: "Qty", align: "right", cell: (j) => j.qty.toLocaleString("en-US") },
    { key: "due", header: "Due", cell: (j) => shortDay(j.dueDate) },
    { key: "now", header: `Now at`, cell: (j) => <><Traveler steps={j.steps} current={j.current} showLabel={false} /><span className="block text-[12.5px] text-(--d-muted)">{j.atMachine ?? j.atLabel}</span></> },
    { key: "status", header: "Status", cell: (j) => <StatusPill status={j.status} /> },
  ];
  const counts = { Late: k.late.length, "At risk": k.atRisk.length, "On track": k.open.length - k.late.length - k.atRisk.length };

  return (
    <div className="space-y-4">
      <PageHeader title={v.JobsNav} meta={`${k.open.length} open ${v.jobs}. Tap one to follow it from the quote to the invoice.`} />
      <Tabs label="View" value={tab} onChange={setTab} tabs={[{ value: "list", label: `Open ${v.jobs}`, count: k.open.length }, { value: "board", label: v.board }]} />

      {tab === "list" ? (
        <>
          <ChipRow>
            <FilterChip on={status === "All"} onClick={() => setStatus("All")} count={k.open.length}>All</FilterChip>
            {(["Late", "At risk", "On track"] as const).map((s) => <FilterChip key={s} on={status === s} onClick={() => setStatus(s)} count={counts[s]}>{s}</FilterChip>)}
          </ChipRow>
          <SearchBar label={`Search ${v.jobs}`} placeholder={`Search ${v.job}, customer or ${v.part}`} value={q} onChange={setQ} />
          {rows.length ? (
            <ResponsiveTable
              rows={rows} columns={columns} getKey={(j) => j.id} onRow={(j) => openJob(j.id)} rowLabel={(j) => `Open ${j.id}`} minWidth={800}
              card={(j) => (
                <>
                  <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block font-semibold"><Num>{j.id}</Num> · {customer(j.customerId).name}</span><span className="block text-[13px] text-(--d-muted)">{name(j)} · {j.qty.toLocaleString("en-US")} {v.unit}</span></span><StatusPill status={j.status} /></span>
                  <span className="mt-2.5 flex items-center justify-between gap-3"><Traveler steps={j.steps} current={j.current} /><span className="shrink-0 text-[13px]">Due {shortDay(j.dueDate)}</span></span>
                </>
              )}
            />
          ) : <EmptyState title={`No ${v.jobs} match`} hint="Try a shorter search or clear the filter." />}
        </>
      ) : (
        <>
          <p className="text-[14px] text-(--d-muted)">Drag a {v.job} by its handle to another {v.machine}. Reassigning updates the {v.job} everywhere.</p>
          <Kanban
            scrollOnly
            items={k.open.map((j) => ({ ...j, name: j.id }))}
            columns={LANES}
            statusOf={(j) => j.at}
            onMove={moveJob}
            columnLabel={(s) => <span className="demo-display text-[17px]">{laneLabel(s)}{s !== LANE ? <span className="ml-2 text-[12.5px] font-normal text-(--d-muted)" style={{ fontFamily: "var(--font-demo-body)" }}>{Math.round(shop.machineUse.get(s) ?? 0)}% used</span> : null}</span>}
            renderCard={(j, grip) => (
              <div className="flex items-start gap-1 p-1.5">
                {grip}
                <button type="button" onClick={() => openJob(j.id)} className="min-h-12 min-w-0 flex-1 py-1 pr-1 text-left">
                  <span className="flex items-center justify-between gap-2"><Num>{j.id}</Num><StatusPill status={j.status} /></span>
                  <span className="mt-0.5 block truncate text-[13.5px] font-semibold">{customer(j.customerId).name}</span>
                  <span className="block truncate text-[12.5px] text-(--d-muted)">{name(j)}</span>
                  <span className="mt-1.5 flex items-center justify-between gap-2"><Traveler steps={j.steps} current={j.current} showLabel={false} /><span className="text-[12.5px]">{shortDay(j.dueDate)}</span></span>
                </button>
              </div>
            )}
          />
        </>
      )}
    </div>
  );
}
