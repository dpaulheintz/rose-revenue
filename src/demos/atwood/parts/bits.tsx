"use client";

import type { ReactNode } from "react";
import type { Tone } from "@demos/kit/ui/ui";
import Icon from "@demos/kit/ui/Icon";
import { REVIEW_LINK, type Door } from "@demos/atwood/data";
import { shortDay } from "@demos/atwood/derive";

/** The ready-to-send review request. */
export const reviewText = (first: string) => `Hi ${first}, thanks for choosing Atwood Door Company. If you have a minute, a quick Google review helps a small business like mine more than you'd think: ${REVIEW_LINK}`;

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const moneyK = (n: number) => (Math.abs(n) >= 10000 ? `$${(n / 1000).toFixed(1)}k` : money(n));

const TONE: Record<Tone, string> = {
  good: "bg-[color-mix(in_oklab,var(--d-good)_13%,white)] text-(--d-good)",
  bad: "bg-[color-mix(in_oklab,var(--d-bad)_12%,white)] text-(--d-bad)",
  warn: "bg-[#fbefd2] text-[#6e4a00]",
  info: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)",
  accent: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)",
  neutral: "bg-(--d-panel2) text-(--d-muted)",
};
export const Chip = ({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[13.5px] font-bold whitespace-nowrap ${TONE[tone]}`}>{children}</span>
);
export const PAY_TONE: Record<string, Tone> = { Paid: "good", Unpaid: "warn", Overdue: "bad" };

export const Title = ({ children, sub, action }: { children: ReactNode; sub?: ReactNode; action?: ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
    <div className="min-w-0"><h1 className="demo-display text-[30px] leading-tight sm:text-[34px]">{children}</h1>{sub ? <p className="mt-1 text-[16px] text-(--d-muted)">{sub}</p> : null}</div>
    {action}
  </div>
);
export const H = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 flex items-end justify-between gap-3"><h2 className="demo-display text-[21px] leading-tight">{children}</h2>{action}</div>
);
export const More = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex min-h-12 items-center gap-1 text-[15.5px] font-bold text-(--d-accent)">{children}<Icon name="arrow" size={16} /></button>
);

/** Every list on a phone is these: 2-3 facts, a chip, tap to open. */
export function Card({ title, meta, right, foot, onClick, accent }: { title: ReactNode; meta?: ReactNode; right?: ReactNode; foot?: ReactNode; onClick?: () => void; accent?: boolean }) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0"><span className="block text-[17px] leading-snug font-bold">{title}</span>{meta ? <span className="mt-0.5 block text-[15px] leading-snug text-(--d-muted)">{meta}</span> : null}</span>
        {right ? <span className="shrink-0">{right}</span> : null}
      </span>
      {foot ? <span className="mt-2.5 block">{foot}</span> : null}
    </>
  );
  const cls = `block w-full rounded-[14px] border bg-(--d-panel) p-4 text-left ${accent ? "border-(--d-accent) border-l-[6px]" : "border-(--d-line)"}`;
  return onClick ? <button type="button" onClick={onClick} className={`${cls} min-h-12 active:bg-(--d-panel2)`}>{body}</button> : <div className={cls}>{body}</div>;
}

export function Tile({ label, value, sub, tone, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "bad" | "warn"; onClick?: () => void }) {
  const c = tone === "bad" ? "text-(--d-bad)" : tone === "good" ? "text-(--d-good)" : tone === "warn" ? "text-[#6e4a00]" : "text-(--d-muted)";
  const body = (<><span className="block text-[14.5px] leading-tight text-(--d-muted)">{label}</span><span className="demo-display mt-1 block text-[30px] leading-none">{value}</span>{sub ? <span className={`mt-1 block text-[14px] leading-snug ${c}`}>{sub}</span> : null}</>);
  const cls = "block min-w-0 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3.5 text-left";
  return onClick ? <button type="button" onClick={onClick} className={`${cls} min-h-12 active:bg-(--d-panel2)`}>{body}</button> : <div className={cls}>{body}</div>;
}

export const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="inline-flex gap-0.5 text-[#c48a12]" role="img" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" fill={i < n ? "currentColor" : "#d9dddc"} /></svg>)}
  </span>
);

/**
 * The door, drawn from its spec: panel rows and columns from its size, windows
 * on top if it has them, its color. The heart of the door profile.
 */
export function DoorArt({ door, className = "" }: { door: Pick<Door, "size" | "windows" | "color" | "model">; className?: string }) {
  const [w, h] = door.size.split(" × ").map(Number);
  const cols = w >= 14 ? 8 : w >= 10 ? 5 : 4;
  const rows = h >= 10 ? 5 : 4;
  const fill: Record<string, string> = { White: "#f4f4f2", Almond: "#ece2cf", Sandstone: "#d9cdb4", "Desert tan": "#c8b28a", Brown: "#6f533d", Black: "#2d2f30" };
  const f = fill[door.color] ?? "#e4e8e8";
  const dark = door.color === "Brown" || door.color === "Black";
  const carriage = door.model.toLowerCase().includes("carriage");
  const W = 200, H = (200 * h) / w;
  const pw = W / cols, ph = H / rows;
  return (
    <svg viewBox={`-8 -8 ${W + 16} ${H + 16}`} className={className} role="img" aria-label={`${door.size} ft ${door.color.toLowerCase()} door, ${door.model.toLowerCase()}`}>
      <rect x={-8} y={-8} width={W + 16} height={H + 16} rx={6} fill="#0e4042" />
      <rect x={0} y={0} width={W} height={H} fill={f} />
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r}>
          <line x1={0} x2={W} y1={r * ph} y2={r * ph} stroke={dark ? "#00000055" : "#00000026"} strokeWidth={1.4} />
          {Array.from({ length: cols }).map((__, c) => (
            r === 0 && door.windows
              ? <rect key={c} x={c * pw + 4} y={r * ph + 5} width={pw - 8} height={ph - 10} rx={2} fill="#9fc3c5" stroke="#0e4042" strokeWidth={0.8} />
              : carriage
                ? <rect key={c} x={c * pw + 3} y={r * ph + 3} width={pw - 6} height={ph - 6} fill="none" stroke={dark ? "#ffffff22" : "#0000001f"} strokeWidth={1.2} />
                : <rect key={c} x={c * pw + 5} y={r * ph + 6} width={pw - 10} height={ph - 12} rx={2} fill="none" stroke={dark ? "#ffffff2a" : "#00000024"} strokeWidth={1.4} />
          ))}
        </g>
      ))}
      {carriage ? <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke={dark ? "#ffffff33" : "#0000002e"} strokeWidth={1.4} /> : null}
    </svg>
  );
}

/** The spec plate beside the drawing. */
export function DoorSpecs({ door, today }: { door: Door; today: string }) {
  const covered = door.warrantyEnd >= today;
  const rows: Array<[string, ReactNode]> = [
    ["Size", `${door.size} ft`], ["Door", door.model], ["Color", door.color], ["Opener", door.opener], ["Springs", door.springs],
    ["Installed", shortDay(door.installed) + `, ${door.installed.slice(0, 4)}`], ["Warranty", <span key="w" className={covered ? "text-(--d-good)" : "text-(--d-bad)"}>{covered ? "Until" : "Ended"} {shortDay(door.warrantyEnd)}, {door.warrantyEnd.slice(0, 4)}</span>],
  ];
  return (
    <dl className="divide-y divide-(--d-line) rounded-[12px] border border-(--d-line)">
      {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-3 py-2 text-[15px]"><dt className="shrink-0 text-(--d-muted)">{k}</dt><dd className="min-w-0 text-right font-bold">{v}</dd></div>)}
    </dl>
  );
}
