"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { useSwipe } from "@demos/kit/ui/useSwipe";

/**
 * A pipeline on a phone: one stage at a time. Stage tabs (with counts) scroll
 * sideways; swipe the list to move between stages. Each card gets a "Move to"
 * button (pass it into your card) that opens a sheet of stages instead of
 * drag-and-drop. Pair with PipelineBoard from `md` up.
 */
export function StagePager<T, S extends string>({
  stages, items, stageOf, getKey, getName, onMove, renderCard, label, empty = "Nothing in this stage.", initial,
}: {
  stages: S[];
  items: T[];
  stageOf: (t: T) => S;
  getKey: (t: T) => string;
  getName: (t: T) => string;
  onMove: (key: string, to: S) => void;
  renderCard: (t: T, moveButton: ReactNode) => ReactNode;
  label: string;
  empty?: ReactNode;
  initial?: S;
}) {
  const [stage, setStage] = useState<S>(initial ?? stages[0]);
  const [moving, setMoving] = useState<T | null>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const i = stages.indexOf(stage);
  const go = (n: number) => setStage(stages[Math.max(0, Math.min(stages.length - 1, n))]);
  const swipe = useSwipe(() => go(i + 1), () => go(i - 1));
  useEffect(() => {
    tabs.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [stage]);
  const list = items.filter((t) => stageOf(t) === stage);
  const moveButton = (t: T) => (
    <button type="button" onClick={() => setMoving(t)} className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-(--d-line) px-4 text-[14.5px] font-semibold">
      <Icon name="move" size={16} />Move to
    </button>
  );
  return (
    <div>
      <div ref={tabs} role="tablist" aria-label={label} className="demo-scroll-x -mx-4 flex gap-1.5 px-4 pb-2">
        {stages.map((s) => {
          const n = items.filter((t) => stageOf(t) === s).length;
          const on = s === stage;
          return (
            <button key={s} type="button" role="tab" aria-selected={on} onClick={() => setStage(s)} className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold whitespace-nowrap ${on ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line) bg-(--d-panel)"}`}>
              {s}<span className={`rounded-full px-1.5 text-[12.5px] ${on ? "bg-black/15" : "bg-(--d-panel2) text-(--d-muted)"}`}>{n}</span>
            </button>
          );
        })}
      </div>
      <div {...swipe} className="min-h-[50dvh]">
        <p className="mb-2 flex items-center justify-between text-[14px] text-(--d-muted)">
          <span>Stage {i + 1} of {stages.length}. Swipe for the next.</span>
          <span className="flex gap-1">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous stage" className="grid size-12 place-items-center rounded-full disabled:opacity-30"><Icon name="arrow" size={18} className="rotate-180" /></button>
            <button type="button" onClick={() => go(i + 1)} disabled={i === stages.length - 1} aria-label="Next stage" className="grid size-12 place-items-center rounded-full disabled:opacity-30"><Icon name="arrow" size={18} /></button>
          </span>
        </p>
        <ul className="space-y-2.5">
          {list.map((t) => <li key={getKey(t)}>{renderCard(t, moveButton(t))}</li>)}
          {!list.length ? <li className="rounded-[12px] border border-dashed border-(--d-line) p-6 text-center text-(--d-muted)">{empty}</li> : null}
        </ul>
      </div>
      <Dialog open={!!moving} onClose={() => setMoving(null)} title={moving ? `Move ${getName(moving)}` : "Move"}>
        {moving ? (
          <ul className="space-y-2 pb-2">
            {stages.map((s) => (
              <li key={s}>
                <button type="button" disabled={s === stageOf(moving)} onClick={() => { onMove(getKey(moving), s); setMoving(null); setStage(s); }} className="flex min-h-14 w-full items-center justify-between rounded-[12px] border border-(--d-line) px-4 text-left text-[16px] font-semibold disabled:opacity-45">
                  {s}{s === stageOf(moving) ? <span className="text-[14px] font-normal text-(--d-muted)">Here now</span> : <Icon name="arrow" size={18} className="text-(--d-muted)" />}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Dialog>
    </div>
  );
}
