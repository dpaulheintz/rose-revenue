"use client";

import { addDays, diffDays } from "@/lib/demo/dates";
import { dayDate, shortDate } from "@/lib/demo/format";
import { fmtDays, sum } from "@/lib/demo/shop/derive";
import Icon from "../../Icon";
import { Button, Card, PageHeader, Pill, Stat } from "../../ui";
import { usd } from "../bits";
import { useShop } from "../ShopProvider";

export default function Warranty() {
  const { book, job, customer, worker, open, reviews, requestReview } = useShop();
  const t = book.anchor;
  const openCbs = book.callbacks.filter((c) => c.status !== "Resolved");
  const resolved = book.callbacks.filter((c) => c.status === "Resolved").sort((a, b) => (a.opened < b.opened ? 1 : -1));
  const finished = book.jobs.filter((j) => (j.status === "Complete" || j.status === "Paid") && j.end >= addDays(t, -30)).sort((a, b) => (a.end < b.end ? 1 : -1));
  const doneYear = book.jobs.filter((j) => j.end >= book.windowStart && j.end < t).length;
  return (
    <div className="space-y-5">
      <PageHeader title="Warranty & service" meta="Callbacks tied to the original job, and a nudge for a review once a job closes." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Open callbacks" value={String(openCbs.length)} sub={openCbs.length ? `Oldest ${fmtDays(diffDays(openCbs.reduce((m, c) => (c.opened < m ? c.opened : m), t), t))}` : "All clear"} tone={openCbs.length ? "warn" : "good"} />
        <Stat label="Callbacks per 100 jobs" value={((book.callbacks.length / Math.max(1, doneYear)) * 100).toFixed(1)} sub="Last 12 months" />
        <Stat label="Warranty cost" value={usd(sum(resolved, (c) => c.cost))} sub={`${resolved.length} resolved`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Callbacks">
          <ul className="space-y-2 text-[14px]">
            {[...openCbs, ...resolved.slice(0, 8)].map((c) => {
              const j = job(c.job);
              return (
                <li key={c.id} className={`rounded-[12px] border p-3.5 ${c.status === "Resolved" ? "border-(--d-line)" : "border-(--d-warn)/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0"><span className="block font-semibold">{c.issue}</span><span className="block truncate text-[12.5px] text-(--d-muted)">{customer(c.customer).name} · opened {shortDate(c.opened)}</span></span>
                    <Pill tone={c.status === "Resolved" ? "good" : c.status === "Scheduled" ? "info" : "warn"}>{c.status}</Pill>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[13px] text-(--d-muted)">
                    <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">Original job: {j.no} {j.title} ({shortDate(j.end)})</button>
                    <span>{c.visit ? `${c.status === "Resolved" ? "Fixed" : "Visit"} ${dayDate(c.visit)} · ${worker(c.tech).name.split(" ")[0]}` : "Needs a visit"}{c.cost ? ` · ${usd(c.cost)}` : ""}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Ask for a review">
          <p className="mb-2 text-[13.5px] text-(--d-muted)">Jobs finished in the last 30 days. One tap texts the customer a review link.</p>
          <ul className="divide-y divide-(--d-line) text-[14px]">
            {finished.slice(0, 14).map((j) => (
              <li key={j.id} className="flex min-h-14 items-center justify-between gap-3 py-2">
                <span className="min-w-0"><span className="block truncate font-semibold">{customer(j.customer).name}</span><span className="block truncate text-[12.5px] text-(--d-muted)">{j.title} · finished {shortDate(j.end)}</span></span>
                {reviews.has(j.id) ? <Pill tone="good"><Icon name="check" size={14} />Requested</Pill> : <Button onClick={() => requestReview(j.id)}>Request a review</Button>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
