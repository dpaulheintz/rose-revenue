import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hash } from "@/lib/demo/rng";
import { initials } from "@/lib/demo/format";

export type Tone = "good" | "bad" | "warn" | "neutral" | "accent" | "info";

const TONE: Record<Tone, string> = {
  // Text is pulled toward the ink color so it stays ≥ 4.5:1 on its own tint.
  good: "bg-[color-mix(in_oklab,var(--d-good)_16%,transparent)] text-[color-mix(in_oklab,var(--d-good)_72%,var(--d-text))]",
  bad: "bg-[color-mix(in_oklab,var(--d-bad)_16%,transparent)] text-[color-mix(in_oklab,var(--d-bad)_80%,var(--d-text))]",
  warn: "bg-[color-mix(in_oklab,var(--d-warn)_16%,transparent)] text-[color-mix(in_oklab,var(--d-warn)_80%,var(--d-text))]",
  accent: "bg-[color-mix(in_oklab,var(--d-accent)_18%,transparent)] text-[color-mix(in_oklab,var(--d-accent)_72%,var(--d-text))]",
  info: "bg-[color-mix(in_oklab,var(--d-info)_14%,transparent)] text-[color-mix(in_oklab,var(--d-info)_80%,var(--d-text))]",
  neutral: "bg-(--d-panel2) text-(--d-muted)",
};

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md border border-(--d-line) px-1.5 py-px text-[11.5px] text-(--d-muted)">{children}</span>
  );
}

// Every color keeps white initials ≥ 5:1.
const AVATAR_COLORS = ["#74592c", "#4f6d5a", "#5b5f8a", "#7a4f5a", "#3f6b73", "#6b5b3f", "#50682f", "#7b5a80"];

export function Avatar({ name, size = 28, title }: { name: string; size?: number; title?: string }) {
  return (
    <span
      title={title ?? name}
      className="inline-grid shrink-0 place-items-center rounded-full font-medium text-[#f4efe8]"
      style={{ width: size, height: size, fontSize: size * 0.4, background: AVATAR_COLORS[hash(name) % AVATAR_COLORS.length] }}
    >
      <span aria-hidden="true">{initials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function Card({
  title, action, children, className = "", bodyClass = "p-4 sm:p-5",
}: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={`demo-card min-w-0 ${className}`}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <h2 className="demo-display text-[18px] text-(--d-text)">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone }) {
  return (
    <div className="demo-card min-w-0 p-4">
      <p className="text-[13px] font-medium text-(--d-muted)">{label}</p>
      <p className="demo-display mt-1.5 text-[28px] text-(--d-text)">{value}</p>
      {sub ? <p className={`mt-1.5 text-[13px] ${tone ? TONE[tone].split(" ").at(-1) : "text-(--d-muted)"}`}>{sub}</p> : null}
    </div>
  );
}

export function PageHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div>
        <h1 className="demo-display text-[30px] sm:text-[36px]">{title}</h1>
        {meta ? <p className="mt-2 text-[13.5px] text-(--d-muted)">{meta}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };

export function Button({ variant = "secondary", className = "", ...rest }: ButtonProps) {
  const styles = {
    primary: "bg-(--d-accent) text-(--d-on-accent) hover:brightness-105",
    secondary: "border border-(--d-line) bg-(--d-panel) text-(--d-text) hover:border-(--d-muted)",
    ghost: "text-(--d-muted) hover:text-(--d-text) hover:bg-(--d-panel2)",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] font-semibold transition-[filter,border-color,background-color] duration-150 disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: Array<{ value: T; label: ReactNode }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl border border-(--d-line) bg-(--d-panel2)">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`inline-flex min-h-12 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3.5 text-[14px] font-semibold ${
            o.value === value ? "bg-(--d-accent) text-(--d-on-accent)" : "text-(--d-muted) hover:text-(--d-text)"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold text-(--d-muted)">{label}</span>
      {children}
    </label>
  );
}

export function EarTag({ tag }: { tag: string }) {
  return (
    <span className="demo-tag" title={`Ear tag ${tag}`}>
      <span className="sr-only">Ear tag </span>
      {tag}
    </span>
  );
}

/** Filter chip (toggle button) with an optional count. */
export function FilterChip({ on, onClick, children, count }: { on: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[14px] font-semibold ${
        on ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line) bg-(--d-panel) text-(--d-text) hover:border-(--d-muted)"
      }`}
    >
      {children}
      {count != null ? <span className={`rounded-full px-1.5 text-[12px] ${on ? "bg-black/15" : "bg-(--d-panel2) text-(--d-muted)"}`}>{count}</span> : null}
    </button>
  );
}

/** Tabs for switching views within a module. */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: Array<{ value: T; label: string; count?: number }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="demo-scroll-x -mx-4 mb-5 flex gap-1 border-b border-(--d-line) px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={`-mb-px inline-flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-3 text-[15px] font-semibold whitespace-nowrap ${
            t.value === value ? "border-(--d-accent) text-(--d-text)" : "border-transparent text-(--d-muted) hover:text-(--d-text)"
          }`}
        >
          {t.label}
          {t.count != null ? <span className="rounded-full bg-(--d-panel2) px-2 text-[12px] text-(--d-muted)">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** "Concept" / sample-data badge, used sparingly. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[12.5px] text-(--d-muted)">{children}</p>;
}
