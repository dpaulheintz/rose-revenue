"use client";

import { useId, useMemo, useRef, useState, type PointerEvent as RPE } from "react";
import { addDays, diffDays, monthKey, weekStart, weekday, type Ymd } from "@/lib/demo/dates";
import { dayDate, monthLabel, shortDate } from "@/lib/demo/format";
import { jobFinance } from "@/lib/demo/shop/derive";
import type { CrewId, Job, JobStatus } from "@/lib/demo/shop/types";
import Icon from "../../Icon";
import { Button, FilterChip, PageHeader, Pill, Segmented } from "../../ui";
import { CrewDot, usd } from "../bits";
import { useShop } from "../ShopProvider";

type View = "auto" | "agenda" | "week" | "month";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
    <ol className="space-y-4">
      {days.map((d) => {
        const js = book.jobs.filter((j) => j.days.includes(d)).sort((a, b) => a.crew.localeCompare(b.crew));
        return (
          <li key={d}>
            <h2 className="mb-2 flex items-baseline gap-2"><span className="demo-display text-[18px]">{d === book.anchor ? "Today" : dayDate(d)}</span><span className="text-[13px] text-(--d-muted)">{js.length} job{js.length === 1 ? "" : "s"}</span></h2>
            <ul className="space-y-2">
              {js.map((j) => {
                const c = customer(j.customer);
                const where = place(j);
                const first = j.days.indexOf(d) === 0;
                return (
                  <li key={j.id} className="demo-card flex items-stretch overflow-hidden">
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
                  </li>
                );
              })}
              {!js.length ? <li className="text-[14px] text-(--d-muted)">Nothing scheduled.</li> : null}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------- week ------------------------------ */

type Drag = { id: string; from: Ymd; x: number; y: number; moved: boolean; over: string | null; w: number; label: string };

function Week() {
  const { book, seed, open, moveJob } = useShop();
  const [monday, setMonday] = useState(weekStart(book.anchor));
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i)); // Mon–Sat
  const [drag, setDrag] = useState<Drag | null>(null);
  const startPt = useRef({ x: 0, y: 0 });
  const justDragged = useRef(false);
  const cellAt = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) { const c = (el as HTMLElement).dataset?.cell; if (c) return c; }
    return null;
  };
  const down = (e: RPE<HTMLButtonElement>, j: Job, d: Ymd) => {
    if (e.pointerType === "touch" || d < book.anchor) return; // phones use the Move sheet; past days are history
    e.currentTarget.setPointerCapture(e.pointerId);
    startPt.current = { x: e.clientX, y: e.clientY };
    setDrag({ id: j.id, from: d, x: e.clientX, y: e.clientY, moved: false, over: null, w: e.currentTarget.getBoundingClientRect().width, label: j.title });
  };
  const move = (e: RPE<HTMLButtonElement>) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved, over: moved ? cellAt(e.clientX, e.clientY) : null });
  };
  const up = (j: Job) => {
    if (drag && drag.moved && drag.over) {
      const [crew, day] = drag.over.split("|") as [CrewId, Ymd];
      const firstAhead = j.days.find((x) => x >= book.anchor) ?? j.start;
      const target = addDays(firstAhead, diffDays(day, drag.from));
      if (day >= book.anchor && (day !== drag.from || crew !== j.crew)) moveJob(j.id, target < book.anchor ? book.anchor : target, crew);
    }
    justDragged.current = !!drag?.moved;
    setDrag(null);
  };
  return (
    <section aria-label="Week calendar" className="demo-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-(--d-line) px-4 py-2">
        <Button variant="ghost" onClick={() => setMonday(addDays(monday, -7))} aria-label="Previous week"><span className="rotate-180"><Icon name="arrow" size={18} /></span></Button>
        <p className="font-semibold">Week of {shortDate(monday)}</p>
        <Button variant="ghost" onClick={() => setMonday(addDays(monday, 7))} aria-label="Next week"><Icon name="arrow" size={18} /></Button>
      </div>
      <div className="demo-scroll-x">
        <table className="w-full min-w-[860px] table-fixed border-collapse text-[13px]">
          <colgroup><col className="w-[132px]" />{days.map((d) => <col key={d} />)}</colgroup>
          <thead>
            <tr>
              <th className="p-2" />
              {days.map((d) => <th key={d} className={`p-2 text-left font-semibold ${d === book.anchor ? "text-(--d-accent)" : ""}`}>{DAYS[weekday(d)]} {d.slice(8).replace(/^0/, "")}</th>)}
            </tr>
          </thead>
          <tbody>
            {seed.crews.map((c) => (
              <tr key={c.id} className="border-t border-(--d-line) align-top">
                <th scope="row" className="p-2 text-left font-semibold"><span className="flex items-center gap-2"><CrewDot crew={c.id} />{c.name}</span></th>
                {days.map((d) => {
                  const cell = `${c.id}|${d}`;
                  const js = book.jobs.filter((j) => j.crew === c.id && j.days.includes(d));
                  return (
                    <td key={d} data-cell={cell} className={`h-[92px] border-l border-(--d-line) p-1.5 ${drag?.over === cell ? "bg-[color-mix(in_oklab,var(--d-accent)_16%,transparent)]" : d === book.anchor ? "bg-(--d-panel2)/50" : ""} ${weekday(d) === 6 ? "opacity-70" : ""}`}>
                      <div data-cell={cell} className="flex min-h-full flex-col gap-1">
                        {js.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onPointerDown={(e) => down(e, j, d)}
                            onPointerMove={move}
                            onPointerUp={() => up(j)}
                            onPointerCancel={() => setDrag(null)}
                            onClick={() => { if (justDragged.current) { justDragged.current = false; return; } open({ kind: "job", id: j.id }); }}
                            className={`demo-noselect block min-h-11 w-full touch-manipulation ${d >= book.anchor ? "cursor-grab active:cursor-grabbing" : ""} ${drag?.id === j.id && drag.moved ? "opacity-40" : ""}`}
                            aria-label={`${j.title}, ${dayDate(d)}. Open, or drag to another day.`}
                          >
                            <Chip j={j} compact={js.length > 2} />
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-(--d-line) px-4 py-2.5 text-[12.5px] text-(--d-muted)">Drag a job to another day or crew to reschedule. On a phone, use Move on the agenda.</p>
      {drag?.moved ? <div className="demo-ghost rounded-[8px] border-l-4 border-(--d-accent) bg-(--d-panel2) px-2 py-1.5 text-[12.5px] font-semibold" style={{ left: drag.x - 20, top: drag.y - 16, width: drag.w }} aria-hidden="true">{drag.label}</div> : null}
    </section>
  );
}

/* --------------------------------- month ------------------------------ */

function Month() {
  const { book, open } = useShop();
  const [ym, setYm] = useState(monthKey(book.anchor));
  const first = `${ym}-01`;
  const startGrid = weekStart(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i)).filter((d) => weekday(d) !== 0);
  const [picked, setPicked] = useState<Ymd>(book.anchor);
  const add = (n: number) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); setYm(d.toISOString().slice(0, 7)); };
  const dayJobs = (d: Ymd) => book.jobs.filter((j) => j.days.includes(d));
  return (
    <section aria-label="Month calendar" className="demo-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-(--d-line) px-4 py-2">
        <Button variant="ghost" onClick={() => add(-1)} aria-label="Previous month"><span className="rotate-180"><Icon name="arrow" size={18} /></span></Button>
        <p className="font-semibold">{monthLabel(ym, true)}</p>
        <Button variant="ghost" onClick={() => add(1)} aria-label="Next month"><Icon name="arrow" size={18} /></Button>
      </div>
      <div className="grid grid-cols-6 text-[12.5px]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="px-2 py-1.5 font-semibold text-(--d-muted)">{d}</div>)}
        {cells.slice(0, 36).map((d) => {
          const js = dayJobs(d);
          return (
            <button key={d} type="button" onClick={() => setPicked(d)} aria-pressed={picked === d} className={`min-h-[96px] border-t border-l border-(--d-line) p-1.5 text-left align-top ${d.slice(0, 7) !== ym ? "opacity-45" : ""} ${picked === d ? "bg-[color-mix(in_oklab,var(--d-accent)_14%,transparent)]" : ""}`}>
              <span className={`block font-semibold ${d === book.anchor ? "text-(--d-accent)" : ""}`}>{+d.slice(8)}</span>
              <span className="mt-1 flex flex-col gap-0.5">
                {js.slice(0, 3).map((j) => <span key={j.id} className="flex items-center gap-1 truncate"><CrewDot crew={j.crew} className="!size-2" /><span className="truncate">{j.title}</span></span>)}
                {js.length > 3 ? <span className="text-(--d-muted)">+{js.length - 3} more</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-(--d-line) p-4">
        <p className="mb-2 font-semibold">{dayDate(picked)}</p>
        <ul className="grid *:min-w-0 gap-2 sm:grid-cols-2">
          {dayJobs(picked).map((j) => <li key={j.id}><button type="button" className="block w-full" onClick={() => open({ kind: "job", id: j.id })}><Chip j={j} /></button></li>)}
          {!dayJobs(picked).length ? <li className="text-(--d-muted)">Nothing scheduled.</li> : null}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------- job list ---------------------------- */

function JobList() {
  const { book, seed, rows, customer, open } = useShop();
  const [status, setStatus] = useState<JobStatus | "Live" | "All">("Live");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);
  const searchId = useId();
  const list = book.jobs
    .filter((j) => (status === "All" ? true : status === "Live" ? j.status === "In progress" || j.status === "Scheduled" : j.status === status))
    .filter((j) => { const n = q.trim().toLowerCase(); return !n || `${j.no} ${j.title} ${customer(j.customer).name}`.toLowerCase().includes(n); })
    .sort((a, b) => (status === "Live" ? (a.start < b.start ? -1 : 1) : a.start < b.start ? 1 : -1));
  return (
    <section aria-labelledby="joblist-h" className="space-y-3">
      <h2 id="joblist-h" className="demo-display text-[22px]">All jobs</h2>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {(["Live", "In progress", "Scheduled", "Complete", "Paid", "All"] as const).map((s) => (
          <FilterChip key={s} on={status === s} onClick={() => { setStatus(s); setLimit(25); }} count={s === "All" ? book.jobs.length : s === "Live" ? book.jobs.filter((j) => j.status === "In progress" || j.status === "Scheduled").length : book.jobs.filter((j) => j.status === s).length}>{s === "Live" ? "In progress + scheduled" : s}</FilterChip>
        ))}
      </div>
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">Search jobs</label>
        <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
        <input id={searchId} className="demo-input pl-10" placeholder="Search job #, type or customer" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
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
