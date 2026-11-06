"use client";

import { useState } from "react";
import { MonthGrid, WeekAgenda } from "@demos/kit/blocks/Calendar";
import type { Ymd } from "@demos/kit/data/dates";
import { JOB_TYPES, jobType, type JobType } from "@demos/atwood/data";
import type { WJob } from "@demos/atwood/derive";
import { Chip, money, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

const TYPE_COLOR: Record<JobType, string> = { repair: "#266e71", spring: "#b88a2b", opener: "#35979b", door: "#0e4042", commercial: "#6b5a8a", tuneup: "#8a9a9a" };

export default function Jobs() {
  const { d, w, customer, open } = useAt();
  const [types, setTypes] = useState<JobType[]>([]);
  const list = w.jobs.filter((j) => !types.length || types.includes(j.type));
  const on = (day: Ymd) => list.filter((j) => j.date === day);
  const upcoming = w.jobs.filter((j) => j.date > d.today).length;
  const card = (j: WJob) => {
    const c = customer(j.customer);
    return (
      <span className="flex w-full items-stretch gap-3 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3 text-left">
        <span className="w-1.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[j.type] }} aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-[16.5px] leading-snug font-bold">{j.time}, {c.name}</span><span className="block text-[15px] text-(--d-muted)">{jobType(j.type).label}. {c.town}, {money(j.price)}</span></span>
        <span className="shrink-0">{j.done ? <Chip tone="good">Done</Chip> : j.date === d.today ? <Chip tone="info">Today</Chip> : null}</span>
      </span>
    );
  };
  return (
    <div className="space-y-4">
      <Title sub={`${upcoming} jobs on the books. Tap one for the customer, the door and the invoice.`}>Jobs</Title>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1">
        {JOB_TYPES.map((t) => { const sel = types.includes(t.key); return <button key={t.key} type="button" aria-pressed={sel} onClick={() => setTypes((x) => (sel ? x.filter((y) => y !== t.key) : [...x, t.key]))} className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-bold ${sel ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}><span className="size-2.5 rounded-full" style={{ background: TYPE_COLOR[t.key] }} aria-hidden="true" />{t.label}</button>; })}
      </div>
      <div className="md:hidden">
        <WeekAgenda today={d.today} itemsOn={on} getKey={(j) => j.id} noun="job" itemClass="block" renderItem={(j) => <button type="button" className="block w-full" onClick={() => open({ kind: "job", id: j.id })}>{card(j)}</button>} />
      </div>
      <div className="hidden md:block">
        <MonthGrid today={d.today} itemsOn={on} getId={(j) => j.id} onOpen={(j) => open({ kind: "job", id: j.id })}
          renderDot={(j) => <><span className="size-2 shrink-0 rounded-full" style={{ background: TYPE_COLOR[j.type] }} aria-hidden="true" /><span className="truncate">{j.time} {customer(j.customer).name.split(" ").slice(-1)[0]}</span></>}
          renderItem={card} />
      </div>
    </div>
  );
}
