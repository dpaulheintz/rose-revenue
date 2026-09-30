"use client";

import { useState, type ReactNode } from "react";

/* ------------------------------ sparkline ------------------------------ */

export function Sparkline({ values, width = 96, height = 28, color = "var(--d-accent)", label }: { values: number[]; width?: number; height?: number; color?: string; label?: string }) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${100 - ((v - min) / span) * 88 - 6}`).join(" ");
  const last = values.at(-1)!;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width={width} height={height} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="100" cy={100 - ((last - min) / span) * 88 - 6} r="3.2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------------------------- column chart ----------------------------- */

export type Series = { name: string; color: string };
export type Column = { label: string; values: number[]; note?: string; muted?: boolean };

/**
 * Stacked or grouped columns built from divs (crisp at any width, no layout
 * shift). Tap/click a column to inspect it; the last column is selected first.
 */
export function ColumnChart({
  columns, series, mode = "stack", format, height = 200, title, labelEvery = 1,
}: { columns: Column[]; series: Series[]; mode?: "stack" | "group"; format: (n: number) => string; height?: number; title: string; labelEvery?: number }) {
  const [active, setActive] = useState(columns.length - 1);
  const max = Math.max(1, ...columns.map((c) => (mode === "stack" ? c.values.reduce((s, v) => s + (v || 0), 0) : Math.max(...c.values.map((v) => v || 0)))));
  const col = columns[active];

  return (
    <figure className="min-w-0">
      <figcaption className="mb-3 flex min-h-[44px] flex-wrap items-baseline gap-x-4 gap-y-1 text-[13.5px]">
        <span className="font-medium text-(--d-text)">{col.label}{col.note ? <span className="ml-1 text-(--d-muted)">({col.note})</span> : null}</span>
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-(--d-muted)">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            {s.name} <span className="font-medium text-(--d-text)">{col.values[i] == null ? "closed" : format(col.values[i])}</span>
          </span>
        ))}
        {mode === "stack" ? <span className="text-(--d-muted)">Total <span className="font-medium text-(--d-text)">{format(col.values.reduce((s, v) => s + (v || 0), 0))}</span></span> : null}
      </figcaption>
      <div className="flex items-end gap-[3px] sm:gap-1.5" style={{ height }} role="group" aria-label={title}>
        {columns.map((c, i) => {
          const total = c.values.reduce((s, v) => s + (v || 0), 0);
          const summary = `${c.label}: ${series.map((s, k) => `${s.name} ${c.values[k] == null ? "closed" : format(c.values[k])}`).join(", ")}`;
          return (
            <button
              key={c.label + i}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={summary}
              className={`group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md px-px ${i === active ? "bg-(--d-panel2)" : "hover:bg-(--d-panel2)/60"}`}
            >
              {mode === "stack" ? (
                <span className="flex w-full max-w-[42px] flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ height: `${(total / max) * 100}%`, opacity: c.muted ? 0.55 : 1 }}>
                  {c.values.map((v, k) => (
                    <span key={k} style={{ height: `${total ? ((v || 0) / total) * 100 : 0}%`, background: series[k].color }} />
                  ))}
                </span>
              ) : (
                <span className="flex h-full w-full max-w-[44px] items-end justify-center gap-[2px]">
                  {c.values.map((v, k) => (
                    <span key={k} className="w-1/2 rounded-t-[3px]" style={{ height: `${((v || 0) / max) * 100}%`, background: series[k].color, opacity: v == null ? 0 : 1 }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px] sm:gap-1.5" aria-hidden="true">
        {columns.map((c, i) => (
          <span key={c.label + i} className={`min-w-0 flex-1 truncate text-center text-[11.5px] ${i === active ? "text-(--d-text)" : "text-(--d-muted)"}`}>
            {i % labelEvery === 0 || i === columns.length - 1 ? c.label.split(" ")[0] : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/* ----------------------------- bar list ------------------------------ */

export function BarList({ rows, format, color = "var(--d-accent)" }: { rows: Array<{ label: ReactNode; value: number; right?: ReactNode; sub?: ReactNode; key: string }>; format: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 font-medium">{r.right ?? format(r.value)}</span>
          </div>
          {r.sub ? <div className="text-[12.5px] text-(--d-muted)">{r.sub}</div> : null}
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-(--d-panel2)">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------- split bar ----------------------------- */

export function SplitBar({ parts, format }: { parts: Array<{ label: string; value: number; color: string }>; format: (n: number) => string }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(", ")}>
        {parts.map((p) => (
          <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3 text-[14px]">
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm" style={{ background: p.color }} aria-hidden="true" />{p.label}</span>
            <span className="text-(--d-muted)"><span className="font-medium text-(--d-text)">{format(p.value)}</span> · {Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
