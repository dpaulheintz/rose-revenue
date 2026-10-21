// Today's computed to-do list and the day plan behind the dispatch board.

import { addDays, diffDays, weekday, type Ymd } from "../dates";
import { estimateTotal, fmtDays, jobFinance, type Book, type InvoiceRow } from "./derive";
import type { CrewId, Job, ShopSeed } from "./types";

export type Attention = { id: string; tone: "bad" | "warn" | "info"; text: string; detail: string; go: { kind: "invoice" | "job" | "estimate" | "module"; id: string }; rank: number };

const nextWork = (d: Ymd) => { while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1); return d; };
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function needsAttention(b: Book, seed: ShopSeed, rows: InvoiceRow[], name: (customer: string) => string): Attention[] {
  const out: Attention[] = [];
  const t = b.anchor;
  // Overdue money, one line per customer (biggest first).
  const byCust = new Map<string, InvoiceRow[]>();
  for (const r of rows.filter((x) => x.status === "Overdue")) (byCust.get(r.customer) ?? byCust.set(r.customer, []).get(r.customer)!).push(r);
  for (const [cust, rs] of [...byCust].sort((a, c) => c[1].reduce((s, r) => s + r.balance, 0) - a[1].reduce((s, r) => s + r.balance, 0)).slice(0, 4)) {
    const oldest = rs.reduce((m, r) => (r.late > m.late ? r : m));
    out.push({ id: `od-${cust}`, tone: "bad", rank: 90 + Math.min(9, oldest.late / 10), text: `${name(cust)} owes ${usd(rs.reduce((s, r) => s + r.balance, 0))}`, detail: rs.length > 1 ? `${rs.length} invoices · oldest ${oldest.late} days past due` : `${oldest.no} · ${oldest.late} days past due`, go: { kind: "invoice", id: oldest.id } });
  }
  const drafts = rows.filter((x) => x.status === "Draft");
  for (const r of drafts) out.push({ id: `dr-${r.id}`, tone: "warn", rank: 75, text: `Invoice ${r.no} hasn't been sent`, detail: `${usd(r.amount)} to ${name(r.customer)}, finished ${fmtDays(diffDays(r.issued, t))}`, go: { kind: "invoice", id: r.id } });
  for (const e of b.estimates.filter((x) => (x.status === "Sent" || x.status === "Viewed") && x.sent && diffDays(t, x.sent) > 3)) {
    out.push({ id: `es-${e.id}`, tone: "warn", rank: 60 + Math.min(10, diffDays(t, e.sent!)), text: `Estimate ${e.no} waiting ${diffDays(t, e.sent!)} days`, detail: `${name(e.customer)} · ${usd(estimateTotal(e, seed.taxRate))}${e.status === "Viewed" ? " · they opened it" : ""}`, go: { kind: "estimate", id: e.id } });
  }
  const tomorrow = nextWork(addDays(t, 1));
  for (const p of b.permits) for (const i of p.inspections) if (i.result === "Scheduled" && i.date === tomorrow) {
    const j = b.jobs.find((x) => x.id === p.job)!;
    out.push({ id: `in-${p.id}-${i.kind}`, tone: "info", rank: 80, text: `${i.kind} inspection ${fmtDays(diffDays(i.date, t))}`, detail: `${j.no} ${j.title} · ${p.town} · ${p.kind} permit`, go: { kind: "job", id: j.id } });
  }
  for (const c of b.changeOrders.filter((x) => x.status === "Awaiting signature")) {
    const j = b.jobs.find((x) => x.id === c.job)!;
    out.push({ id: `co-${c.id}`, tone: "warn", rank: 70, text: `Change order ${c.no} needs a signature`, detail: `${usd(c.amount)} · ${c.title} · ${name(j.customer)}`, go: { kind: "module", id: "change-orders" } });
  }
  for (const j of b.jobs.filter((x) => x.status === "In progress")) {
    const f = jobFinance(b, seed, j, rows);
    if (f.over) out.push({ id: `ob-${j.id}`, tone: "bad", rank: 72, text: `${j.no} ${j.title} is running over`, detail: `${usd(f.actual.total)} spent vs. ${usd(f.expected)} expected at ${Math.round(f.progress * 100)}%`, go: { kind: "job", id: j.id } });
  }
  for (const c of b.callbacks.filter((x) => x.status === "Open")) {
    out.push({ id: `cb-${c.id}`, tone: "info", rank: 55, text: `Warranty callback: ${c.issue.toLowerCase()}`, detail: `${name(c.customer)} · opened ${fmtDays(diffDays(c.opened, t))}`, go: { kind: "module", id: "warranty" } });
  }
  const due = b.leads.filter((l) => (l.stage === "New" || l.stage === "Contacted") && l.followUp && l.followUp <= t);
  if (due.length) out.push({ id: "leads", tone: "info", rank: 50, text: `${due.length} new lead${due.length === 1 ? "" : "s"} to call back today`, detail: due.slice(0, 3).map((l) => l.name).join(", "), go: { kind: "module", id: "customers" } });
  return out.sort((a, c) => c.rank - a.rank);
}

export type Visit = { job: Job; crew: CrewId; start: number; hours: number }; // start = minutes after midnight

/** Who's where on a day: blocks for the dispatch board. */
export function dayPlan(b: Book, seed: ShopSeed, day: Ymd): Visit[] {
  const entries = day < b.anchor ? b.time : b.schedule;
  const out: Visit[] = [];
  for (const crew of seed.crews) {
    const size = seed.workers.filter((w) => w.crew === crew.id).length;
    const jobs = b.jobs.filter((j) => j.crew === crew.id && j.days.includes(day));
    let clock = crew.id === "remodel" ? 7.5 * 60 : 8 * 60;
    for (const j of jobs.sort((a, c) => (a.start < c.start ? -1 : 1))) {
      const h = entries.filter((e) => e.job === j.id && e.date === day).reduce((s, e) => s + e.hours, 0);
      // Crew-hours → wall-clock hours on site (the crew splits up across jobs).
      const onSite = Math.max(1, Math.min(9, crew.id === "service" ? h || 2 : (h || size * 6) / Math.max(1, Math.min(size, Math.ceil((h || 8) / 8)))));
      out.push({ job: j, crew: crew.id, start: crew.id === "service" ? clock : crew.id === "remodel" ? 7.5 * 60 : 8 * 60, hours: Math.round(onSite * 2) / 2 });
      if (crew.id === "service") clock += onSite * 60 + 30; // drive between calls
    }
  }
  return out;
}

export const hhmm = (min: number) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "a" : "p"}`; };
