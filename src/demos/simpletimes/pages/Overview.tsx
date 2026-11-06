"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { dayDate } from "@demos/kit/data/format";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { SplitBar } from "@demos/kit/ui/charts";
import Icon from "@demos/kit/ui/Icon";
import { accountStats, company, shortDay } from "@demos/simpletimes/derive";
import { H, money, moneyK, NUM, Tile, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function Overview() {
  const { base } = useDemo();
  const router = useRouter();
  const { d, w } = useSt();
  const go = (p: string) => router.push(`${base}/${p}`);
  const co = company(d, w);
  const late = w.accounts.filter((a) => accountStats(d, w, a).overdue);
  const sent = co.cp.openQuotes.filter((q) => q.status === "Sent");
  const needs = [
    ...co.cp.short.map((s) => ({ key: s.item.id, tone: "bad", text: `${s.item.name} runs short before ${s.run.id} on ${shortDay(s.run.date)}`, path: "inventory", lane: "Co-Packing" })),
    ...co.cp.holds.map((r) => ({ key: r.id, tone: "bad", text: `${r.id} (${r.product}) is on QA hold`, path: "runs", lane: "Co-Packing" })),
    ...(late.length ? [{ key: "late", tone: "warn", text: `${late.length} accounts are past their usual reorder date`, path: "accounts", lane: "Brands" }] : []),
    ...(sent.length ? [{ key: "quotes", tone: "warn", text: `${sent.length} co-pack quotes waiting on a yes`, path: "quotes", lane: "Co-Packing" }] : []),
    ...co.tastingsWeek.filter((t) => t.date >= d.today).slice(0, 1).map((t) => ({ key: t.id, tone: "warn", text: `Tasting ${t.date === d.today ? "today" : shortDay(t.date)} at ${w.accounts.find((a) => a.id === t.account)!.name}`, path: "tastings", lane: "Brands" })),
  ];
  const total = co.brands + co.copack;

  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. Both lanes at a glance.`}>Simple Times</Title>

      <section className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4">
        <p className="text-[14px] text-(--d-muted)">Revenue this month, so far</p>
        <p className={`${NUM} text-[44px] leading-none`}>{money(total)}</p>
        <div className="mt-4"><SplitBar format={moneyK} parts={[{ label: "Brands", value: co.brands, color: "#c2403f" }, { label: "Co-Packing", value: co.copack, color: "#2671a4" }]} /></div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label="Open orders" value={co.openOrders.length} sub={`${moneyK(co.openOrders.reduce((s, o) => s + o.total, 0))} to deliver`} onClick={() => go("accounts")} />
        <Tile label="Runs this week" value={co.runsWeek.length} sub={`${co.cp.holds.length} on QA hold`} tone={co.cp.holds.length ? "bad" : undefined} onClick={() => go("runs")} />
        <Tile label="Tastings this week" value={co.tastingsWeek.length} onClick={() => go("tastings")} />
        <Tile label="Accounts ordering" value={new Set(w.orders.filter((o) => o.date >= `${d.today.slice(0, 7)}-01`).map((o) => o.account)).size} sub="This month" />
      </div>

      <section>
        <H>Needs attention</H>
        <ul className="space-y-2.5">
          {needs.map((n) => (
            <li key={n.key}>
              <Link href={`${base}/${n.path}`} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) px-4 py-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${n.tone === "bad" ? "bg-[color-mix(in_oklab,var(--d-bad)_12%,white)] text-(--d-bad)" : "bg-[color-mix(in_oklab,#cecb00_40%,white)] text-[#5a4a00]"}`}><Icon name="alert" size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[16px] leading-snug font-semibold">{n.text}</span><span className="block text-[13.5px] text-(--d-muted)">{n.lane}</span></span>
                <Icon name="arrow" size={18} className="text-(--d-muted)" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[12px] bg-(--d-header) p-5 text-(--d-on-header)">
        <p className="demo-display text-[28px] leading-tight">Built around your two lanes.</p>
        <p className="mt-2 text-[16px] opacity-90">Rose Revenue builds it for how Simple Times works. You own the code and the data, with nothing to rent.</p>
        <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#da5856] px-5 text-[16px] font-semibold text-[#231f20]"><Icon name="calendar" size={18} />Book a free 15-min call<span className="sr-only"> (opens Cal.com in a new tab)</span></a>
      </section>
    </div>
  );
}
