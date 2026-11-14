"use client";

import { useState, type ReactNode } from "react";
import Dialog from "@demos/kit/ui/Dialog";

/**
 * A number on a card that opens the list behind it. Tap the tile and a sheet
 * (drawer on desktop) shows `list()`, so every figure can be checked.
 */
export function DrillStat({ label, value, sub, tone, title, list, big = true }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "bad" | "warn"; title?: ReactNode; list: () => ReactNode; big?: boolean }) {
  const [open, setOpen] = useState(false);
  const c = tone === "bad" ? "text-(--d-bad)" : tone === "good" ? "text-(--d-good)" : tone === "warn" ? "text-(--d-warn)" : "text-(--d-muted)";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="block min-h-12 w-full min-w-0 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5 text-left transition-colors duration-150 hover:border-(--d-accent) active:bg-(--d-panel2)">
        <span className="block text-[14px] leading-tight text-(--d-muted)">{label}</span>
        <span className={`demo-display mt-1 block leading-none ${big ? "text-[30px]" : "text-[22px]"}`}>{value}</span>
        {sub ? <span className={`mt-1 block text-[13.5px] leading-snug ${c}`}>{sub}</span> : null}
      </button>
      {open ? <Dialog open sheet onClose={() => setOpen(false)} title={title ?? label} subtitle={typeof value === "string" || typeof value === "number" ? String(value) : undefined}>{list()}</Dialog> : null}
    </>
  );
}

/** A plain list row for drill-down sheets: what, detail, figure on the right. */
export function DrillRow({ title, detail, right, onClick }: { title: ReactNode; detail?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="min-w-0 flex-1"><span className="block text-[15.5px] leading-snug font-semibold">{title}</span>{detail ? <span className="block text-[14px] leading-snug text-(--d-muted)">{detail}</span> : null}</span>
      {right ? <span className="shrink-0 text-right text-[15px] font-semibold">{right}</span> : null}
    </>
  );
  return onClick
    ? <li><button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-3 py-2 text-left">{body}</button></li>
    : <li className="flex min-h-12 items-center gap-3 py-2">{body}</li>;
}

/** Wrapper for DrillRows. */
export const DrillList = ({ children, empty = "Nothing here." }: { children: ReactNode; empty?: ReactNode }) => (
  <ul className="divide-y divide-(--d-line)">{children}{!children || (Array.isArray(children) && !children.length) ? <li className="py-3 text-(--d-muted)">{empty}</li> : null}</ul>
);
