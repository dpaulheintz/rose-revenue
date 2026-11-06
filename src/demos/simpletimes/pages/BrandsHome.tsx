"use client";

import { useRouter } from "next/navigation";
import { dayDate } from "@demos/kit/data/format";
import { weekStart } from "@demos/kit/data/dates";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { ColumnChart } from "@demos/kit/ui/charts";
import { BRANDS, REPS } from "@demos/simpletimes/catalog";
import { accountStats, inBrand, monthName, salesByMonth, shortDay } from "@demos/simpletimes/derive";
import { BrandChip, BrandChips, Chip, H, money, moneyK, More, NUM, RowCard, Tile, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function BrandsHome() {
  const { base } = useDemo();
  const router = useRouter();
  const { d, w, brand, open, account } = useSt();
  const go = (p: string) => router.push(`${base}/${p}`);
  const stats = w.accounts.filter((a) => inBrand(brand, a.brands)).map((a) => ({ a, s: accountStats(d, w, a) }));
  const due = stats.filter((x) => x.s.dueSoon).sort((x, y) => (x.s.due < y.s.due ? -1 : 1));
  const cross = stats.filter((x) => x.s.crossSell && inBrand(brand, [x.s.crossSell, ...x.a.brands])).sort((x, y) => y.s.revenue12 - x.s.revenue12);
  const months = salesByMonth(d, w, brand);
  const now = months[months.length - 1], prev = months[months.length - 2];
  const today = d.route.filter((r) => r.date === d.today && inBrand(brand, account(r.account).brands));
  const tastingsToday = w.tastings.filter((t) => t.date === d.today && inBrand(brand, t.brand));
  const tastingsWeek = w.tastings.filter((t) => t.date >= weekStart(d.today) && t.date >= d.today && inBrand(brand, t.brand));
  const dayOfMonth = +d.today.slice(8);

  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. Here's your day.`}>Good morning</Title>

      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label="Sales this month" value={moneyK(now.total)} sub={`Day ${dayOfMonth}. ${monthName(prev.month)} was ${moneyK(prev.total)}`} onClick={() => go("sales")} />
        <Tile label="Reorders due" value={due.length} sub={`${due.filter((x) => x.s.overdue).length} already late`} tone={due.some((x) => x.s.overdue) ? "bad" : undefined} onClick={() => go("accounts")} />
        <Tile label="Cross-sell openings" value={cross.length} sub="Carry one brand, not both" tone="warn" onClick={() => go("accounts")} />
        <Tile label="Tastings ahead this week" value={tastingsWeek.length} sub={tastingsToday.length ? `${tastingsToday.length} today` : "None today"} onClick={() => go("tastings")} />
      </div>

      <div className="grid gap-6 *:min-w-0 lg:grid-cols-2">
        <section>
          <H action={<More onClick={() => go("accounts")}>Route</More>}>Today&apos;s visits</H>
          <ul className="space-y-2.5">
            {tastingsToday.map((t) => (
              <li key={t.id}><RowCard stripe={BRANDS[t.brand].color} title={account(t.account).name} meta={`Tasting at ${t.time}. ${REPS.find((r) => r.id === t.rep)?.name} pouring`} right={<Chip tone="warn">Tasting</Chip>} onClick={() => open({ kind: "tasting", id: t.id })} /></li>
            ))}
            {today.map((r) => {
              const a = account(r.account);
              return <li key={r.account + r.time}><RowCard title={a.name} meta={`${r.time}, ${a.town}. ${r.why}`} foot={<BrandChips brands={a.brands} />} onClick={() => open({ kind: "account", id: a.id })} /></li>;
            })}
            {!today.length && !tastingsToday.length ? <li className="rounded-[12px] border border-dashed border-(--d-line) p-5 text-center text-(--d-muted)">Nothing on the route today.</li> : null}
          </ul>
        </section>

        <section>
          <H action={<More onClick={() => go("accounts")}>All accounts</More>}>Reorders due</H>
          <ul className="space-y-2.5">
            {due.slice(0, 4).map(({ a, s }) => (
              <li key={a.id}><RowCard title={a.name} meta={`Usually every ${a.cadence} days. Last order ${s.last ? `${shortDay(s.last.date)}, ${money(s.last.total)}` : "none"}`} right={<Chip tone={s.overdue ? "bad" : "warn"}>{s.overdue ? `Late, ${shortDay(s.due)}` : `Due ${shortDay(s.due)}`}</Chip>} onClick={() => open({ kind: "account", id: a.id })} /></li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <H>Cross-sell</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {cross.slice(0, 4).map(({ a, s }) => (
            <li key={a.id}><RowCard title={a.name} meta={`${a.type}, ${a.town}. ${money(s.revenue12)} in 12 months`} foot={<BrandChips brands={a.brands} missing={s.crossSell} />} onClick={() => open({ kind: "account", id: a.id })} /></li>
          ))}
        </ul>
      </section>

      <section className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4">
        <H action={<More onClick={() => go("sales")}>Sales</More>}>This month by brand</H>
        <div className="mb-4 grid grid-cols-2 gap-3">
          {(["mixers", "syrup"] as const).filter((b) => inBrand(brand, b)).map((b) => (
            <div key={b} className="min-w-0"><BrandChip brand={b} /><p className={`${NUM} mt-1 text-[28px] leading-none`}>{moneyK(now.byBrand[b])}</p><p className="text-[13.5px] text-(--d-muted)">{monthName(prev.month)}: {moneyK(prev.byBrand[b])}</p></div>
          ))}
        </div>
        <ColumnChart title="Sales by month, last 6 months" height={140} format={moneyK} series={(["mixers", "syrup"] as const).filter((b) => inBrand(brand, b)).map((b) => ({ name: BRANDS[b].name, color: BRANDS[b].color }))} columns={months.slice(-6).map((m) => ({ label: monthName(m.month), values: (["mixers", "syrup"] as const).filter((b) => inBrand(brand, b)).map((b) => Math.round(m.byBrand[b])), note: m.month === now.month ? "so far" : undefined }))} />
        <p className="mt-2 text-[13.5px] text-(--d-muted)">Tap a bar to see its numbers.</p>
      </section>
    </div>
  );
}
