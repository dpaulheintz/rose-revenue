import type { ReactNode } from "react";
import { usd } from "@demos/kit/data/format";

export type DocParty = { label: string; lines: Array<{ text: ReactNode; tone?: "strong" | "plain" | "muted" }> };
export type DocLine = { desc: ReactNode; sub?: ReactNode; amount: number };
export type DocTotal = { label: ReactNode; amount: number; kind: "total" | "less" | "due" };

const LINE_TONE = { strong: "font-semibold", plain: undefined, muted: "text-[#545b63]" } as const;

/**
 * A customer-facing document (invoice, estimate, receipt, work order) that
 * always renders as white paper, whatever the app theme, and prints alone
 * (see .demo-print in kit.css).
 */
export function DocumentPaper({
  ariaLabel, accent, accentText, logo, company, tagline, contact, title, number, meta, parties, columns = ["Description", "Amount"], lines, totals, footer, money = (n) => usd(n, true),
}: {
  ariaLabel: string;
  accent: string; // rule under the header
  accentText: string; // tagline color (needs 4.5:1 on white)
  logo?: { src: string; alt: string };
  company: string;
  tagline?: string;
  contact?: string;
  title: string; // "Invoice"
  number: string;
  meta: string[]; // dates, terms
  parties: DocParty[];
  columns?: [string, string];
  lines: DocLine[];
  totals: DocTotal[];
  footer?: ReactNode;
  money?: (n: number) => string;
}) {
  return (
    <article className="demo-print rounded-[10px] bg-white p-5 text-[13.5px] text-[#14171b] shadow-sm sm:p-7" aria-label={ariaLabel}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 pb-4" style={{ borderColor: accent }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo.src} alt={logo.alt} width={56} height={56} className="rounded-full" /> : null}
          <div>
            <p className="demo-display text-[19px] leading-none tracking-tight uppercase">{company}</p>
            {tagline ? <p className="mt-1 text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: accentText }}>{tagline}</p> : null}
            {contact ? <p className="mt-1 text-[12px] text-[#545b63]">{contact}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <p className="demo-display text-[26px] leading-none">{title}</p>
          <p className="mt-1 font-semibold">{number}</p>
          {meta.map((m) => <p key={m} className="text-[12.5px] text-[#545b63]">{m}</p>)}
        </div>
      </header>
      <div className="grid gap-4 py-4 sm:grid-cols-2">
        {parties.map((p) => (
          <div key={p.label}>
            <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">{p.label}</p>
            {p.lines.map((l, i) => <p key={i} className={LINE_TONE[l.tone ?? "plain"]}>{l.text}</p>)}
          </div>
        ))}
      </div>
      <table className="w-full text-left">
        <thead className="text-[11px] tracking-[0.1em] text-[#545b63] uppercase">
          <tr className="border-y border-[#d6dade]"><th className="py-2 font-bold">{columns[0]}</th><th className="py-2 text-right font-bold">{columns[1]}</th></tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-[#eaecee] align-top">
              <td className="py-2 pr-3"><span className="font-semibold">{l.desc}</span>{l.sub ? <span className="block text-[12px] text-[#545b63]">{l.sub}</span> : null}</td>
              <td className={`py-2 text-right tabular-nums ${l.amount < 0 ? "text-[#545b63]" : ""}`}>{l.amount < 0 ? `−${money(-l.amount)}` : money(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 ml-auto w-full max-w-[280px] space-y-1 text-right tabular-nums">
        {totals.map((t, i) => (
          <div key={i} className={t.kind === "total" ? "flex justify-between gap-4 text-[15px] font-bold" : t.kind === "less" ? "flex justify-between gap-4 text-[12.5px] text-[#545b63]" : "flex justify-between gap-4 border-t-2 border-[#14171b] pt-1 text-[16px] font-bold"}>
            <dt>{t.label}</dt><dd>{t.kind === "less" ? `−${money(t.amount)}` : money(t.amount)}</dd>
          </div>
        ))}
      </dl>
      {footer ? <footer className="mt-5 border-t border-[#eaecee] pt-3 text-[12px] text-[#545b63]">{footer}</footer> : null}
    </article>
  );
}
