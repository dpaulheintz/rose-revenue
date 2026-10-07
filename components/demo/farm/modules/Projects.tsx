"use client";

import { useId, useState } from "react";
import { diffDays } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import type { Priority, Task, TaskStatus } from "@/lib/demo/farm/types";
import Icon from "../../Icon";
import Kanban from "../../Kanban";
import { Avatar, PageHeader, Pill, Segmented, type Tone } from "../../ui";
import { useFarm } from "../FarmProvider";

const STATUSES: TaskStatus[] = ["Not started", "Working on it", "Stuck", "Done"];
const STATUS_STYLE: Record<TaskStatus, string> = {
  "Not started": "bg-(--d-panel) text-(--d-muted) border border-(--d-line)",
  "Working on it": "bg-[color-mix(in_oklab,var(--d-info)_16%,transparent)] text-(--d-info)",
  Stuck: "bg-[color-mix(in_oklab,var(--d-bad)_16%,transparent)] text-(--d-bad)",
  Done: "bg-[color-mix(in_oklab,var(--d-good)_16%,transparent)] text-(--d-good)",
};
const PRIORITY_TONE: Record<Priority, Tone> = { High: "bad", Medium: "warn", Low: "neutral" };

export default function Projects() {
  const { ds, seed, taskStatus, done } = useFarm();
  const [board, setBoard] = useState<string>(seed.boards[0].id);
  const [view, setView] = useState<"table" | "kanban">("kanban");
  const items = ds.tasks.map((t) => ({ ...t, status: taskStatus(t.id, t.status) }));
  const open = items.filter((i) => i.status !== "Done").length;
  const choresLeft = seed.chores.filter((_, i) => !done.has(`chore-${i}`)).length;

  return (
    <div>
      <PageHeader
        title="Projects"
        meta={`${seed.boards.length} boards · ${open} open items · drag a card's grip to move it, or change its status`}
        actions={board !== "chores" ? <Segmented label="View" value={view} onChange={setView} options={[{ value: "kanban", label: <><Icon name="columns" size={16} />Kanban</> }, { value: "table", label: <><Icon name="table" size={16} />Table</> }]} /> : null}
      />
      <div role="tablist" aria-label="Boards" className="demo-scroll-x -mx-4 mb-5 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {[...seed.boards.map((b) => ({ id: b.id, name: b.name, n: items.filter((i) => i.board === b.id && i.status !== "Done").length })), { id: "chores", name: "Daily chores", n: choresLeft }].map((b) => (
          <button
            key={b.id}
            role="tab"
            type="button"
            aria-selected={board === b.id}
            onClick={() => setBoard(b.id)}
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap ${board === b.id ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line) bg-(--d-panel)"}`}
          >
            {b.name}
            <span className={`rounded-full px-1.5 text-[12px] ${board === b.id ? "bg-black/15" : "bg-(--d-panel2) text-(--d-muted)"}`}>{b.n}</span>
          </button>
        ))}
      </div>
      {board === "chores" ? <Chores /> : view === "kanban" ? <Board items={items.filter((i) => i.board === board)} /> : <TableView items={items.filter((i) => i.board === board)} />}
    </div>
  );
}

function StatusSelect({ item }: { item: Task }) {
  const { setTaskStatus } = useFarm();
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">Status for {item.name}</label>
      <select id={id} value={item.status} onChange={(e) => setTaskStatus(item.id, e.target.value as TaskStatus)} className={`min-h-11 cursor-pointer appearance-none rounded-full px-3 text-[13px] font-semibold ${STATUS_STYLE[item.status]}`}>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </>
  );
}

function Due({ item }: { item: Task }) {
  const { ds } = useFarm();
  const d = diffDays(item.due, ds.anchor);
  const late = item.status !== "Done" && d < 0;
  return <span className={`text-[13px] ${late ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}`}>{late ? `${-d}d late` : `Due ${shortDate(item.due)}`}</span>;
}

