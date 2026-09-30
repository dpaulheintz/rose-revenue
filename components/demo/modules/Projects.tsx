"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { Priority, ProjectStatus } from "@/demos/types";
import type { ProjectItem } from "@/lib/demo/generate";
import { diffDays } from "@/lib/demo/dates";
import { dayDate, shortDate } from "@/lib/demo/format";
import { useDemo } from "../DemoProvider";
import Icon from "../Icon";
import { Avatar, PageHeader, Pill, Segmented, type Tone } from "../ui";

const STATUSES: ProjectStatus[] = ["Not started", "Working on it", "Stuck", "Done"];
const STATUS_STYLE: Record<ProjectStatus, string> = {
  "Not started": "bg-(--d-panel2) text-(--d-muted)",
  "Working on it": "bg-[color-mix(in_oklab,var(--d-accent)_24%,transparent)] text-(--d-accent)",
  Stuck: "bg-[color-mix(in_oklab,var(--d-bad)_22%,transparent)] text-(--d-bad)",
  Done: "bg-[color-mix(in_oklab,var(--d-good)_20%,transparent)] text-(--d-good)",
};
const STATUS_BAR: Record<ProjectStatus, string> = { "Not started": "#6d6566", "Working on it": "var(--d-accent)", Stuck: "var(--d-bad)", Done: "var(--d-good)" };
const PRIORITY_TONE: Record<Priority, Tone> = { Critical: "bad", High: "warn", Medium: "accent", Low: "neutral" };
const GROUPS = ["This week", "Up next", "Done"] as const;
const GROUP_COLOR: Record<(typeof GROUPS)[number], string> = { "This week": "var(--d-accent)", "Up next": "#c9c4bb", Done: "var(--d-good)" };

type View = "table" | "kanban";

export default function Projects() {
  const { ds, projectItems } = useDemo();
  const [boardId, setBoardId] = useState(ds.boards[0].id);
  const [view, setView] = useState<View>("table");
  const board = ds.boards.find((b) => b.id === boardId)!;
  const items = projectItems.filter((it) => it.boardId === boardId);

  return (
    <>
      <PageHeader
        title="Projects"
        meta={`${ds.boards.length} boards · ${projectItems.filter((i) => i.status !== "Done").length} open items · drag cards in Kanban, or change status anywhere`}
        actions={<Segmented<View> label="Projects view" value={view} onChange={setView} options={[
          { value: "table", label: <><Icon name="table" size={16} />Table</> },
          { value: "kanban", label: <><Icon name="columns" size={16} />Kanban</> },
        ]} />}
      />

      <div role="tablist" aria-label="Boards" className="demo-scroll-x -mx-4 mb-4 flex gap-2 px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {ds.boards.map((b) => (
          <button
            key={b.id}
            role="tab"
            type="button"
            aria-selected={b.id === boardId}
            onClick={() => setBoardId(b.id)}
            className={`min-h-11 shrink-0 rounded-xl border px-4 text-[14px] font-medium whitespace-nowrap ${b.id === boardId ? "border-(--d-accent) bg-(--d-panel2) text-(--d-text)" : "border-(--d-line) text-(--d-muted) hover:text-(--d-text)"}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="demo-display text-[22px]">{board.name}</h2>
        {board.eventDate ? <span className="text-[13.5px] text-(--d-muted)"><Icon name="calendar" size={15} className="mr-1 inline -translate-y-px" />{dayDate(board.eventDate)}</span> : null}
        <span className="flex flex-wrap gap-2">{STATUSES.map((s) => <span key={s} className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS_STYLE[s]}`}>{items.filter((i) => i.status === s).length} {s.toLowerCase()}</span>)}</span>
      </div>

      {view === "table" ? <TableView items={items} /> : <Kanban items={items} />}
    </>
  );
}

function StatusSelect({ item, compact = false }: { item: ProjectItem; compact?: boolean }) {
  const { setItemStatus } = useDemo();
  return (
    <label className="inline-flex">
      <span className="sr-only">Status for {item.name}</span>
      <select
        value={item.status}
        onChange={(e) => setItemStatus(item.id, e.target.value as ProjectStatus)}
        className={`cursor-pointer appearance-none rounded-full text-center font-medium ${compact ? "min-h-9 px-3 text-[12.5px]" : "min-h-10 w-[128px] px-3 text-[13px]"} ${STATUS_STYLE[item.status]}`}
      >
        {STATUSES.map((s) => <option key={s} className="bg-(--d-panel) text-(--d-text)">{s}</option>)}
      </select>
    </label>
  );
}

