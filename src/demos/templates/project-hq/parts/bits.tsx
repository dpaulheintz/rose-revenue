"use client";

import { useState, type ReactNode } from "react";
import Icon from "@demos/kit/ui/Icon";
import type { Status } from "../derive";

export const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const moneyM = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1000 ? `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n / 1000)).toLocaleString("en-US")}k` : money(n));

export const Title = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div className="mb-4"><h1 className="demo-display text-[28px] leading-tight lg:text-[32px]">{children}</h1>{sub ? <p className="mt-1 text-[16px] text-(--d-muted)">{sub}</p> : null}</div>
);
export const H = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 flex items-end justify-between gap-3"><h2 className="demo-display text-[20px] leading-tight">{children}</h2>{action}</div>
);
export const Grid = ({ children, cols = "lg:grid-cols-4" }: { children: ReactNode; cols?: string }) => <div className={`grid grid-cols-2 gap-2.5 *:min-w-0 ${cols}`}>{children}</div>;
export const Panel = ({ title, children, note, action }: { title: ReactNode; children: ReactNode; note?: ReactNode; action?: ReactNode }) => (
  <section className="min-w-0 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4"><H action={action}>{title}</H>{children}{note ? <p className="mt-2 text-[14px] text-(--d-muted)">{note}</p> : null}</section>
);
const TONES = { good: "bg-[color-mix(in_oklab,var(--d-good)_13%,white)] text-(--d-good)", bad: "bg-[color-mix(in_oklab,var(--d-bad)_12%,white)] text-(--d-bad)", warn: "bg-[#fbefd2] text-[#6e4a00]", neutral: "bg-(--d-panel2) text-(--d-muted)", info: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)" };
export const Chip = ({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) => <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[13.5px] font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
export const STATUS_TONE: Record<Status, keyof typeof TONES> = { "On track": "good", "At risk": "warn", "Over budget": "bad" };

/** Percent-complete bar with the number. */
export const Progress = ({ pct }: { pct: number }) => (
  <span className="flex min-w-[96px] items-center gap-2"><span className="h-2 flex-1 overflow-hidden rounded-full bg-(--d-panel2)"><span className="block h-full rounded-full bg-(--d-accent)" style={{ width: `${Math.round(pct * 100)}%` }} /></span><span className="w-9 text-right text-[14px] tabular-nums">{Math.round(pct * 100)}%</span></span>
);

export type Col<T> = { key: string; header: string; cell: (r: T) => ReactNode; sort?: (r: T) => number | string; align?: "right" };

/**
 * Desktop: a table with sortable headers; tap a row to open it. Phones: cards
 * with the row's main facts (`card`), same tap.
 */
export function SortTable<T>({ rows, cols, getKey, onOpen, card, initial, label }: { rows: T[]; cols: Col<T>[]; getKey: (r: T) => string; onOpen: (r: T) => void; card: (r: T) => ReactNode; initial?: { key: string; dir: 1 | -1 }; label: string }) {
  const [sort, setSort] = useState(initial ?? { key: cols[0].key, dir: 1 as 1 | -1 });
  const col = cols.find((c) => c.key === sort.key);
  const sorted = col?.sort ? [...rows].sort((a, b) => { const x = col.sort!(a), y = col.sort!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; }) : rows;
  return (
    <>
      <ul className="space-y-2.5 md:hidden">
        {sorted.map((r) => <li key={getKey(r)}><button type="button" onClick={() => onOpen(r)} className="block min-h-12 w-full rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4 text-left active:bg-(--d-panel2)">{card(r)}</button></li>)}
      </ul>
      <div className="demo-scroll-x hidden rounded-[12px] border border-(--d-line) bg-(--d-panel) md:block">
        <table className="w-full min-w-[880px] text-left text-[15px]" aria-label={label}>
          <thead>
            <tr className="border-b border-(--d-line) text-[13.5px] text-(--d-muted)">
              {cols.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={`px-3 py-1 font-semibold first:pl-4 last:pr-4 ${c.align === "right" ? "text-right" : ""}`}>
                  {c.sort ? (
                    <button type="button" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.align === "right" ? -1 : 1 }))} className={`inline-flex min-h-11 items-center gap-1 ${c.align === "right" ? "flex-row-reverse" : ""} ${sort.key === c.key ? "text-(--d-text)" : ""}`}>
                      {c.header}<Icon name="sort" size={14} className={sort.key === c.key ? "opacity-100" : "opacity-40"} />
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={getKey(r)} onClick={() => onOpen(r)} className="cursor-pointer border-b border-(--d-line) last:border-0 hover:bg-(--d-panel2)">
                {cols.map((c, i) => (
                  <td key={c.key} className={`px-3 py-2.5 first:pl-4 last:pr-4 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                    {i === 0 ? <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(r); }} className="min-h-11 text-left font-semibold hover:underline">{c.cell(r)}</button> : c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
