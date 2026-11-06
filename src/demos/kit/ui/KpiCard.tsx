import type { ReactNode } from "react";
import type { Tone } from "@demos/kit/ui/ui";

/**
 * KPI card: label, big number, one line of context and an optional trend
 * (e.g. a Sparkline). Pass onClick to make the whole card a link-like button.
 */
export function KpiCard({ label, value, sub, tone, trend, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; trend?: ReactNode; onClick?: () => void }) {
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