function useWindow(items: ProjectItem[]) {
  const { anchor } = useDemo();
  return useMemo(() => {
    const from = items.reduce((m, i) => (i.start < m ? i.start : m), anchor);
    const to = items.reduce((m, i) => (i.due > m ? i.due : m), anchor);
    const span = Math.max(1, diffDays(to, from));
    return { pos: (d: string) => (diffDays(d, from) / span) * 100, today: (diffDays(anchor, from) / span) * 100 };
  }, [items, anchor]);
}

function Timeline({ item, win }: { item: ProjectItem; win: ReturnType<typeof useWindow> }) {
  const left = win.pos(item.start);
  const width = Math.max(3, win.pos(item.due) - left);
  return (
    <div className="relative h-6 w-full min-w-[140px] rounded-md bg-(--d-bg)" aria-label={`${shortDate(item.start)} to ${shortDate(item.due)}`} role="img">
      <span className="absolute top-1.5 bottom-1.5 rounded" style={{ left: `${left}%`, width: `${width}%`, background: STATUS_BAR[item.status] }} />
      <span className="absolute top-0 bottom-0 w-px bg-(--d-text)/70" style={{ left: `${win.today}%` }} aria-hidden="true" />
    </div>
  );
}

function DueText({ item }: { item: ProjectItem }) {
  const { anchor } = useDemo();
  const late = item.status !== "Done" && item.due < anchor;
  return <span className={late ? "text-(--d-bad)" : "text-(--d-muted)"}>{shortDate(item.due)}{late ? " · late" : ""}</span>;
}

