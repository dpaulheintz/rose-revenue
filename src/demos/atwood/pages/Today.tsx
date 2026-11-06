"use client";

import { useRouter } from "next/navigation";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { dayDate } from "@demos/kit/data/format";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { jobType } from "@demos/atwood/data";
import { shortDay, today as todayStats } from "@demos/atwood/derive";
import { Card, Chip, H, money, More, Stars, Tile, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

export default function Today() {
  const { base } = useDemo();
  const router = useRouter();
  const { d, w, customer, open, notify } = useAt();
  const go = (p: string) => router.push(`${base}/${p}`);
  const t = todayStats(d, w);
  const unpaidTotal = t.unpaid.reduce((s, j) => s + j.invoice!.amount, 0);
  const avg = t.reviews.length ? t.reviews.reduce((s, j) => s + j.review!.rating!, 0) / t.reviews.length : 0;

  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. ${t.route.length ? `${t.route.length} stops today.` : "No stops today."}`}>Morning</Title>

      <section>
        <H action={<More onClick={() => go("jobs")}>All jobs</More>}>Today&apos;s route</H>
        <ol className="space-y-2.5">
          {t.route.map((j, i) => {
            const c = customer(j.customer);
            return (
              <li key={j.id} className="flex gap-3">
                <span className="flex w-9 shrink-0 flex-col items-center pt-3">
                  <span className={`grid size-9 place-items-center rounded-full text-[16px] font-extrabold ${j.done ? "bg-(--d-good) text-white" : "bg-(--d-accent) text-white"}`}>{j.done ? <Icon name="check" size={18} /> : i + 1}</span>
                  {i < t.route.length - 1 ? <span className="mt-1 w-0.5 flex-1 bg-(--d-line)" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <div className="rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4">
                    <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="block min-h-12 w-full text-left">
                      <span className="flex items-start justify-between gap-3"><span className="text-[17px] leading-snug font-bold">{j.time}, {c.name}</span>{j.done ? <Chip tone="good">Done</Chip> : null}</span>
                      <span className="mt-0.5 block text-[15px] leading-snug text-(--d-muted)">{c.street}, {c.town}<br />{jobType(j.type).label}, {money(j.price)}</span>
                    </button>
                    {!j.done ? (
                      <span className="mt-2.5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => notify(`"On my way" texted to ${c.contact.split(" ")[0]} (demo).`)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-(--d-accent) px-4 text-[15px] font-bold text-white"><Icon name="truck" size={18} />On my way</button>
                        <button type="button" onClick={() => notify(`Opening directions to ${c.street} (demo).`)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-(--d-line) px-4 text-[15px] font-bold"><Icon name="pin" size={18} />Directions</button>
                      </span>
                    ) : null}
                  </div>
                </span>
              </li>
            );
          })}
          {!t.route.length ? <li className="rounded-[14px] border border-dashed border-(--d-line) p-5 text-center text-(--d-muted)">Nothing on the route today.{t.next ? ` Next up: ${shortDay(t.next.date)}.` : ""}</li> : null}
        </ol>
      </section>

      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-3">
        <Tile label="Collected this week" value={money(t.collected)} tone="good" onClick={() => go("money")} />
        <Tile label="Unpaid invoices" value={t.unpaid.length} sub={`${money(unpaidTotal)} out`} tone={t.unpaid.length ? "warn" : undefined} onClick={() => go("billing")} />
        <Tile label="Estimates waiting" value={t.waiting.length} sub="Sent, no answer yet" onClick={() => go("billing")} />
        <Tile label="Parts running low" value={t.low.length} tone={t.low.length ? "bad" : "good"} sub={t.low.slice(0, 1).map((p) => p.name.split(",")[0]).join("") || "Truck is stocked"} onClick={() => go("truck-stock")} />
        <Tile label="Reviews this month" value={t.reviews.length} sub={t.reviews.length ? <span className="inline-flex items-center gap-1.5"><Stars n={Math.round(avg)} size={13} />{avg.toFixed(1)} average</span> : "None yet"} onClick={() => go("reviews")} />
        <Tile label="Due for a tune-up" value="See list" sub="Past customers, 12+ months" onClick={() => go("tune-ups")} />
      </div>

      {t.waiting.length ? (
        <section>
          <H action={<More onClick={() => go("billing")}>Billing</More>}>Waiting on an answer</H>
          <ul className="space-y-2.5">
            {t.waiting.slice(0, 3).map((e) => <li key={e.id}><Card title={customer(e.customer).name} meta={`${e.title}. Sent ${shortDay(e.date)}`} right={<Chip tone={e.status === "Viewed" ? "info" : "neutral"}>{e.status}</Chip>} onClick={() => open({ kind: "estimate", id: e.id })} /></li>)}
          </ul>
        </section>
      ) : null}

      <section className="rounded-[16px] bg-(--d-header) p-5 text-(--d-on-header)">
        <p className="demo-display text-[22px] leading-tight">Your office, in the truck.</p>
        <p className="mt-2 text-[16px] opacity-90">Rose Revenue builds it around how you already work. You own it, with nothing to rent.</p>
        <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-[16px] font-bold text-(--d-header)"><Icon name="calendar" size={18} />Book a free 15-min call<span className="sr-only"> (opens Cal.com in a new tab)</span></a>
      </section>
    </div>
  );
}
