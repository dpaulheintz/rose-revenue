"use client";

import { useRef, useState } from "react";
import { kpiRows, onTrack, type KpiRow } from "@/lib/demo/derive";
import { addDays } from "@/lib/demo/dates";
import { moneyK, shortDate } from "@/lib/demo/format";
import { useDemo } from "../DemoProvider";
import { Sparkline } from "../charts";
import { fmtKpi } from "./Overview";
import { Avatar, PageHeader, Pill } from "../ui";

export default function Kpis() {
  const { cfg, ds, kpiEdits, editKpi, person } = useDemo();
  const rows = kpiRows(ds, cfg);
  const [editing, setEditing] = useState<string | null>(null);
  const value = (r: KpiRow, i: number) => kpiEdits[`${r.def.key}:${i}`] ?? r.weekly[i];
  const lastGreen = rows.filter((r) => onTrack(r, value(r, 12))).length;

  return (
    <>
      <PageHeader
        title="Scorecard"
        meta={`Weekly measurables · ${shortDate(ds.weeks[0])} – ${shortDate(addDays(ds.weeks[12], 6))} · Tap a number to edit it`}
        actions={<Pill tone={lastGreen >= 9 ? "good" : "warn"}>{lastGreen} of {rows.length} on track last week</Pill>}
      />

      <div className="demo-card demo-scroll-x">
        <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-[13.5px]">
          <caption className="sr-only">KPI scorecard: rows are measurables, columns are weeks; each cell is marked on track or off track against the goal.</caption>
          <thead>
            <tr className="text-[11.5px] uppercase tracking-[0.06em] text-(--d-muted)">
              <th scope="col" className="sticky left-0 z-10 border-b border-(--d-line) bg-(--d-panel) px-4 py-3 text-left font-medium">Measurable · owner · goal</th>
              {ds.weeks.map((w, i) => (
                <th key={w} scope="col" className={`border-b border-(--d-line) px-1 py-3 text-center font-medium ${i === 12 ? "text-(--d-text)" : ""}`}>
                  {shortDate(w)}{i === 12 ? <span className="block text-[10px] normal-case tracking-normal text-(--d-accent)">last week</span> : null}
                </th>
              ))}
              <th scope="col" className="border-b border-(--d-line) px-3 py-3 text-left font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const owner = person(r.def.owner);
              const series = r.weekly.map((_, i) => value(r, i));
              return (
                <tr key={r.def.key}>
                  <th scope="row" className="sticky left-0 z-10 border-b border-(--d-line)/70 bg-(--d-panel) px-4 py-2.5 text-left font-normal">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={owner.name} size={26} title={`${owner.name}, ${owner.role}`} />
                      <div className="min-w-0">
                        <p className="max-w-[170px] truncate font-medium">{r.def.name}</p>
                        <p className="text-[12px] text-(--d-muted)">Goal {r.def.direction === "atMost" ? "≤" : "≥"} {fmtKpi(r.def.unit, r.goal)} · {owner.name.split(" ")[0]}</p>
                      </div>
                    </div>
                  </th>
                  {series.map((v, i) => {
                    const id = `${r.def.key}:${i}`;
                    const good = onTrack(r, v);
                    const edited = id in kpiEdits;
                    return (
                      <td key={id} className="border-b border-(--d-line)/70 p-1">
                        {editing === id ? (
                          <CellEditor
                            initial={v}
                            label={`${r.def.name}, week of ${shortDate(ds.weeks[i])}`}
                            onDone={(n) => {
                              setEditing(null);
                              if (n !== null && n !== v) editKpi(r.def.key, i, n);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing(id)}
                            aria-label={`${r.def.name}, week of ${shortDate(ds.weeks[i])}: ${fmtCell(r, v)}, ${good ? "on track" : "off track"}. Edit`}
                            className={`flex min-h-11 w-full min-w-[54px] items-center justify-center gap-0.5 rounded-lg px-0.5 text-[13px] font-medium ${
                              good ? "bg-[color-mix(in_oklab,var(--d-good)_16%,transparent)] text-(--d-good)" : "bg-[color-mix(in_oklab,var(--d-bad)_18%,transparent)] text-(--d-bad)"
                            } ${i === 12 ? "ring-1 ring-(--d-line)" : ""} ${edited ? "outline-1 outline-dashed outline-(--d-accent)" : ""}`}
                          >
                            <span aria-hidden="true" className="text-[11px]">{good ? "✓" : "✕"}</span>
                            {fmtCell(r, v)}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-(--d-line)/70 px-3">
                    <Sparkline values={series} width={72} height={24} color={onTrack(r, series[12]) ? "var(--d-good)" : "var(--d-bad)"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-(--d-muted)">
        <span><span className="text-(--d-good)">✓ green</span> = at or better than goal</span>
        <span><span className="text-(--d-bad)">✕ red</span> = off track</span>
        <span><span className="text-(--d-accent)">dashed</span> = edited in this session (not saved)</span>
      </p>
    </>
  );
}

function fmtCell(r: KpiRow, v: number) {
  return r.def.unit === "money" ? `$${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
}

function CellEditor({ initial, label, onDone }: { initial: number; label: string; onDone: (n: number | null) => void }) {
  const [text, setText] = useState(String(Math.round(initial)));
  const finished = useRef(false); // Enter commits, then the unmount blurs: only act once
  const finish = (n: number | null) => {
    if (finished.current) return;
    finished.current = true;
    onDone(n);
  };
  const commit = () => {
    const n = Number(text.replace(/[$,k\s]/gi, ""));
    finish(Number.isFinite(n) && text.trim() !== "" ? n : null);
  };
  return (
    <input
      autoFocus
      inputMode="decimal"
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") finish(null);
      }}
      className="demo-input min-h-11 min-w-[54px] px-1 text-center"
    />
  );
}
