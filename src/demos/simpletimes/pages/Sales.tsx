"use client";

import { useMemo } from "react";
import { BarList, ColumnChart, SplitBar } from "@demos/kit/ui/charts";
import { BRANDS, type BrandKey } from "@demos/simpletimes/catalog";
import { accountStats, bestSkus, inBrand, monthName, salesByMonth } from "@demos/simpletimes/derive";
import { BrandChips, H, moneyK, NUM, num, RowCard, Tile, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

const CHANNEL_COLORS = { DTC: "#cecb00", Wholesale: "#da5856", Retail: "#923a4c", Distributor: "#2671a4" };
const Panel = ({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) => (
  <section className="min-w-0 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4"><H>{title}</H>{children}{note ? <p className="mt-2 text-[13.5px] text-(--d-muted)">{note}</p> : null}</section>
);

export default function Sales() {
  const { d, w, brand, open } = useSt();
  const months = useMemo(() => salesByMonth(d, w, brand), [d, w, brand]);
  const skus = useMemo(() => bestSkus(d, w, brand), [d, w, brand]);
  const brands = (["mixers", "syrup"] as BrandKey[]).filter((b) => inBrand(brand, b));
  const year = months.reduce((s, m) => s + m.total, 0);
  const last3 = months.slice(-4, -1);
  const channels = (["DTC", "Wholesale", "Retail", "Distributor"] as const).map((c) => ({ label: c === "DTC" ? "Online (DTC)" : c, value: last3.reduce((s, m) => s + m.byChannel[c], 0), color: CHANNEL_COLORS[c] }));
  const top = w.accounts.filter((a) => inBrand(brand, a.brands)).map((a) => ({ a, s: accountStats(d, w, a) })).sort((x, y) => y.s.revenue12 - x.s.revenue12);
  const cross = top.filter((x) => x.s.crossSell);
  const now = months[months.length - 1];
  const sameLastYear = months[0];

  return (
    <div className="space-y-5">
      <Title sub={brand === "all" ? "Both brands, every channel." : `${BRANDS[brand].full} only. Switch brands at the top.`}>Sales</Title>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label="Last 12 months" value={moneyK(year)} />
        <Tile label={`${monthName(now.month)} so far`} value={moneyK(now.total)} sub={`${monthName(sameLastYear.month)} last year: ${moneyK(sameLastYear.total)}`} />
        <Tile label="Accounts ordering" value={last3.length ? Math.round(last3.reduce((s, m) => s + m.reorderAccts + m.newAccts, 0) / last3.length) : 0} sub="A month, last 3 months" />
        <Tile label="New accounts" value={months.slice(-3).reduce((s, m) => s + m.newAccts, 0)} sub="First order in last 3 months" tone="good" />
      </div>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <Panel title="Revenue by month" note="Tap a bar to see that month.">
          <div className="md:hidden"><ColumnChart title="Revenue by month, last 6 months" height={170} format={moneyK} series={brands.map((b) => ({ name: BRANDS[b].name, color: BRANDS[b].color }))} columns={months.slice(-6).map((m) => ({ label: monthName(m.month), values: brands.map((b) => Math.round(m.byBrand[b])), note: m === now ? "so far" : undefined }))} /></div>
          <div className="hidden md:block"><ColumnChart title="Revenue by month, last 12 months" height={170} labelEvery={2} format={moneyK} series={brands.map((b) => ({ name: BRANDS[b].name, color: BRANDS[b].color }))} columns={months.map((m) => ({ label: monthName(m.month), values: brands.map((b) => Math.round(m.byBrand[b])), note: m === now ? "so far" : undefined }))} /></div>
        </Panel>
        <Panel title="By channel" note={`Last 3 full months: ${months.slice(-4, -1).map((m) => monthName(m.month)).join(", ")}.`}>
          <SplitBar parts={channels} format={moneyK} />
        </Panel>
        <Panel title="Best sellers, last 90 days">
          <BarList rows={skus.slice(0, 7).map((s) => ({ key: s.name, label: s.name, value: Math.round(s.revenue), sub: `${num(s.units)} bottles` }))} format={moneyK} />
        </Panel>
        <Panel title="New vs. reorder accounts" note="Accounts that ordered each month. Tap a bar.">
          <ColumnChart title="New and reorder accounts by month" height={150} mode="stack" format={(n) => `${n}`} series={[{ name: "Reorder", color: "#5c5657" }, { name: "New", color: "#2a6b3c" }]} columns={months.slice(-6).map((m) => ({ label: monthName(m.month), values: [m.reorderAccts, m.newAccts] }))} />
        </Panel>
      </div>

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
        <section>
          <H>Top accounts</H>
          <ol className="space-y-2.5">
            {top.slice(0, 6).map(({ a, s }, i) => <li key={a.id}><RowCard title={`${i + 1}. ${a.name}`} meta={`${a.type}, ${a.town}`} right={<span className={`${NUM} text-[18px]`}>{moneyK(s.revenue12)}</span>} onClick={() => open({ kind: "account", id: a.id })} /></li>)}
          </ol>
        </section>
        <section>
          <H>Cross-sell: {cross.length} accounts</H>
          <p className="mb-2.5 text-[15px] text-(--d-muted)">They carry one brand. Same buyer, same delivery, a second line on the invoice.</p>
          <ul className="space-y-2.5">
            {cross.slice(0, 5).map(({ a, s }) => <li key={a.id}><RowCard title={a.name} meta={`${moneyK(s.revenue12)} in 12 months`} foot={<BrandChips brands={a.brands} missing={s.crossSell} />} onClick={() => open({ kind: "account", id: a.id })} /></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
