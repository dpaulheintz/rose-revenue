"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Icon from "./Icon";

function columnAt<S>(x: number, y: number): S | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const s = (el as HTMLElement).dataset?.column;
    if (s) return s as S;
  }
  return null;
}

type Drag<S> = { id: string; x: number; y: number; dx: number; dy: number; w: number; over: S | null };

/**
 * Generic kanban with pointer-event dragging (mouse, pen and touch). The
 * grip handle starts a drag; dropping on another column calls onMove. Cards
 * should also offer a status <select> as the keyboard / screen-reader path.
 */
export default function Kanban<T extends { id: string; name: string }, S extends string>({
  items, columns, statusOf, onMove, renderCard, columnLabel,
}: {
  items: T[];
  columns: S[];
  statusOf: (item: T) => S;
  onMove: (id: string, to: S) => void;
  renderCard: (item: T, grip: ReactNode, ghost: boolean) => ReactNode;
  columnLabel: (s: S) => ReactNode;
}) {
  const [drag, setDrag] = useState<Drag<S> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const dragged = drag ? items.find((i) => i.id === drag.id) ?? null : null;
  const dragging = drag != null;

  // While dragging, keep scrolling the board as long as the finger rests near an edge.
  useEffect(() => {
    if (!dragging) return;
    let raf = 0;
    const tick = () => {
      const sc = scroller.current;
      if (sc) {
        const r = sc.getBoundingClientRect();
        const { x, y } = pointer.current;
        const step = x < r.left + 56 ? -12 : x > r.right - 56 ? 12 : 0;
        if (step) {
          const before = sc.scrollLeft;
          sc.scrollLeft += step;
          if (sc.scrollLeft !== before) setDrag((d) => (d ? { ...d, over: columnAt<S>(x, y) } : d));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, it: T) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { x: e.clientX, y: e.clientY };
    const card = e.currentTarget.closest("[data-card]")!.getBoundingClientRect();
    setDrag({ id: it.id, x: e.clientX, y: e.clientY, dx: e.clientX - card.left, dy: e.clientY - card.top, w: card.width, over: statusOf(it) });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    pointer.current = { x: e.clientX, y: e.clientY };
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: columnAt<S>(e.clientX, e.clientY) });
  };
  const onUp = () => {
    if (drag && dragged && drag.over && drag.over !== statusOf(dragged)) onMove(drag.id, drag.over);
    setDrag(null);
  };
  const grip = (it: T) => (
    <button
      type="button"
      aria-label={`Drag ${it.name} to another column`}
      onPointerDown={(e) => onDown(e, it)}
      onPointerMove={onPointerMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      className="demo-noselect grid size-12 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-(--d-muted) hover:bg-(--d-panel2) hover:text-(--d-text) active:cursor-grabbing"
    >
      <Icon name="grip" size={18} />
    </button>
  );

  return (
    <>
      <div ref={scroller} className={`demo-scroll-x -mx-4 flex gap-3 px-4 pb-3 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-4 ${drag ? "" : "demo-snap"}`}>
        {columns.map((s) => {
          const col = items.filter((i) => statusOf(i) === s);
          const over = drag?.over === s && dragged && statusOf(dragged) !== s;
          return (
            <section
              key={s}
              data-column={s}
              aria-label={`${s}, ${col.length} items`}
              className={`flex min-h-[300px] w-[82vw] max-w-[330px] shrink-0 flex-col rounded-[20px] border bg-(--d-panel2) transition-colors sm:w-[290px] xl:w-auto xl:max-w-none ${over ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_10%,var(--d-panel2))]" : "border-transparent"}`}
            >
              <header data-column={s} className="flex items-center justify-between px-4 py-3">
                {columnLabel(s)}
                <span className="text-[12.5px] text-(--d-muted)">{col.length}</span>
              </header>
              <ul data-column={s} className="flex flex-1 flex-col gap-2 px-2.5 pb-2.5">
                {col.map((it) => (
                  <li key={it.id} data-card className={`demo-card ${drag?.id === it.id ? "opacity-35" : ""}`}>
                    {renderCard(it, grip(it), false)}
                  </li>
                ))}
                {!col.length ? <li data-column={s} className="grid flex-1 place-items-center rounded-2xl border border-dashed border-(--d-line) p-4 text-[13px] text-(--d-muted)">Drop here</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
      {drag && dragged ? (
        <div className="demo-ghost demo-card border-(--d-accent)" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }} aria-hidden="true">
          {renderCard(dragged, <span className="grid size-12 place-items-center text-(--d-muted)"><Icon name="grip" size={18} /></span>, true)}
        </div>
      ) : null}
    </>
  );
}
