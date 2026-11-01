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
            {i % labelEvery === 0 || i === columns.length - 1 ? (labelEvery > 1 ? c.label : c.label.split(" ")[0]) : ""}
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

/* ----------------------------- line chart ---------------------------- */

/** Multi-series line chart in SVG, with an optional target line. No library: light on phones. */
export function LineChart({ labels, series, height = 180, format, target, title, labelEvery = 1 }: { labels: string[]; series: Array<{ name: string; color: string; values: number[] }>; height?: number; format: (n: number) => string; target?: { value: number; label: string }; title: string; labelEvery?: number }) {
  const all = series.flatMap((x) => x.values).concat(target ? [target.value] : []);
  const hi = Math.max(...all), lo = Math.min(...all, 0);
  const span = hi - lo || 1;
  const n = Math.max(1, labels.length - 1);
  const X = (i: number) => (i / n) * 100;
  const Y = (v: number) => 96 - ((v - lo) / span) * 90;
  const summary = series.map((x) => `${x.name} latest ${format(x.values.at(-1) ?? 0)}`).join(", ");
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
        {series.map((x) => (
          <span key={x.name} className="inline-flex items-center gap-1.5 text-(--d-muted)"><span className="size-2.5 rounded-sm" style={{ background: x.color }} aria-hidden="true" />{x.name} <span className="font-medium text-(--d-text)">{format(x.values.at(-1) ?? 0)}</span></span>
        ))}
        {target ? <span className="text-(--d-muted)">{target.label} {format(target.value)}</span> : null}
      </figcaption>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="block w-full overflow-visible" style={{ height }} role="img" aria-label={`${title}. ${summary}.`}>
        {target ? <line x1="0" x2="100" y1={Y(target.value)} y2={Y(target.value)} stroke="var(--d-muted)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" /> : null}
        {series.map((x) => <polyline key={x.name} points={x.values.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" stroke={x.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="mt-1.5 flex justify-between text-[11.5px] text-(--d-muted)" aria-hidden="true">
        {labels.map((l, i) => (i % labelEvery === 0 || i === labels.length - 1 ? <span key={i}>{l}</span> : null))}
      </div>
    </figure>
  );
}

/* ------------------------------- donut ------------------------------- */

export function Donut({ parts, size = 140, center, format, title }: { parts: Array<{ label: string; value: number; color: string }>; size?: number; center?: ReactNode; format: (n: number) => string; title: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const R = 15.9; // circumference ≈ 100, so dash lengths read as percents
  // Each slice starts where the previous ended (offset 25 = 12 o'clock).
  const offsets = parts.map((_, i) => 25 - parts.slice(0, i).reduce((sum, p) => sum + (p.value / total) * 100, 0));
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={`${title}: ${parts.map((p) => `${p.label} ${format(p.value)}`).join(", ")}`}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--d-panel2)" strokeWidth="6" />
          {parts.map((p, i) => {
            const pct = (p.value / total) * 100;
            return <circle key={p.label} cx="21" cy="21" r={R} fill="none" stroke={p.color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offsets[i]} />;
          })}
        </svg>
        {center ? <div className="absolute inset-0 grid place-items-center text-center">{center}</div> : null}
      </div>
      <ul className="min-w-0 flex-1 space-y-1 text-[13.5px]">
        {parts.map((p) => <li key={p.label} className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden="true" />{p.label}</span><span className="font-medium tabular-nums">{format(p.value)}</span></li>)}
      </ul>
    </div>
  );
}
