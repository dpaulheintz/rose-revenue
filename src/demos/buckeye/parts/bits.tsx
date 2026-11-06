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

/** KPI card (kit). */
export { KpiCard as Kpi } from "@demos/kit/ui/KpiCard";
