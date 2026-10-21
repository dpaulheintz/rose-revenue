"use client";

import { useState } from "react";
import { addDays, diffDays } from "@/lib/demo/dates";
import { dayDate, shortDate } from "@/lib/demo/format";
import { fmtDays } from "@/lib/demo/shop/derive";
import type { Permit } from "@/lib/demo/shop/types";
import { Card, FilterChip, PageHeader, Pill, Stat } from "../../ui";
import { useShop } from "../ShopProvider";

const statusOf = (p: Permit, today: string) => {
  const last = p.inspections.at(-1);
  if (p.inspections.some((i) => i.result === "Failed") && last?.result !== "Passed") return "Re-inspection";
  if (last && last.kind.startsWith("Final") && last.result === "Passed") return "Closed";
  if (p.inspections.some((i) => i.result === "Scheduled")) return "Inspection booked";
  return p.issued ? (p.issued <= today ? "Issued" : "Applied") : "Applied";
};

export default function Permits() {
  const { book, seed, job, open } = useShop();
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");
  const t = book.anchor;
  const upcoming = book.permits.flatMap((p) => p.inspections.filter((i) => i.result === "Scheduled" && i.date <= addDays(t, 21)).map((i) => ({ p, i }))).sort((a, b) => (a.i.date < b.i.date ? -1 : 1));
  const results = book.permits.flatMap((p) => p.inspections.filter((i) => i.result !== "Scheduled" && i.date >= addDays(t, -60)).map((i) => ({ p, i }))).sort((a, b) => (a.i.date < b.i.date ? 1 : -1));
  const inspector = (id: string) => seed.inspectors.find((x) => x.id === id)!;
  const list = book.permits
    .filter((p) => { const s = statusOf(p, t); return filter === "all" || (filter === "closed" ? s === "Closed" : s !== "Closed"); })
    .sort((a, b) => (a.applied < b.applied ? 1 : -1))
    .slice(0, 40);
  const passed = results.filter((x) => x.i.result === "Passed").length;
  return (
    <div className="space-y-5">
      <PageHeader title="Permits & inspections" meta="Building, plumbing, mechanical and electrical permits by town, with every inspection on the calendar." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Open permits" value={String(book.permits.filter((p) => statusOf(p, t) !== "Closed").length)} sub={`${book.permits.length} pulled in the last year`} />
        <Stat label="Inspections, next 3 weeks" value={String(upcoming.length)} sub={upcoming[0] ? `Next: ${dayDate(upcoming[0].i.date)}` : "None booked"} />
        <Stat label="First-time pass rate" value={`${Math.round((passed / Math.max(1, results.length)) * 100)}%`} sub="Last 60 days" tone="good" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Upcoming inspections">
          <ul className="divide-y divide-(--d-line) text-[14px]">
            {upcoming.map(({ p, i }) => (
              <li key={`${p.id}-${i.kind}`}>
                <button type="button" onClick={() => open({ kind: "job", id: p.job })} className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left">
                  <span className="min-w-0"><span className="block font-semibold">{i.kind} · {p.kind}</span><span className="block truncate text-[12.5px] text-(--d-muted)">{job(p.job).no} {job(p.job).title} · {p.town} · {inspector(i.inspector).name}</span></span>
                  <Pill tone={diffDays(i.date, t) <= 1 ? "warn" : "info"}>{diffDays(i.date, t) <= 1 ? fmtDays(diffDays(i.date, t)) : shortDate(i.date)}</Pill>
                </button>
              </li>
            ))}
            {!upcoming.length ? <li className="py-2 text-(--d-muted)">Nothing booked in the next three weeks.</li> : null}
          </ul>
        </Card>
        <Card title="Recent results">
          <ul className="divide-y divide-(--d-line) text-[14px]">
            {results.slice(0, 8).map(({ p, i }) => (
              <li key={`${p.id}-${i.kind}-${i.date}`} className="py-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><span className="block font-semibold">{i.kind} · {job(p.job).title}</span><span className="block text-[12.5px] text-(--d-muted)">{shortDate(i.date)} · {inspector(i.inspector).name} · {p.town}</span></span>
                  <Pill tone={i.result === "Passed" ? "good" : "bad"}>{i.result}</Pill>
                </div>
                {i.note ? <p className="mt-1 text-[13px] text-(--d-bad)">{i.note}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip on={filter === "open"} onClick={() => setFilter("open")}>Open</FilterChip>
        <FilterChip on={filter === "closed"} onClick={() => setFilter("closed")}>Closed</FilterChip>
        <FilterChip on={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
      </div>
      <div className="demo-card demo-scroll-x">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="text-[12.5px] text-(--d-muted)"><tr className="border-b border-(--d-line)"><th className="px-4 py-3 font-semibold">Permit</th><th className="px-3 py-3 font-semibold">Job</th><th className="px-3 py-3 font-semibold">Town</th><th className="px-3 py-3 font-semibold">Applied</th><th className="px-3 py-3 font-semibold">Issued</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
          <tbody>
            {list.map((p) => {
              const s = statusOf(p, t);
              return (
                <tr key={p.id} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2"><span className="font-semibold">{p.no}</span><span className="block text-[12.5px] text-(--d-muted)">{p.kind}</span></td>
                  <td className="px-3 py-2"><button type="button" onClick={() => open({ kind: "job", id: p.job })} className="min-h-11 text-left underline-offset-2 hover:underline">{job(p.job).no} · {job(p.job).title}</button></td>
                  <td className="px-3 py-2">{p.town}</td>
                  <td className="px-3 py-2">{shortDate(p.applied)}</td>
                  <td className="px-3 py-2">{p.issued ? shortDate(p.issued) : "—"}</td>
                  <td className="px-4 py-2"><Pill tone={s === "Closed" ? "good" : s === "Re-inspection" ? "bad" : s === "Inspection booked" ? "info" : "neutral"}>{s}</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
