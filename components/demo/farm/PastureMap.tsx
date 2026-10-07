"use client";

import { useState } from "react";
import { dayDate, shortDate } from "@/lib/demo/format";
import { diffDays } from "@/lib/demo/dates";
import type { PaddockRow } from "@/lib/demo/farm/derive";
import { fmtDays } from "@/lib/demo/farm/derive";
import { useFarm } from "./FarmProvider";

// Forage height → pasture color, from grazed-down straw to tall green.
const STOPS: Array<[number, [number, number, number]]> = [
  [3, [233, 226, 190]],
  [5, [206, 212, 152]],
  [7, [165, 189, 113]],
  [9, [122, 157, 84]],
  [12, [77, 114, 60]],
];
export function forageColor(h: number) {
  for (let i = 1; i < STOPS.length; i++) {
    const [h1, c1] = STOPS[i];
    const [h0, c0] = STOPS[i - 1];
    if (h <= h1 || i === STOPS.length - 1) {
      const t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
      const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
      return `rgb(${c.join(" ")})`;
    }
  }
  return "rgb(77 114 60)";
}
// Label ink: whichever of dark / light contrasts more with the paddock color.
const lum = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// Labels get a soft halo in the opposite tone so they read on any paddock color.
const ink = (fill: string) => ({ fill, stroke: fill === "#f7f3e3" ? "rgb(34 48 30 / 0.7)" : "rgb(247 243 227 / 0.8)", strokeWidth: 4, strokeLinejoin: "round" as const, paintOrder: "stroke" as const });
const inkOn = (h: number) => {
  const l = lum(forageColor(h).match(/\d+/g)!.map(Number));
  return (l + 0.05) / (0.0273 + 0.05) >= (0.892 + 0.05) / (l + 0.05) ? "#22301e" : "#f7f3e3";
};

export function paddockSummary(p: PaddockRow, anchor: string) {
  if (p.status === "Grazing") return `Herd is here, day ${p.dayIn} of ${p.stay}. Grazed down to about ${p.height.toFixed(1)}″.`;
  if (p.status === "Stockpiled") return `Stockpiled for winter grazing. Rested ${p.rest} days, ${p.height.toFixed(1)}″ and growing.`;
  if (p.status === "Hay") return "Hay field. Third cutting baled; regrowth about 5.5″.";
  return `${p.status === "Next" ? "Next up. " : ""}Rested ${p.rest} days, ${p.height.toFixed(1)}″ tall. Herd back ${fmtDays(diffDays(p.nextGraze!, anchor))} (${shortDate(p.nextGraze!)}).`;
}

