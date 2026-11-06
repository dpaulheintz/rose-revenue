"use client";

import { useRouter } from "next/navigation";
import { dayDate } from "@demos/kit/data/format";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { lineName } from "@demos/simpletimes/data";
import { clientName, copack, ownerName, shortDay } from "@demos/simpletimes/derive";
import { Chip, H, money, moneyK, More, RowCard, RUN_TONE, Tile, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function CopackHome() {
  const { base } = useDemo();
  const router = useRouter();
  const { d, w, open } = useSt();
  const go = (p: string) => router.push(`${base}/${p}`);
  const cp = copack(d, w);
  const s = cp.short[0];

  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. Kettles, stock and quotes.`}>Co-packing</Title>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-5">
        <Tile label="Runs this week" value={cp.thisWeek.length} sub={`${cp.thisWeek.filter((r) => r.status === "Scheduled").length} still to start`} onClick={() => go("runs")} />
        <Tile label="QA holds" value={cp.holds.length} tone={cp.holds.length ? "bad" : "good"} sub={cp.holds.length ? "Need a re-test" : "All clear"} onClick={() => go("runs")} />
        <Tile label="Running short" value={cp.short.length + cp.low.length} tone={cp.short.length ? "bad" : undefined} sub={cp.short.length ? "One blocks a run" : "Below reorder point"} onClick={() => go("inventory")} />
        <Tile label="Open quotes" value={cp.openQuotes.length} onClick={() => go("quotes")} />
        <Tile label="Revenue this month" value={moneyK(cp.revenue)} sub="Invoiced client runs" />
      </div>

      {s ? (
        <button type="button" onClick={() => go("inventory")} className="block w-full rounded-[12px] border-2 border-(--d-bad) bg-(--d-panel) p-4 text-left">
          <span className="flex items-center gap-2 text-[14px] font-semibold text-(--d-bad)"><Icon name="alert" size={18} />Runs short before a scheduled run</span>
          <span className="demo-display mt-1 block text-[26px] leading-tight">{s.item.name}</span>
          <span className="mt-1 block text-[15px] text-(--d-muted)">Run {s.run.id}, {s.run.product.toLowerCase()} on {shortDay(s.run.date)}, needs {Math.round((s.before + s.short) * 10) / 10} {s.item.unit}. Only {s.before} left after the run before it. {s.po ? `${s.po.id} lands ${shortDay(s.po.eta)}, ${s.daysLate} days late.` : "Nothing on order."}</span>
          <span className="mt-2 inline-flex min-h-12 items-center gap-1 font-semibold text-(--d-accent)">Fix it in Inventory<Icon name="arrow" size={16} /></span>
        </button>
      ) : (
        <p className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4 font-semibold text-(--d-good)">Every scheduled run has what it needs.</p>
      )}

      <div className="grid gap-6 *:min-w-0 lg:grid-cols-2">
        <section>
          <H action={<More onClick={() => go("runs")}>All runs</More>}>This week</H>
          <ul className="space-y-2.5">
            {cp.thisWeek.map((r) => <li key={r.id}><RowCard title={`${r.product}`} meta={`${shortDay(r.date)}, ${lineName(r.line)}. ${ownerName(w, r.owner)}`} right={<Chip tone={RUN_TONE[r.status]}>{r.status}</Chip>} onClick={() => open({ kind: "run", id: r.id })} /></li>)}
          </ul>
        </section>
        <section>
          <H>QA holds</H>
          <ul className="space-y-2.5">
            {cp.holds.map((r) => <li key={r.id}><RowCard title={`${r.id}: ${r.product}`} meta={`${ownerName(w, r.owner)}. ${r.checks.filter((c) => !c.pass).map((c) => c.name).join(", ")} needs a re-test`} right={<Chip tone="bad">Hold</Chip>} onClick={() => open({ kind: "run", id: r.id })} /></li>)}
            {!cp.holds.length ? <li className="text-(--d-muted)">Nothing on hold.</li> : null}
          </ul>
          <H action={<More onClick={() => go("quotes")}>Quotes</More>}>Open quotes</H>
          <ul className="space-y-2.5">
            {cp.openQuotes.map((q) => <li key={q.id}><RowCard title={clientName(w, q.client) ?? q.client} meta={`${q.id}, ${q.gallons} gal ${q.product.toLowerCase()}`} right={<Chip tone={q.status === "Sent" ? "info" : "neutral"}>{q.status}</Chip>} onClick={() => open({ kind: "client", id: q.client })} /></li>)}
          </ul>
        </section>
      </div>
      <p className="text-[14px] text-(--d-muted)">Revenue counts client runs invoiced this month ({money(cp.revenue)}). Our own brand runs show up as stock, not sales.</p>
    </div>
  );
}
