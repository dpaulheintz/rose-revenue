"use client";

import { useState, type ReactNode } from "react";
import Dialog from "@demos/kit/ui/Dialog";

const BUCKETS = [
  { key: "0-30", label: "0-30 days", max: 30, color: "#6b9bc3" },
  { key: "31-60", label: "31-60", max: 60, color: "#d9a13b" },
  { key: "61-90", label: "61-90", max: 90, color: "#d9703b" },
  { key: "90+", label: "90+", max: Infinity, color: "#b3372f" },
];

/**
 * Receivables aging: 0-30 / 31-60 / 61-90 / 90+ days, as a split bar and four
 * tappable buckets. Each bucket opens the items in it.
 */
export function AgingBuckets<T>({ items, daysOf, amountOf, renderItem, getKey, money, title = "Aging" }: { items: T[]; daysOf: (t: T) => number; amountOf: (t: T) => number; renderItem: (t: T) => ReactNode; getKey: (t: T) => string; money: (n: number) => string; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const groups = BUCKETS.map((b, i) => {
    const min = i ? BUCKETS[i - 1].max : -Infinity;
    const xs = items.filter((t) => daysOf(t) > min && daysOf(t) <= b.max).sort((a, c) => daysOf(c) - daysOf(a));
    return { ...b, items: xs, total: xs.reduce((s, t) => s + amountOf(t), 0) };
  });
  const total = groups.reduce((s, g) => s + g.total, 0) || 1;
  const sel = groups.find((g) => g.key === open);
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-(--d-panel2)" role="img" aria-label={groups.map((g) => `${g.label}: ${money(g.total)}`).join(", ")}>
        {groups.map((g) => <span key={g.key} style={{ width: `${(g.total / total) * 100}%`, background: g.color }} />)}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 *:min-w-0 sm:grid-cols-4">
        {groups.map((g) => (
          <li key={g.key}>
            <button type="button" onClick={() => setOpen(g.key)} className="block min-h-12 w-full rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3 text-left hover:border-(--d-accent)">
              <span className="flex items-center gap-1.5 text-[13.5px] text-(--d-muted)"><span className="size-2.5 rounded-full" style={{ background: g.color }} aria-hidden="true" />{g.label}</span>
              <span className="demo-display block text-[22px] leading-tight">{money(g.total)}</span>
              <span className="text-[13px] text-(--d-muted)">{g.items.length} {g.items.length === 1 ? "item" : "items"}</span>
            </button>
          </li>
        ))}
      </ul>
      {sel ? (
        <Dialog open sheet onClose={() => setOpen(null)} title={`${title}: ${sel.label}${sel.key === "0-30" ? "" : " days"}`} subtitle={money(sel.total)}>
          <ul className="divide-y divide-(--d-line)">{sel.items.map((t) => <li key={getKey(t)}>{renderItem(t)}</li>)}{!sel.items.length ? <li className="py-3 text-(--d-muted)">Nothing in this bucket.</li> : null}</ul>
        </Dialog>
      ) : null}
    </div>
  );
}
