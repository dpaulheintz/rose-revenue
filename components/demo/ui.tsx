import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hash } from "@/lib/demo/rng";
import { initials } from "@/lib/demo/format";

export type Tone = "good" | "bad" | "warn" | "neutral" | "accent" | "info";

const TONE: Record<Tone, string> = {
  good: "bg-[color-mix(in_oklab,var(--d-good)_18%,transparent)] text-(--d-good)",
  bad: "bg-[color-mix(in_oklab,var(--d-bad)_18%,transparent)] text-(--d-bad)",
  warn: "bg-[color-mix(in_oklab,var(--d-warn)_18%,transparent)] text-(--d-warn)",
  accent: "bg-[color-mix(in_oklab,var(--d-accent)_20%,transparent)] text-(--d-accent)",
  info: "bg-[color-mix(in_oklab,var(--d-info)_16%,transparent)] text-(--d-info)",
  neutral: "bg-(--d-panel2) text-(--d-muted)",
};

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ${TONE[tone]} ${className}`}>
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
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <h2 className="demo-display demo-rule text-[17px] text-(--d-text)">{title}</h2>
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
      <p className="text-[12.5px] uppercase tracking-[0.08em] text-(--d-muted)">{label}</p>
      <p className="demo-display mt-2 text-[30px] text-(--d-text)">{value}</p>
      {sub ? <p className={`mt-1.5 text-[13px] ${tone ? TONE[tone].split(" ").at(-1) : "text-(--d-muted)"}`}>{sub}</p> : null}
    </div>
  );
}

export function PageHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div>
        <h1 className="demo-display demo-rule text-[30px] sm:text-[36px]">{title}</h1>
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
    secondary: "border border-(--d-line) bg-(--d-panel2) text-(--d-text) hover:border-(--d-muted)",
    ghost: "text-(--d-muted) hover:text-(--d-text) hover:bg-(--d-panel2)",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] font-medium transition-[filter,border-color,background-color] disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: Array<{ value: T; label: ReactNode }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-(--d-line) bg-(--d-bg) p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] font-medium ${
            o.value === value ? "bg-(--d-panel2) text-(--d-text) shadow-sm" : "text-(--d-muted) hover:text-(--d-text)"
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
      <span className="text-[12.5px] uppercase tracking-[0.08em] text-(--d-muted)">{label}</span>
      {children}
    </label>
  );
}
