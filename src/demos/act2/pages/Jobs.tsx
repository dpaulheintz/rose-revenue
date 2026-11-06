"use client";

import { useMemo, useState } from "react";
import { AgendaList, MonthGrid, WeekGrid } from "@demos/kit/blocks/Calendar";
import { addDays, diffDays, weekday, type Ymd } from "@demos/kit/data/dates";
import { shortDate } from "@demos/kit/data/format";
import { jobFinance } from "@demos/act2/derive";
import type { CrewId, Job, JobStatus } from "@demos/act2/model";
import Icon from "@demos/kit/ui/Icon";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button, ChipRow, FilterChip, PageHeader, Pill, Segmented } from "@demos/kit/ui/ui";
import { CrewDot, usd } from "@demos/act2/parts/bits";
import { useShop } from "@demos/act2/parts/ShopProvider";

type View = "auto" | "agenda" | "week" | "month";
const isWork = (d: Ymd) => weekday(d) !== 0 && weekday(d) !== 6;

export default function Jobs() {
  const { book } = useShop();
  const [view, setView] = useState<View>("auto");
  const live = book.jobs.filter((j) => j.status === "In progress" || j.status === "Scheduled");
  return (
    <div className="space-y-5">
      <PageHeader
        title="Jobs"
        meta={`${live.filter((j) => j.status === "In progress").length} in progress · ${live.filter((j) => j.status === "Scheduled").length} scheduled · ${book.jobs.length} in the last year`}
        actions={<Segmented<View> label="Calendar view" value={view === "auto" ? "week" : view} onChange={setView} options={[{ value: "agenda", label: "Agenda" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />}
      />
      {view === "auto" ? (
        <>
          <div className="md:hidden"><Agenda /></div>
          <div className="hidden md:block"><Week /></div>
        </>
      ) : view === "agenda" ? <Agenda /> : view === "week" ? <Week /> : <Month />}
      <JobList />
    </div>
  );
}

function Chip({ j, compact = false }: { j: Job; compact?: boolean }) {
  const { customer, seed } = useShop();
  const c = customer(j.customer);
  const color = seed.crews.find((x) => x.id === j.crew)!.color;
  return (
    <span className="block overflow-hidden rounded-[8px] border-l-4 bg-(--d-panel) px-2 py-1.5 text-left text-[12.5px] leading-tight shadow-sm" style={{ borderColor: color }}>
      <span className="block truncate font-semibold">{j.title}</span>
      {!compact ? <span className="block truncate text-(--d-muted)">{c.kind === "Homeowner" ? c.name.split(" ").at(-1) : c.name} · {j.startTime}</span> : null}
    </span>
  );
}

/* --------------------------------- agenda ----------------------------- */

function Agenda() {
  const { book, customer, place, open } = useShop();
  const days = useMemo(() => { const out: Ymd[] = []; let d = book.anchor; while (out.length < 12) { if (isWork(d)) out.push(d); d = addDays(d, 1); } return out; }, [book.anchor]);
  return (
    <AgendaList<Job>
      days={days}
      today={book.anchor}
      noun="job"
      itemsOn={(d) => book.jobs.filter((j) => j.days.includes(d)).sort((a, b) => a.crew.localeCompare(b.crew))}
      getKey={(j) => j.id}
      renderItem={(j, d) => {
        const c = customer(j.customer);
        const where = place(j);
        const first = j.days.indexOf(d) === 0;
        return (
          <>
            <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="flex min-h-16 min-w-0 flex-1 items-start gap-3 p-3 text-left">
              <CrewDot crew={j.crew} className="mt-1.5" />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{j.startTime} · {j.title}</span>
                <span className="block truncate text-[13px] text-(--d-muted)">{c.name} · {where.address}, {where.town}</span>
                <span className="block text-[12.5px] text-(--d-muted)">{first ? "Starts today" : `Day ${j.days.indexOf(d) + 1} of ${j.days.length}`}</span>
              </span>
            </button>
            <button type="button" onClick={() => open({ kind: "move", id: j.id })} className="grid w-16 shrink-0 place-items-center border-l border-(--d-line) text-[12px] font-semibold text-(--d-muted) hover:text-(--d-text)" aria-label={`Move ${j.title}`}>
              <span className="grid place-items-center gap-0.5"><Icon name="calendar" size={18} />Move</span>
            </button>
          </>
        );
      }}
    />
  );
}

/* ---------------------------------- week ------------------------------ */

function Week() {
  const { book, seed, open, moveJob } = useShop();
  return (
    <WeekGrid<Job>
      today={book.anchor}
      lanes={seed.crews.map((c) => ({ id: c.id, label: <span className="flex items-center gap-2"><CrewDot crew={c.id} />{c.name}</span> }))}
      itemsIn={(lane, d) => book.jobs.filter((j) => j.crew === lane && j.days.includes(d))}
      getId={(j) => j.id}
      getLabel={(j) => j.title}
      renderChip={(j, crowded) => <Chip j={j} compact={crowded} />}
      onOpen={(j) => open({ kind: "job", id: j.id })}
      onMove={(j, from, day, lane) => {
        const firstAhead = j.days.find((x) => x >= book.anchor) ?? j.start;
        const target = addDays(firstAhead, diffDays(day, from));
        moveJob(j.id, target < book.anchor ? book.anchor : target, lane as CrewId);
      }}
      hint="Drag a job to another day or crew to reschedule. On a phone, use Move on the agenda."
    />
  );
}

/* --------------------------------- month ------------------------------ */

function Month() {
  const { book, open } = useShop();
  return (
    <MonthGrid<Job>
      today={book.anchor}
      itemsOn={(d) => book.jobs.filter((j) => j.days.includes(d))}
      getId={(j) => j.id}
      renderDot={(j) => <><CrewDot crew={j.crew} className="!size-2" /><span className="truncate">{j.title}</span></>}
      renderItem={(j) => <Chip j={j} />}
      onOpen={(j) => open({ kind: "job", id: j.id })}
    />
  );
}

/* -------------------------------- job list ---------------------------- */

function JobList() {
  const { book, seed, rows, customer, open } = useShop();
  const [status, setStatus] = useState<JobStatus | "Live" | "All">("Live");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);
  const list = book.jobs
    .filter((j) => (status === "All" ? true : status === "Live" ? j.status === "In progress" || j.status === "Scheduled" : j.status === status))
    .filter((j) => { const n = q.trim().toLowerCase(); return !n || `${j.no} ${j.title} ${customer(j.customer).name}`.toLowerCase().includes(n); })
    .sort((a, b) => (status === "Live" ? (a.start < b.start ? -1 : 1) : a.start < b.start ? 1 : -1));
  return (
    <section aria-labelledby="joblist-h" className="space-y-3">
      <h2 id="joblist-h" className="demo-display text-[22px]">All jobs</h2>
      <ChipRow>
        {(["Live", "In progress", "Scheduled", "Complete", "Paid", "All"] as const).map((s) => (
          <FilterChip key={s} on={status === s} onClick={() => { setStatus(s); setLimit(25); }} count={s === "All" ? book.jobs.length : s === "Live" ? book.jobs.filter((j) => j.status === "In progress" || j.status === "Scheduled").length : book.jobs.filter((j) => j.status === s).length}>{s === "Live" ? "In progress + scheduled" : s}</FilterChip>
        ))}
      </ChipRow>
      <SearchBar label="Search jobs" placeholder="Search job #, type or customer" value={q} onChange={(v) => setQ(v)} />
      <ul className="grid *:min-w-0 gap-2 lg:grid-cols-2">
        {list.slice(0, limit).map((j) => {
          const f = jobFinance(book, seed, j, rows);
          return (
            <li key={j.id}>
              <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="demo-card flex w-full items-start justify-between gap-3 p-4 text-left hover:border-(--d-accent)">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold"><CrewDot crew={j.crew} /><span className="truncate">{j.title}</span></span>
                  <span className="block truncate text-[13px] text-(--d-muted)">{j.no} · {customer(j.customer).name} · {shortDate(j.start)}{j.days.length > 1 ? `–${shortDate(j.end)}` : ""}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">{usd(f.total)}</span>
                  <span className="flex flex-wrap justify-end gap-1">{f.over ? <Pill tone="bad">Over</Pill> : null}<Pill tone={j.status === "In progress" ? "accent" : j.status === "Scheduled" ? "info" : j.status === "Paid" ? "good" : "neutral"}>{j.status}</Pill></span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {list.length > limit ? <div className="flex justify-center"><Button onClick={() => setLimit((l) => l + 25)}>Show 25 more</Button></div> : null}
    </section>
  );
}
