"use client";

import { useMemo } from "react";
import { ColumnChart } from "@demos/kit/ui/charts";
import Icon from "@demos/kit/ui/Icon";
import { Button } from "@demos/kit/ui/ui";
import { jobType, REVIEW_LINK } from "@demos/atwood/data";
import { monthName, reviews, shortDay } from "@demos/atwood/derive";
import { Card, Chip, H, reviewText, Stars, Tile, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

export default function Reviews() {
  const { d, w, customer, askReview, notify } = useAt();
  const r = useMemo(() => reviews(d, w), [d, w]);
  const recent = [...r.got].sort((a, b) => (a.review!.on! < b.review!.on! ? 1 : -1)).slice(0, 6);
  const sample = r.ready[0];
  return (
    <div className="space-y-5">
      <Title sub="Ask every paid customer, the same day, without thinking about it.">Reviews</Title>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label="Average rating" value={r.avg.toFixed(1)} sub={<Stars n={Math.round(r.avg)} size={14} />} />
        <Tile label="Reviews, 12 months" value={r.got.length} tone="good" />
        <Tile label="Asked" value={r.asked.length} sub={`${Math.round((r.got.length / Math.max(1, r.asked.length)) * 100)}% left one`} />
        <Tile label="Ready to ask" value={r.ready.length} sub="Paid in the last 3 weeks" tone={r.ready.length ? "warn" : undefined} />
      </div>

      <section className="rounded-[16px] border border-(--d-line) bg-(--d-panel) p-4">
        <H>Ready to send</H>
        {sample ? <div className="mb-3 rounded-[16px] rounded-br-[4px] bg-(--d-accent) p-4 text-[16px] text-white">{reviewText(customer(sample.customer).contact.split(" ")[0])}</div> : null}
        <ul className="divide-y divide-(--d-line)">
          {r.ready.slice(0, 6).map((j) => (
            <li key={j.id} className="flex min-h-14 items-center justify-between gap-3 py-2">
              <span className="min-w-0"><span className="block text-[16px] font-bold">{customer(j.customer).name}</span><span className="text-[14.5px] text-(--d-muted)">{jobType(j.type).label}, paid {shortDay(j.invoice!.paid!)}</span></span>
              <Button onClick={() => askReview([j.id])}>Send</Button>
            </li>
          ))}
          {!r.ready.length ? <li className="py-3 text-(--d-muted)">Everyone recent has been asked.</li> : null}
        </ul>
        {r.ready.length > 1 ? <Button variant="primary" className="mt-3 w-full" onClick={() => askReview(r.ready.map((j) => j.id))}>Send all {r.ready.length}</Button> : null}
      </section>

      <button type="button" onClick={() => notify("Review link copied (demo).")} className="flex min-h-14 w-full items-center gap-3 rounded-[14px] border-2 border-dashed border-(--d-line) bg-(--d-panel) px-4 text-left">
        <Icon name="pen" size={20} className="text-(--d-accent)" /><span className="min-w-0 flex-1"><span className="block text-[15.5px] font-bold">Your Google review link</span><span className="block truncate text-[14px] text-(--d-muted)">{REVIEW_LINK}</span></span><span className="text-[15px] font-bold text-(--d-accent)">Copy</span>
      </button>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <section className="rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4">
          <H>Reviews by month</H>
          <ColumnChart title="Reviews by month, last 6 months" height={140} format={(n) => `${n}`} series={[{ name: "Reviews", color: "#266e71" }]} columns={r.byMonth.slice(-6).map((m) => ({ label: monthName(m.month), values: [m.count], note: m.count ? `${m.avg.toFixed(1)} stars` : undefined }))} />
          <p className="mt-2 text-[14px] text-(--d-muted)">Tap a bar for the count and average rating.</p>
        </section>
        <section>
          <H>Latest reviews</H>
          <ul className="space-y-2.5">
            {recent.map((j) => <li key={j.id}><Card title={customer(j.customer).name} meta={`${jobType(j.type).label}. ${shortDay(j.review!.on!)}`} right={<Stars n={j.review!.rating!} />} /></li>)}
          </ul>
          <p className="mt-3"><Chip>Ratings come from the review site (concept)</Chip></p>
        </section>
      </div>
    </div>
  );
}
