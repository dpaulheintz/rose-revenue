"use client";

import type { ReactNode } from "react";

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const moneyK = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 10000 ? `$${(n / 1000).toFixed(Math.abs(n) >= 100000 ? 0 : 1)}k` : money(n));

export const Title = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div className="mb-4"><h1 className="demo-display text-[30px] leading-tight sm:text-[34px]">{children}</h1>{sub ? <p className="mt-1 text-[16px] text-(--d-muted)">{sub}</p> : null}</div>
);
export const H = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-2.5 flex items-end justify-between gap-3"><h2 className="demo-display text-[21px] leading-tight">{children}</h2>{action}</div>
);
export const Grid = ({ children, cols = "lg:grid-cols-4" }: { children: ReactNode; cols?: string }) => <div className={`grid grid-cols-2 gap-2.5 *:min-w-0 ${cols}`}>{children}</div>;
export const Panel = ({ title, children, note }: { title: ReactNode; children: ReactNode; note?: ReactNode }) => (
  <section className="min-w-0 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4"><H>{title}</H>{children}{note ? <p className="mt-2 text-[14px] text-(--d-muted)">{note}</p> : null}</section>
);
const TONES = { good: "bg-[color-mix(in_oklab,var(--d-good)_13%,white)] text-(--d-good)", bad: "bg-[color-mix(in_oklab,var(--d-bad)_12%,white)] text-(--d-bad)", warn: "bg-[#fbefd2] text-[#6e4a00]", neutral: "bg-(--d-panel2) text-(--d-muted)", info: "bg-[color-mix(in_oklab,var(--d-accent)_12%,white)] text-(--d-accent)" };
export const Chip = ({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) => <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[13.5px] font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
