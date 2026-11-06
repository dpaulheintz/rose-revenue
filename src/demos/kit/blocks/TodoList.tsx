"use client";

import { useState, type ReactNode } from "react";
import { Card, CheckRow, Pill, type Tone } from "@demos/kit/ui/ui";

export type TodoItem = { id: string; text: ReactNode; sub?: ReactNode };

/**
 * To-do or issues list in a card: tap to check off (in memory only), with a
 * count of what's left in the corner. onCheck fires when an item is checked,
 * e.g. to show the demo-mode toast.
 */
export function TodoList({ title, items, left, tone = "neutral", onCheck }: { title: ReactNode; items: TodoItem[]; left: (n: number) => ReactNode; tone?: Tone; onCheck?: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const open = items.length - items.filter((i) => done[i.id]).length;
  return (
    <Card title={title} action={<Pill tone={tone}>{left(open)}</Pill>} bodyClass="px-2 pb-2 pt-2 sm:px-3">
      <ul>
        {items.map((it) => (
          <li key={it.id} className="border-b border-(--d-line) last:border-0">
            <CheckRow className="flex min-h-12 items-center gap-3 rounded-[4px] px-2.5 py-1.5 hover:bg-(--d-panel2)" checked={!!done[it.id]} onChange={(on) => { setDone((d) => ({ ...d, [it.id]: on })); if (on) onCheck?.(); }}>
              <span className={`min-w-0 flex-1 ${done[it.id] ? "text-(--d-muted) line-through" : ""}`}>{it.text}{it.sub ? <span className="block text-[12.5px] text-(--d-muted) no-underline">{it.sub}</span> : null}</span>
            </CheckRow>
          </li>
        ))}
      </ul>
    </Card>
  );
}