function TableView({ items }: { items: ProjectItem[] }) {
  const { person } = useDemo();
  const win = useWindow(items);
  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const rows = items.filter((i) => i.group === g);
        if (!rows.length) return null;
        return (
          <section key={g} className="demo-card overflow-hidden" style={{ borderLeft: `4px solid ${GROUP_COLOR[g]}` }}>
            <h3 className="demo-display px-4 pt-3.5 pb-2 text-[15px]" style={{ color: GROUP_COLOR[g] }}>{g} <span className="text-(--d-muted)">· {rows.length}</span></h3>
            <div className="demo-scroll-x hidden md:block">
              <table className="w-full min-w-[860px] table-fixed text-[14px]">
                <colgroup><col className="w-[31%]" /><col className="w-[8%]" /><col className="w-[15%]" /><col className="w-[11%]" /><col className="w-[10%]" /><col className="w-[25%]" /></colgroup>
                <thead className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">
                  <tr className="border-y border-(--d-line)">
                    {["Item", "Owner", "Status", "Priority", "Due", "Timeline"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-medium first:pl-4">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((it) => (
                    <tr key={it.id} className="border-b border-(--d-line)/60 last:border-0">
                      <td className="py-2 pr-3 pl-4 font-medium">{it.name}</td>
                      <td className="px-3"><Avatar name={person(it.owner).name} size={28} title={`${person(it.owner).name}, ${person(it.owner).role}`} /></td>
                      <td className="px-3"><StatusSelect item={it} /></td>
                      <td className="px-3"><Pill tone={PRIORITY_TONE[it.priority]}>{it.priority}</Pill></td>
                      <td className="px-3 whitespace-nowrap"><DueText item={it} /></td>
                      <td className="px-3 pr-4"><Timeline item={it} win={win} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-(--d-line)/60 md:hidden">
              {rows.map((it) => (
                <li key={it.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{it.name}</p>
                    <Avatar name={person(it.owner).name} size={28} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <StatusSelect item={it} compact />
                    <Pill tone={PRIORITY_TONE[it.priority]}>{it.priority}</Pill>
                    <DueText item={it} />
                  </div>
                  <Timeline item={it} win={win} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------- kanban -------------------------------- */

type Drag = { id: string; x: number; y: number; dx: number; dy: number; w: number; over: ProjectStatus | null };

function Kanban({ items }: { items: ProjectItem[] }) {
  const { person, setItemStatus } = useDemo();
  const [drag, setDrag] = useState<Drag | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const dragged = drag ? items.find((i) => i.id === drag.id) : null;

  const columnAt = (x: number, y: number): ProjectStatus | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      const s = (el as HTMLElement).dataset?.column;
      if (s) return s as ProjectStatus;
    }
    return null;
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, it: ProjectItem) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const card = e.currentTarget.closest("[data-card]")!.getBoundingClientRect();
    setDrag({ id: it.id, x: e.clientX, y: e.clientY, dx: e.clientX - card.left, dy: e.clientY - card.top, w: card.width, over: it.status });
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const sc = scroller.current;
    if (sc) {
      const r = sc.getBoundingClientRect();
      if (e.clientX < r.left + 48) sc.scrollLeft -= 14;
      else if (e.clientX > r.right - 48) sc.scrollLeft += 14;
    }
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: columnAt(e.clientX, e.clientY) });
  };
  const onUp = () => {
    if (drag && dragged && drag.over && drag.over !== dragged.status) setItemStatus(drag.id, drag.over);
    setDrag(null);
  };

  return (
    <>
      <div ref={scroller} className={`demo-scroll-x -mx-4 flex gap-3 px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 xl:grid xl:grid-cols-4 ${drag ? "" : "demo-snap"}`}>
        {STATUSES.map((s) => {
          const col = items.filter((i) => i.status === s);
          const over = drag?.over === s && dragged?.status !== s;
          return (
            <section
              key={s}
              data-column={s}
              aria-label={`${s}, ${col.length} items`}
              className={`demo-card flex min-h-[280px] w-[82vw] max-w-[320px] shrink-0 flex-col transition-colors sm:w-[290px] xl:w-auto xl:max-w-none ${over ? "border-(--d-accent) bg-(--d-panel2)" : ""}`}
            >
              <header data-column={s} className="flex items-center justify-between border-b border-(--d-line) px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ${STATUS_STYLE[s]}`}>{s}</span>
                <span className="text-[12.5px] text-(--d-muted)">{col.length}</span>
              </header>
              <ul data-column={s} className="flex flex-1 flex-col gap-2 p-2.5">
                {col.map((it) => (
                  <li key={it.id} data-card className={`rounded-xl border border-(--d-line) bg-(--d-bg) ${drag?.id === it.id ? "opacity-35" : ""}`}>
                    <KanbanCard item={it} ownerName={person(it.owner).name}
                      grip={
                        <button
                          type="button"
                          aria-label={`Drag ${it.name} to another column`}
                          onPointerDown={(e) => onDown(e, it)}
                          onPointerMove={onMove}
                          onPointerUp={onUp}
                          onPointerCancel={() => setDrag(null)}
                          className="demo-noselect grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-(--d-muted) hover:bg-(--d-panel2) hover:text-(--d-text) active:cursor-grabbing"
                        >
                          <Icon name="grip" size={18} />
                        </button>
                      }
                    />
                  </li>
                ))}
                {!col.length ? <li data-column={s} className="grid flex-1 place-items-center rounded-xl border border-dashed border-(--d-line) p-4 text-[13px] text-(--d-muted)">Drop here</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
      {drag && dragged ? (
        <div className="demo-ghost rounded-xl border border-(--d-accent) bg-(--d-panel2)" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }} aria-hidden="true">
          <KanbanCard item={dragged} ownerName={person(dragged.owner).name} grip={<span className="grid size-11 place-items-center text-(--d-muted)"><Icon name="grip" size={18} /></span>} ghost />
        </div>
      ) : null}
    </>
  );
}

function KanbanCard({ item, ownerName, grip, ghost = false }: { item: ProjectItem; ownerName: string; grip: ReactNode; ghost?: boolean }) {
  return (
    <div className="p-2.5">
      <div className="flex items-start gap-1">
        {grip}
        <p className="flex-1 pt-2.5 text-[14.5px] leading-snug font-medium">{item.name}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-1 text-[12.5px]">
        <Avatar name={ownerName} size={24} />
        <Pill tone={PRIORITY_TONE[item.priority]}>{item.priority}</Pill>
        <DueText item={item} />
        {!ghost ? <span className="ml-auto"><StatusSelect item={item} compact /></span> : null}
      </div>
    </div>
  );
}
