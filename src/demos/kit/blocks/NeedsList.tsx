"use client";

import type { ReactNode } from "react";
import Icon from "@demos/kit/ui/Icon";

export type Need = { key: string; tone: "bad" | "warn" | "info"; title: ReactNode; detail?: ReactNode; count?: number | string; onClick?: () => void };

const DOT = { bad: "bg-[color-mix(in_oklab,var(--d-bad)_13%,white)] text-(--d-bad)", warn: "bg-[#fbefd2] text-[#6e4a00]", info: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)" };

/** "Needs attention": computed items, worst first, each tappable. */
export function NeedsList({ items, empty = "Nothing needs you right now." }: { items: Need[]; empty?: ReactNode }) {
  const order = { bad: 0, warn: 1, info: 2 };
  return (
    <ul className="divide-y divide-(--d-line) rounded-[14px] border border-(--d-line) bg-(--d-panel)">
      {[...items].sort((a, b) => order[a.tone] - order[b.tone]).map((n) => {
        const body = (
          <>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${DOT[n.tone]}`}>{n.count != null ? <span className="text-[14px] font-bold">{n.count}</span> : <Icon name="alert" size={18} />}</span>
            <span className="min-w-0 flex-1"><span className="block text-[16px] leading-snug font-semibold">{n.title}</span>{n.detail ? <span className="block text-[14px] leading-snug text-(--d-muted)">{n.detail}</span> : null}</span>
            {n.onClick ? <Icon name="arrow" size={18} className="shrink-0 text-(--d-muted)" /> : null}
          </>
        );
        return <li key={n.key}>{n.onClick ? <button type="button" onClick={n.onClick} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-(--d-panel2)">{body}</button> : <div className="flex min-h-14 items-center gap-3 px-4 py-3">{body}</div>}</li>;
      })}
      {!items.length ? <li className="px-4 py-4 text-(--d-muted)">{empty}</li> : null}
    </ul>
  );
}
