"use client";

import type { ReactNode } from "react";
import type { Step } from "@demos/buckeye/data";
import type { JobStatus } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { Pill, type Tone } from "@demos/kit/ui/ui";

export const v = ind.vocab;
export const STATUS_TONE: Record<JobStatus, Tone> = { "On track": "good", "At risk": "warn", Late: "bad" };
export const StatusPill = ({ status }: { status: JobStatus }) => <Pill tone={STATUS_TONE[status]}>{status}</Pill>;

/** Part, job and quote numbers read like they do on paperwork. */
export const Num = ({ children }: { children: ReactNode }) => <span className="demo-mono text-[0.92em] whitespace-nowrap">{children}</span>;

/** The yellow inspection tag a lot or heat number lives on. */
export const LotTag = ({ children }: { children: ReactNode }) => (
  <span className="demo-mono inline-block rounded-[3px] px-1.5 py-px text-[0.88em] whitespace-nowrap text-[#2a2208]" style={{ background: ind.brand.highlight }}>{children}</span>
);

/**
 * The traveler: the paper that follows a job through the shop, as one strip of
 * ticks. Filled = done, tag yellow = where it is now, open = still to come.
 */
export function Traveler({ steps, current, showLabel = true }: { steps: Step[]; current: number; showLabel?: boolean }) {
  const label = `${steps.length} steps, step ${current + 1} now: ${steps[current].label}`;
  return (
    <span className="inline-flex min-w-0 items-center gap-2" role="img" aria-label={label}>
      <span className="flex shrink-0 items-center" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={i} className="flex items-center">
            {i ? <span className={`h-0.5 w-2 ${i <= current ? "bg-(--d-accent)" : "bg-(--d-line)"}`} /> : null}
            <span
              className={`block size-3 rounded-[2px] border-2 ${i < current ? "border-(--d-accent) bg-(--d-accent)" : i === current ? "border-[#2a2208]" : "border-(--d-line) bg-(--d-panel)"}`}
              style={i === current ? { background: ind.brand.highlight } : undefined}
            />
          </span>
        ))}
      </span>
      {showLabel ? <span className="truncate text-[13px] text-(--d-muted)">{steps[current].label}</span> : null}
    </span>
  );
}

/** Small KPI: label, big number, one line of context, optional trend. */
export function Kpi({ label, value, sub, tone, trend, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; trend?: ReactNode; onClick?: () => void }) {
  const color = tone === "bad" ? "text-(--d-bad)" : tone === "warn" ? "text-(--d-warn)" : tone === "good" ? "text-(--d-good)" : "text-(--d-muted)";
  const body = (
    <>
      <span className="block text-[13px] leading-tight font-medium text-(--d-muted)">{label}</span>
      <span className="mt-1 flex items-end justify-between gap-2">
        <span className="demo-display text-[32px] leading-none text-(--d-text)">{value}</span>
        {trend ? <span className="shrink-0">{trend}</span> : null}
      </span>
      {sub ? <span className={`mt-1.5 block text-[12.5px] leading-snug ${color}`}>{sub}</span> : null}
    </>
  );
  return onClick
    ? <button type="button" onClick={onClick} className="demo-card block min-h-12 w-full min-w-0 p-3.5 text-left hover:border-(--d-accent)">{body}</button>
    : <div className="demo-card min-w-0 p-3.5">{body}</div>;
}
