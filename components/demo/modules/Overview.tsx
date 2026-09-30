"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { addDays, diffDays } from "@/lib/demo/dates";
import { kpiRows, lastWeekend, monthToDate, onTrack, overdueMaintenance, staleAccounts } from "@/lib/demo/derive";
import { dayDate, moneyK, monthLabel, shortDate, signedPct } from "@/lib/demo/format";
import type { IconName } from "@/demos/types";
import { useDemo } from "../DemoProvider";
import { Paw, PreparedBy } from "../Brand";
import Icon from "../Icon";
import { Card, Pill } from "../ui";

export default function Overview() {
  const { cfg, ds, base, anchor, maintenance, visits, kpiEdits, projectItems } = useDemo();
  const mtd = monthToDate(ds);
  const lw = lastWeekend(ds);
  const rows = kpiRows(ds, cfg);
  const last = (r: (typeof rows)[number]) => kpiEdits[`${r.def.key}:12`] ?? r.weekly[12];
  const green = rows.filter((r) => onTrack(r, last(r))).length;
  const reds = rows.filter((r) => !onTrack(r, last(r)));
  const active = ds.accounts.filter((a) => a.status === "Active").length;
  const atRisk = ds.accounts.filter((a) => a.status === "At risk").length;
  const open = maintenance.filter((m) => m.status !== "Done");
  const overdue = overdueMaintenance(maintenance, anchor);
  const stale = staleAccounts(ds, visits);
  const soon = projectItems.filter((it) => it.status !== "Done" && it.due >= anchor && it.due <= addDays(anchor, 14));
  const stuck = projectItems.filter((it) => it.status === "Stuck").length;
  const link = (key: string) => `${base}/${cfg.modules.find((m) => m.key === key)!.path}`;

  const cards: Array<{ key: string; icon: IconName; label: string; value: string; sub: ReactNode }> = [
    { key: "crm", icon: "users", label: "CRM", value: `${active}`, sub: <>active accounts · <span className="text-(--d-warn)">{atRisk} at risk</span></> },
    { key: "kpis", icon: "gauge", label: "Scorecard", value: `${green}/${rows.length}`, sub: "KPIs on track last week" },
    { key: "sales", icon: "chart", label: "Sales", value: moneyK(mtd.total), sub: <>{monthLabel(mtd.month)} to date · <span className={mtd.change >= 0 ? "text-(--d-good)" : "text-(--d-bad)"}>{signedPct(mtd.change)}</span></> },
    { key: "ranch", icon: "ranch", label: "Ranch", value: lw ? moneyK(lw.total) : "—", sub: lw ? <>last weekend · {lw.act}</> : "no weekends yet" },
    { key: "maintenance", icon: "wrench", label: "Maintenance", value: `${open.length}`, sub: <>open items · <span className={overdue.length ? "text-(--d-bad)" : ""}>{overdue.length} overdue</span></> },
    { key: "projects", icon: "board", label: "Projects", value: `${soon.length}`, sub: <>due in the next 2 weeks · {stuck} stuck</> },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <section className="demo-card relative overflow-hidden p-5 sm:p-7">
        <Paw size={220} className="pointer-events-none absolute -right-10 -bottom-16 z-0 text-(--d-panel2)" />
        <p className="relative z-10 text-[13px] uppercase tracking-[0.12em] text-(--d-accent)">{dayDate(anchor)} · {cfg.company.place}</p>
        <h1 className="demo-display relative z-10 mt-2 text-[34px] sm:text-[44px]">Welcome to {cfg.company.appName}</h1>
        <p className="relative z-10 mt-2 max-w-[56ch] text-[16px] text-(--d-muted)">{cfg.copy.banner}</p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {/* Module cards */}
        <ul className="grid content-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {cards.map((c) => (
            <li key={c.key}>
              <Link href={link(c.key)} className="demo-card group flex h-full min-h-[132px] flex-col p-4 transition-colors hover:border-(--d-accent)">
                <span className="flex items-center gap-2 text-[13.5px] font-medium text-(--d-muted) group-hover:text-(--d-text)">
                  <Icon name={c.icon} size={18} className="text-(--d-accent)" />
                  {c.label}
                  <Icon name="arrow" size={16} className="ml-auto opacity-60 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="demo-display mt-3 text-[38px]">{c.value}</span>
                <span className="mt-1 text-[13.5px] text-(--d-muted)">{c.sub}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Needs attention */}
        <Card title="Needs attention" action={<Pill tone={overdue.length + reds.length ? "bad" : "good"}>{overdue.length + stale.length + reds.length} items</Pill>}>
          <div className="space-y-5">
            <Group title="Overdue maintenance" count={overdue.length} href={link("maintenance")}>
              {overdue.slice(0, 3).map((m) => (
                <Row key={m.id} href={link("maintenance")} title={m.title} meta={`${m.location} · due ${shortDate(m.dueOn)} (${diffDays(anchor, m.dueOn)}d late)`} tone="bad" />
              ))}
            </Group>
            <Group title="Accounts not visited in 60+ days" count={stale.length} href={link("crm")}>
              {stale.slice(0, 4).map((s) => (
                <Row key={s.account.id} href={link("crm")} title={s.account.name} meta={`${s.account.city}, ${s.account.state} · ${s.lastVisit ? `${diffDays(anchor, s.lastVisit)} days` : "never visited"}`} tone="warn" />
              ))}
            </Group>
            <Group title="KPIs off track last week" count={reds.length} href={link("kpis")}>
              {reds.map((r) => (
                <Row key={r.def.key} href={link("kpis")} title={r.def.name} meta={`${fmtKpi(r.def.unit, last(r))} vs goal ${r.def.direction === "atMost" ? "≤" : "≥"} ${fmtKpi(r.def.unit, r.goal)}`} tone="bad" />
              ))}
            </Group>
          </div>
        </Card>
      </div>

      {/* Closing card, in Paul's voice */}
      <section className="demo-card grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="demo-display demo-rule text-[24px] sm:text-[28px]">{cfg.copy.closing.title}</h2>
          {cfg.copy.closing.paragraphs.map((p) => (
            <p key={p} className="mt-3 max-w-[64ch] text-[15.5px] text-(--d-muted)">{p}</p>
          ))}
          <p className="mt-3 text-[15.5px]">— Paul Heintzman, Rose Revenue</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-(--d-accent) px-5 font-medium text-(--d-on-accent) hover:brightness-105">
            Book a free 15-minute call <Icon name="arrow" size={18} />
            <span className="sr-only"> (opens Cal.com in a new tab)</span>
          </a>
          <PreparedBy />
        </div>
      </section>
    </div>
  );
}

export function fmtKpi(unit: "count" | "money" | "cases", v: number) {
  return unit === "money" ? moneyK(v) : unit === "cases" ? `${Math.round(v)} cs` : `${Math.round(v)}`;
}

function Group({ title, count, href, children }: { title: string; count: number; href: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-medium">{title} <span className="text-(--d-muted)">({count})</span></h3>
        <Link href={href} className="inline-flex min-h-9 items-center text-[13px] text-(--d-accent) hover:underline">View</Link>
      </div>
      {count ? <ul className="space-y-1.5">{children}</ul> : <p className="text-[13.5px] text-(--d-muted)">All clear.</p>}
    </div>
  );
}

function Row({ href, title, meta, tone }: { href: string; title: string; meta: string; tone: "bad" | "warn" }) {
  return (
    <li>
      <Link href={href} className="flex min-h-11 items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-(--d-panel2)">
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${tone === "bad" ? "bg-(--d-bad)" : "bg-(--d-warn)"}`} aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-[14px]">{title}</span>
          <span className="block text-[12.5px] text-(--d-muted)">{meta}</span>
        </span>
      </Link>
    </li>
  );
}
