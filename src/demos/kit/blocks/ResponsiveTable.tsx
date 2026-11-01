"use client";

import type { ReactNode } from "react";

export type Column<T> = { key: string; header: ReactNode; cell: (row: T) => ReactNode; align?: "left" | "right"; primary?: boolean; hideOnCard?: boolean };

/**
 * A real table from `md` up, cards on phones (never a sideways-scrolling page).
 * Pass `card` for a custom phone layout; otherwise the primary column heads the
 * card and the rest become label/value rows. `onRow` makes the row or card a button.
 */
export function ResponsiveTable<T>({
  columns, rows, getKey, onRow, card, minWidth = 720, rowLabel,
}: { columns: Column<T>[]; rows: T[]; getKey: (r: T) => string; onRow?: (r: T) => void; card?: (r: T) => ReactNode; minWidth?: number; rowLabel?: (r: T) => string }) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const rest = columns.filter((c) => c !== primary && !c.hideOnCard);
  return (
    <>
      <ul className="space-y-2 md:hidden">
        {rows.map((r) => {
          const inner = card ? card(r) : (
            <>
              <span className="block font-semibold">{primary.cell(r)}</span>
              <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                {rest.map((c) => (
                  <span key={c.key} className="min-w-0"><span className="block text-(--d-muted)">{c.header}</span><span className="block">{c.cell(r)}</span></span>
                ))}
              </span>
            </>
          );
          return (
            <li key={getKey(r)}>
              {onRow ? <button type="button" onClick={() => onRow(r)} className="demo-card block min-h-12 w-full p-4 text-left hover:border-(--d-accent)">{inner}</button> : <div className="demo-card p-4">{inner}</div>}
            </li>
          );
        })}
      </ul>
      <div className="demo-card demo-scroll-x hidden md:block">
        <table className="w-full text-left text-[14px]" style={{ minWidth }}>
          <thead className="text-[12.5px] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              {columns.map((c) => <th key={c.key} scope="col" className={`px-3 py-3 font-semibold first:pl-4 last:pr-4 ${c.align === "right" ? "text-right" : ""}`}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={getKey(r)} className="border-b border-(--d-line) last:border-0 hover:bg-(--d-panel2)/60">
                {columns.map((c, i) => (
                  <td key={c.key} className={`px-3 py-2 first:pl-4 last:pr-4 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                    {i === 0 && onRow ? <button type="button" onClick={() => onRow(r)} aria-label={rowLabel?.(r)} className="min-h-12 text-left font-semibold underline-offset-2 hover:underline">{c.cell(r)}</button> : c.cell(r)}
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
