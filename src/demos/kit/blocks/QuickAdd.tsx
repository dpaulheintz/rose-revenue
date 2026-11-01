"use client";

import { useState } from "react";
import type { IconName } from "@demos/kit/types";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";

export type QuickAddItem = { label: string; icon: IconName; go: () => void };

/** Floating "+" (thumb-reachable, above the phone tab bar) that opens a sheet of quick actions. */
export function QuickAdd({ items, title = "Quick add" }: { items: QuickAddItem[]; title?: string }) {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label={title}
        aria-haspopup="dialog"
        className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[45] grid size-16 place-items-center rounded-full bg-(--d-accent) text-(--d-on-accent) shadow-[0_12px_30px_-10px_rgb(0_0_0_/_0.6)] hover:brightness-110 md:right-6 md:bottom-6"
      >
        <Icon name="plus" size={30} />
      </button>
      <Dialog open={menu} onClose={() => setMenu(false)} title={title}>
        <ul className="grid *:min-w-0 grid-cols-1 gap-2 pb-2 min-[420px]:grid-cols-2">
          {items.map((it) => (
            <li key={it.label}>
              <button type="button" onClick={() => { setMenu(false); it.go(); }} className="flex min-h-16 w-full items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-left text-[16px] font-semibold hover:border-(--d-accent)">
                <span className="grid size-10 place-items-center rounded-[10px] bg-(--d-panel2) text-(--d-accent)"><Icon name={it.icon} size={22} /></span>
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
