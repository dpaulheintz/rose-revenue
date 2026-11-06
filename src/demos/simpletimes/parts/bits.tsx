"use client";

import type { ReactNode } from "react";
import { BRANDS, type BrandKey, type Stage } from "@demos/simpletimes/catalog";
import type { RunStatus } from "@demos/simpletimes/data";
import Icon from "@demos/kit/ui/Icon";
import type { Tone } from "@demos/kit/ui/ui";

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const moneyK = (n: number) => (Math.abs(n) >= 10000 ? `$${(n / 1000).toFixed(1)}k` : money(n));
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
/** Big numbers: Bayon's 1 reads like an I, so figures use the slab, bold. */
export const NUM = "[font-family:var(--font-demo-body)] font-bold tracking-[-0.03em]";

/** A brand's chip: its color dot and name. `missing` is the cross-sell gap: the brand they don't carry yet. */
export function BrandChip({ brand, missing = false }: { brand: BrandKey; missing?: boolean }) {
  const b = BRANDS[brand];
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap ${missing ? "border border-dashed" : ""}`}
      style={missing ? { borderColor: b.color, color: b.ink } : { background: b.tint, color: b.ink }}
    >
      {missing ? <Icon name="plus" size={13} /> : <span className="size-2 rounded-full" style={{ background: b.color }} aria-hidden="true" />}
      {missing ? <span><span className="sr-only">Cross-sell: </span>{b.name}</span> : b.name}
    </span>
  );
}
export const BrandChips = ({ brands, missing }: { brands: BrandKey[]; missing?: BrandKey | null }) => (
  <span className="inline-flex flex-wrap gap-1.5">
    {brands.map((b) => <BrandChip key={b} brand={b} />)}
    {missing ? <BrandChip brand={missing} missing /> : null}
  </span>
);

/** Plain status chip: tone colors with text kept at 4.5:1 on its tint. */
const TONE: Record<Tone, string> = {
  good: "bg-[color-mix(in_oklab,var(--d-good)_14%,white)] text-(--d-good)",
  bad: "bg-[color-mix(in_oklab,var(--d-bad)_12%,white)] text-(--d-bad)",
  warn: "bg-[color-mix(in_oklab,#cecb00_40%,white)] text-[#5a4a00]",
  info: "bg-[color-mix(in_oklab,var(--d-info)_12%,white)] text-(--d-info)",
  accent: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)",
  neutral: "bg-(--d-panel2) text-(--d-muted)",
};
export const Chip = ({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap ${TONE[tone]}`}>{children}</span>
);

export const RUN_TONE: Record<RunStatus, Tone> = { Scheduled: "neutral", Batching: "info", Bottling: "info", "QA hold": "bad", Released: "good", Shipped: "neutral" };
export const STAGE_TONE: Record<Stage, Tone> = { Inquiry: "neutral", Formulation: "info", Sample: "info", Quote: "warn", Contract: "warn", Production: "good", Repeat: "good" };

/**
 * The list card used on every phone list: the 2-3 facts that matter, a status
 * chip, tap to open. `stripe` puts a brand color down the left edge, like the
 * band on a bottle label.
 */
export function RowCard({ title, meta, right, foot, stripe, onClick, label }: { title: ReactNode; meta?: ReactNode; right?: ReactNode; foot?: ReactNode; stripe?: string; onClick?: () => void; label?: string }) {
  const body = (
    <>
      {stripe ? <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} aria-hidden="true" /> : null}
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[16.5px] leading-snug font-semibold">{title}</span>
          {meta ? <span className="mt-0.5 block text-[14px] leading-snug text-(--d-muted)">{meta}</span> : null}
        </span>
        {right ? <span className="shrink-0">{right}</span> : null}
      </span>
      {foot ? <span className="mt-2.5 block">{foot}</span> : null}
    </>
  );
  const cls = `relative block w-full overflow-hidden rounded-[12px] border border-(--d-line) bg-(--d-panel) py-3.5 pr-4 ${stripe ? "pl-5" : "pl-4"} text-left`;
  return onClick ? <button type="button" onClick={onClick} aria-label={label} className={`${cls} min-h-12 transition-colors duration-150 active:bg-(--d-panel2)`}>{body}</button> : <div className={cls}>{body}</div>;
}

/** Section heading on a screen. */
export const H = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 flex items-end justify-between gap-3">
    <h2 className="demo-display text-[23px] leading-none">{children}</h2>
    {action}
  </div>
);

/** Screen title. Bayon, big, the way the shop sets its headings. */
export const Title = ({ children, sub, action }: { children: ReactNode; sub?: ReactNode; action?: ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
    <div className="min-w-0">
      <h1 className="demo-display text-[38px] leading-[0.95] sm:text-[44px]">{children}</h1>
      {sub ? <p className="mt-1.5 text-[15px] text-(--d-muted)">{sub}</p> : null}
    </div>
    {action}
  </div>
);

/** KPI tile for the 2-column phone grid. */
export function Tile({ label, value, sub, tone, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "bad" | "good" | "warn"; onClick?: () => void }) {
  const subColor = tone === "bad" ? "text-(--d-bad)" : tone === "good" ? "text-(--d-good)" : tone === "warn" ? "text-[#6b5800]" : "text-(--d-muted)";
  const body = (
    <>
      <span className="block text-[14px] leading-tight text-(--d-muted)">{label}</span>
      <span className={`${NUM} mt-1 block text-[32px] leading-none`}>{value}</span>
      {sub ? <span className={`mt-1 block text-[13.5px] leading-snug ${subColor}`}>{sub}</span> : null}
    </>
  );
  const cls = "block min-w-0 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3.5 text-left";
  return onClick ? <button type="button" onClick={onClick} className={`${cls} min-h-12 active:bg-(--d-panel2)`}>{body}</button> : <div className={cls}>{body}</div>;
}

/** A "see all" link-style button. */
export const More = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex min-h-12 items-center gap-1 text-[15px] font-semibold text-(--d-accent)">{children}<Icon name="arrow" size={16} /></button>
);

/** Big − / + stepper for one-handed counting in a store aisle. */
export function Stepper({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-2 pl-4">
      <span className="text-[16px] font-semibold">{label}</span>
      <span className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label.toLowerCase()}`} className="grid size-14 place-items-center rounded-[10px] bg-(--d-panel2) text-[26px] leading-none font-semibold">−</button>
        <span className={`${NUM} w-12 text-center text-[26px]`} aria-live="polite">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`More ${label.toLowerCase()}`} className="grid size-14 place-items-center rounded-[10px] bg-(--d-accent) text-[26px] leading-none font-semibold text-(--d-on-accent)">+</button>
      </span>
    </div>
  );
}