export default function PastureMap({ compact = false }: { compact?: boolean }) {
  const { ds, rotation } = useFarm();
  const [sel, setSel] = useState<string | null>(null);
  const selected = rotation.rows.find((r) => r.id === (sel ?? rotation.current.id))!;
  const [hx, hy] = rotation.current.center;
  const [cx, cy] = rotation.coops.center;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-(--d-line) bg-[#ece4cc]">
        <svg viewBox="0 0 600 360" className="block h-auto w-full" role="group" aria-label="Pasture map: 14 paddocks shaded by forage height">
          <defs>
            <pattern id="stockpile" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="rgb(70 104 54)" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="rgb(56 86 44)" strokeWidth="4" />
            </pattern>
            <pattern id="hay" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
              <rect width="18" height="18" fill="#dccb8a" />
              <line x1="0" y1="9" x2="18" y2="9" stroke="#c4ae62" strokeWidth="5" strokeLinecap="round" />
            </pattern>
          </defs>
          {rotation.rows.map((p) => {
            const fill = p.status === "Stockpiled" ? "url(#stockpile)" : p.status === "Hay" ? "url(#hay)" : forageColor(p.height);
            const isSel = p.id === selected.id;
            const label = `${p.name}, ${p.acres} acres. ${paddockSummary(p, ds.anchor)}`;
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={isSel}
                onClick={() => setSel(p.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(p.id); } }}
                className="cursor-pointer outline-none [&:focus-visible>polygon]:stroke-[#22301e] [&:focus-visible>polygon]:stroke-[5]"
              >
                <polygon points={p.poly.map((q) => q.join(",")).join(" ")} fill={fill} stroke={isSel ? "#22301e" : "#f6f1df"} strokeWidth={isSel ? 4 : 3} strokeLinejoin="round" strokeDasharray={p.status === "Next" && !isSel ? "10 6" : undefined} />
                {!compact || p.status !== "Grazing" ? (
                  <text x={p.center[0]} y={p.center[1] + (p.status === "Grazing" ? 34 : 0)} textAnchor="middle" className="pointer-events-none select-none" {...ink(p.status === "Stockpiled" ? "#f7f3e3" : p.status === "Hay" ? "#3a3418" : inkOn(p.height))} style={{ font: "600 15px var(--font-demo-body), sans-serif" }}>
                    {p.name}
                    <tspan x={p.center[0]} dy="18" style={{ font: "500 13px var(--font-demo-mono), monospace" }} opacity={0.85}>
                      {p.status === "Hay" ? "hay" : `${p.height.toFixed(1)}″`}
                    </tspan>
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* Farmstead: barns, parlor, farm store. */}
          <g aria-hidden="true">
            <polygon points={ds.farmstead.map((q) => q.join(",")).join(" ")} fill="#e3d9bd" stroke="#f6f1df" strokeWidth="3" />
            {(() => {
              const fx = ds.farmstead.reduce((s, q) => s + q[0], 0) / 4;
              const fy = ds.farmstead.reduce((s, q) => s + q[1], 0) / 4;
              return (
                <g transform={`translate(${fx - 34} ${fy - 26})`}>
                  <path d="M0 22 L16 8 L32 22 V46 H0 Z" fill="#8a3b2c" />
                  <rect x="11" y="31" width="10" height="15" fill="#f3ead2" />
                  <path d="M38 30 L50 20 L62 30 V46 H38 Z" fill="#6b5a3e" />
                  <rect x="66" y="14" width="7" height="32" rx="3.5" fill="#b8b2a2" />
                  <text x="34" y="64" textAnchor="middle" fill="#4a4a3a" style={{ font: "600 13px var(--font-demo-body), sans-serif" }}>Farmstead</text>
                </g>
              );
            })()}
          </g>
          {/* Eggmobiles trail the herd. */}
          <g aria-hidden="true" transform={`translate(${cx + 30} ${cy - 30})`}>
            <rect x="-15" y="-10" width="30" height="20" rx="4" fill="#f7f3e3" stroke="#22301e" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="5" ry="6.5" fill="#c9a227" />
          </g>
          {/* The herd. */}
          <g aria-hidden="true" transform={`translate(${hx} ${hy - 6})`}>
            <circle r="24" fill="#fcf09a" stroke="#22301e" strokeWidth="3" />
            <path d="M-11 -6 -16 -10M11 -6 16 -10M-9 -8h18l2 9c0 7-5 12-11 12s-11-5-11-12l2-9Z" fill="none" stroke="#22301e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="-4" cy="7" r="1.6" fill="#22301e" />
            <circle cx="4" cy="7" r="1.6" fill="#22301e" />
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-(--d-muted)" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          Forage
          <span className="h-2.5 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${forageColor(3)}, ${forageColor(6)}, ${forageColor(9)}, ${forageColor(12)})` }} />
          3″ → 12″
        </span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, rgb(56 86 44) 0 3px, rgb(70 104 54) 3px 7px)" }} />Stockpiled</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#dccb8a]" />Hay</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-(--d-text) bg-[#fcf09a]" />Herd</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded-[3px] border-2 border-(--d-text) bg-[#f7f3e3]" />Eggmobiles</span>
      </div>

      <div aria-live="polite" className="mt-3 rounded-xl bg-(--d-panel2) px-4 py-3 text-[14px]">
        <p className="font-semibold">
          {selected.name} <span className="font-normal text-(--d-muted)">· {selected.acres} acres · {selected.status}</span>
        </p>
        <p className="mt-0.5 text-(--d-muted)">{paddockSummary(selected, ds.anchor)}</p>
        {selected.status === "Grazing" ? <p className="mt-0.5 text-(--d-muted)">Moves to {rotation.next.name} on {dayDate(rotation.leaving)}.</p> : null}
      </div>
    </div>
  );
}