function Board({ items }: { items: Task[] }) {
  const { person, setTaskStatus } = useFarm();
  return (
    <Kanban
      items={items}
      columns={STATUSES}
      statusOf={(i) => i.status}
      onMove={setTaskStatus}
      columnLabel={(s) => <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${STATUS_STYLE[s]}`}>{s}</span>}
      renderCard={(it, grip, ghost) => (
        <div className="p-2.5">
          <div className="flex items-start gap-1">
            {grip}
            <p className="flex-1 pt-3 text-[14.5px] leading-snug font-semibold">{it.name}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
            <Avatar name={person(it.owner).name} size={26} />
            <Pill tone={PRIORITY_TONE[it.priority]}>{it.priority}</Pill>
            <Due item={it} />
            {!ghost ? <span className="ml-auto"><StatusSelect item={it} /></span> : null}
          </div>
        </div>
      )}
    />
  );
}

function TableView({ items }: { items: Task[] }) {
  const { person } = useFarm();
  return (
    <div className="space-y-4">
      {STATUSES.map((s) => {
        const rows = items.filter((i) => i.status === s);
        if (!rows.length) return null;
        return (
          <section key={s} className="demo-card overflow-hidden">
            <h2 className="px-4 pt-3.5 pb-2"><span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${STATUS_STYLE[s]}`}>{s}</span> <span className="text-[13px] text-(--d-muted)">· {rows.length}</span></h2>
            <div className="demo-scroll-x">
              <table className="w-full min-w-[680px] table-fixed text-[14px]">
                <colgroup><col className="w-[42%]" /><col className="w-[20%]" /><col className="w-[16%]" /><col className="w-[11%]" /><col className="w-[11%]" /></colgroup>
                <thead className="text-[12.5px] text-(--d-muted)">
                  <tr className="border-y border-(--d-line)">{["Item", "Owner", "Status", "Priority", "Due"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold first:pl-4">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((it) => (
                    <tr key={it.id} className="border-b border-(--d-line) last:border-0">
                      <td className="py-2 pr-3 pl-4 font-semibold">{it.name}</td>
                      <td className="px-3"><span className="flex items-center gap-2"><Avatar name={person(it.owner).name} size={26} />{person(it.owner).name.split(" ")[0]}</span></td>
                      <td className="px-3"><StatusSelect item={it} /></td>
                      <td className="px-3"><Pill tone={PRIORITY_TONE[it.priority]}>{it.priority}</Pill></td>
                      <td className="px-3"><Due item={it} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Chores() {
  const { seed, done, toggleDone, person } = useFarm();
  const areas = [...new Set(seed.chores.map((c) => c.area))];
  const total = seed.chores.length;
  const n = seed.chores.filter((_, i) => done.has(`chore-${i}`)).length;
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <section className="demo-card p-4 sm:p-5 lg:col-span-8" aria-label="Daily chores">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="demo-display text-[18px]">Today&apos;s chores</h2>
          <Pill tone={n === total ? "good" : "neutral"}>{n} of {total} done</Pill>
        </div>
        <ul className="divide-y divide-(--d-line)">
          {seed.chores.map((c, i) => (
            <li key={c.task}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 py-1.5">
                <input type="checkbox" className="size-5 shrink-0 accent-(--d-accent)" checked={done.has(`chore-${i}`)} onChange={() => toggleDone(`chore-${i}`)} />
                <span className="demo-mono w-12 shrink-0 text-[13px] text-(--d-muted)">{c.time}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block ${done.has(`chore-${i}`) ? "text-(--d-muted) line-through" : ""}`}>{c.task}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{c.area}</span>
                </span>
                <Avatar name={person(c.owner).name} size={28} />
              </label>
            </li>
          ))}
        </ul>
      </section>
      <section className="demo-card p-4 sm:p-5 lg:col-span-4" aria-label="Chores by area">
        <h2 className="demo-display mb-3 text-[18px]">By area</h2>
        <ul className="space-y-3">
          {areas.map((a) => {
            const list = seed.chores.map((c, i) => ({ c, i })).filter((x) => x.c.area === a);
            const k = list.filter((x) => done.has(`chore-${x.i}`)).length;
            return (
              <li key={a}>
                <div className="flex justify-between text-[14px]"><span className="font-semibold">{a}</span><span className="text-(--d-muted)">{k}/{list.length}</span></div>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-(--d-panel2)"><span className="block h-full rounded-full bg-(--d-accent)" style={{ width: `${(k / list.length) * 100}%` }} /></span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
