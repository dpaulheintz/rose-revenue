"use client";

import { useRef, useState, type PointerEvent as RPE, type ReactNode } from "react";
import { addDays, monthKey, weekStart, weekday, type Ymd } from "@demos/kit/data/dates";
import { dayDate, monthLabel, shortDate } from "@demos/kit/data/format";
import Icon from "@demos/kit/ui/Icon";
import { Button } from "@demos/kit/ui/ui";
import { useSwipe } from "@demos/kit/ui/useSwipe";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Phone-friendly list of days. The demo renders each item (usually in a card). */
export function AgendaList<T>({
  days, today, itemsOn, getKey, renderItem, noun = "item", itemClass = "demo-card flex items-stretch overflow-hidden",
}: { days: Ymd[]; today: Ymd; itemsOn: (d: Ymd) => T[]; getKey: (t: T) => string; renderItem: (t: T, d: Ymd) => ReactNode; noun?: string; itemClass?: string }) {
  return (
    <ol className="space-y-4">
      {days.map((d) => {
        const items = itemsOn(d);
        return (
          <li key={d}>
            <h2 className="mb-2 flex items-baseline gap-2"><span className="demo-display text-[18px]">{d === today ? "Today" : dayDate(d)}</span><span className="text-[13px] text-(--d-muted)">{items.length} {noun}{items.length === 1 ? "" : "s"}</span></h2>
            <ul className="space-y-2">
              {items.map((t) => <li key={getKey(t)} className={itemClass}>{renderItem(t, d)}</li>)}
              {!items.length ? <li className="text-[14px] text-(--d-muted)">Nothing scheduled.</li> : null}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

type Drag = { id: string; from: Ymd; x: number; y: number; moved: boolean; over: string | null; w: number; label: string };

/**
 * Week grid: lanes (crews, machines, rooms) by days. Mouse/pen drag moves an
 * item to another day or lane; touch taps open it (give phones a Move sheet).
 */
export function WeekGrid<T>({
  today, lanes, itemsIn, getId, getLabel, renderChip, onOpen, onMove, hint, dayCount = 6,
}: {
  today: Ymd;
  lanes: Array<{ id: string; label: ReactNode }>;
  itemsIn: (lane: string, d: Ymd) => T[];
  getId: (t: T) => string;
  getLabel: (t: T) => string;
  renderChip: (t: T, crowded: boolean) => ReactNode;
  onOpen: (t: T) => void;
  onMove: (t: T, from: Ymd, toDay: Ymd, toLane: string) => void;
  hint?: ReactNode;
  dayCount?: number;
}) {
  const [monday, setMonday] = useState(weekStart(today));
  const days = Array.from({ length: dayCount }, (_, i) => addDays(monday, i));
  const [drag, setDrag] = useState<Drag | null>(null);
  const startPt = useRef({ x: 0, y: 0 });
  const justDragged = useRef(false);
  const cellAt = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) { const c = (el as HTMLElement).dataset?.cell; if (c) return c; }
    return null;
  };
  const down = (e: RPE<HTMLButtonElement>, t: T, d: Ymd) => {
    if (e.pointerType === "touch" || d < today) return; // past days are history
    e.currentTarget.setPointerCapture(e.pointerId);
    startPt.current = { x: e.clientX, y: e.clientY };
    setDrag({ id: getId(t), from: d, x: e.clientX, y: e.clientY, moved: false, over: null, w: e.currentTarget.getBoundingClientRect().width, label: getLabel(t) });
  };
  const move = (e: RPE<HTMLButtonElement>) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved, over: moved ? cellAt(e.clientX, e.clientY) : null });
  };
  const up = (t: T, lane: string) => {
    if (drag && drag.moved && drag.over) {
      const [toLane, day] = drag.over.split("|");
      if (day >= today && (day !== drag.from || toLane !== lane)) onMove(t, drag.from, day, toLane);
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
              {days.map((d) => <th key={d} className={`p-2 text-left font-semibold ${d === today ? "text-(--d-accent)" : ""}`}>{DAYS[weekday(d)]} {d.slice(8).replace(/^0/, "")}</th>)}
            </tr>
          </thead>
          <tbody>
            {lanes.map((l) => (
              <tr key={l.id} className="border-t border-(--d-line) align-top">
                <th scope="row" className="p-2 text-left font-semibold">{l.label}</th>
                {days.map((d) => {
                  const cell = `${l.id}|${d}`;
                  const items = itemsIn(l.id, d);
                  return (
                    <td key={d} data-cell={cell} className={`h-[92px] border-l border-(--d-line) p-1.5 ${drag?.over === cell ? "bg-[color-mix(in_oklab,var(--d-accent)_16%,transparent)]" : d === today ? "bg-(--d-panel2)/50" : ""} ${weekday(d) === 6 ? "opacity-70" : ""}`}>
                      <div data-cell={cell} className="flex min-h-full flex-col gap-1">
                        {items.map((t) => (
                          <button
                            key={getId(t)}
                            type="button"
                            onPointerDown={(e) => down(e, t, d)}
                            onPointerMove={move}
                            onPointerUp={() => up(t, l.id)}
                            onPointerCancel={() => setDrag(null)}
                            onClick={() => { if (justDragged.current) { justDragged.current = false; return; } onOpen(t); }}
                            className={`demo-noselect block min-h-11 w-full touch-manipulation ${d >= today ? "cursor-grab active:cursor-grabbing" : ""} ${drag?.id === getId(t) && drag.moved ? "opacity-40" : ""}`}
                            aria-label={`${getLabel(t)}, ${dayDate(d)}. Open, or drag to another day.`}
                          >
                            {renderChip(t, items.length > 2)}
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
      {hint ? <p className="border-t border-(--d-line) px-4 py-2.5 text-[12.5px] text-(--d-muted)">{hint}</p> : null}
      {drag?.moved ? <div className="demo-ghost rounded-[8px] border-l-4 border-(--d-accent) bg-(--d-panel2) px-2 py-1.5 text-[12.5px] font-semibold" style={{ left: drag.x - 20, top: drag.y - 16, width: drag.w }} aria-hidden="true">{drag.label}</div> : null}
    </section>
  );
}

/** Month grid (Mon–Sat): tap a day to list what's on it below. */
export function MonthGrid<T>({
  today, itemsOn, getId, renderDot, renderItem, onOpen,
}: { today: Ymd; itemsOn: (d: Ymd) => T[]; getId: (t: T) => string; renderDot: (t: T) => ReactNode; renderItem: (t: T) => ReactNode; onOpen: (t: T) => void }) {
  const [ym, setYm] = useState(monthKey(today));
  const startGrid = weekStart(`${ym}-01`);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i)).filter((d) => weekday(d) !== 0);
  const [picked, setPicked] = useState<Ymd>(today);
  const add = (n: number) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); setYm(d.toISOString().slice(0, 7)); };
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
          const items = itemsOn(d);
          return (
            <button key={d} type="button" onClick={() => setPicked(d)} aria-pressed={picked === d} className={`min-h-[96px] border-t border-l border-(--d-line) p-1.5 text-left align-top ${d.slice(0, 7) !== ym ? "opacity-45" : ""} ${picked === d ? "bg-[color-mix(in_oklab,var(--d-accent)_14%,transparent)]" : ""}`}>
              <span className={`block font-semibold ${d === today ? "text-(--d-accent)" : ""}`}>{+d.slice(8)}</span>
              <span className="mt-1 flex flex-col gap-0.5">
                {items.slice(0, 3).map((t) => <span key={getId(t)} className="flex items-center gap-1 truncate">{renderDot(t)}</span>)}
                {items.length > 3 ? <span className="text-(--d-muted)">+{items.length - 3} more</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-(--d-line) p-4">
        <p className="mb-2 font-semibold">{dayDate(picked)}</p>
        <ul className="grid *:min-w-0 gap-2 sm:grid-cols-2">
          {itemsOn(picked).map((t) => <li key={getId(t)}><button type="button" className="block w-full" onClick={() => onOpen(t)}>{renderItem(t)}</button></li>)}
          {!itemsOn(picked).length ? <li className="text-(--d-muted)">Nothing scheduled.</li> : null}
        </ul>
      </div>
    </section>
  );
}

/**
 * Phone agenda, one week at a time: swipe (or tap the arrows) for the next or
 * previous week. Shows days that have something on them, plus today.
 */
export function WeekAgenda<T>({
  today, itemsOn, getKey, renderItem, noun = "item", itemClass,
}: { today: Ymd; itemsOn: (d: Ymd) => T[]; getKey: (t: T) => string; renderItem: (t: T, d: Ymd) => ReactNode; noun?: string; itemClass?: string }) {
  const [monday, setMonday] = useState(weekStart(today));
  const swipe = useSwipe(() => setMonday((m) => addDays(m, 7)), () => setMonday((m) => addDays(m, -7)));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const days = week.filter((d) => d === today || itemsOn(d).length);
  const isThis = monday === weekStart(today);
  return (
    <div {...swipe}>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => setMonday((m) => addDays(m, -7))} aria-label="Previous week" className="grid size-12 place-items-center rounded-full border border-(--d-line) bg-(--d-panel)"><Icon name="arrow" size={18} className="rotate-180" /></button>
        <p className="min-w-0 flex-1 text-center"><span className="demo-display block text-[19px]">{isThis ? "This week" : `Week of ${shortDate(monday)}`}</span><span className="block text-[13.5px] text-(--d-muted)">{shortDate(week[0])} to {shortDate(week[6])}. Swipe for more.</span></p>
        <button type="button" onClick={() => setMonday((m) => addDays(m, 7))} aria-label="Next week" className="grid size-12 place-items-center rounded-full border border-(--d-line) bg-(--d-panel)"><Icon name="arrow" size={18} /></button>
      </div>
      {!isThis ? <div className="mb-3 flex justify-center"><Button variant="ghost" onClick={() => setMonday(weekStart(today))}>Back to this week</Button></div> : null}
      {days.length ? <AgendaList days={days} today={today} itemsOn={itemsOn} getKey={getKey} renderItem={renderItem} noun={noun} itemClass={itemClass} /> : <p className="rounded-[12px] border border-dashed border-(--d-line) p-6 text-center text-(--d-muted)">Nothing scheduled this week.</p>}
    </div>
  );
}
