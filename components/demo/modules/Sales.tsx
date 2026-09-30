"use client";

import { monthToDate, salesByMonth, skuTable, stateBreakdown, topAccounts } from "@/lib/demo/derive";
import { monthKey } from "@/lib/demo/dates";
import { money, moneyK, monthLabel, num, pct, signedPct } from "@/lib/demo/format";
import { useDemo } from "../DemoProvider";
import { BarList, ColumnChart, Sparkline } from "../charts";
import { Card, PageHeader, Stat } from "../ui";

const STATE_NAMES = { TX: "Texas", AR: "Arkansas", LA: "Louisiana", FL: "Florida" } as const;
const SERIES = [
  { name: "TX distributor", color: "var(--d-accent)" },
  { name: "Out-of-state distributor", color: "#c9c4bb" },
  { name: "Bottle shop", color: "#7a9e7e" },
];

export default function Sales() {
  const { cfg, ds, anchor } = useDemo();
  const mtd = monthToDate(ds);
  const months = salesByMonth(ds);
  const states = stateBreakdown(ds);
  const skus = skuTable(ds, cfg).sort((a, b) => b.revenue - a.revenue);
  const top = topAccounts(ds, 10);
  const marketName = (id: string) => cfg.markets.find((m) => m.id === id)!.name;
  const mLabel = monthLabel(mtd.month);
  const partial = mtd.month === monthKey(anchor); // on the 1st, the report month is last month (complete)

  return (
    <>
      <PageHeader title="Sales" meta={`Distributor depletions + bottle shop · last 12 months · ${partial ? `${mLabel} through the ${ordinal(mtd.throughDay)}` : `${mLabel} complete`}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1"><Stat label={`${mLabel} revenue${partial ? " to date" : ""}`} value={moneyK(mtd.total)} sub={`${num(mtd.txCases + mtd.oosCases)} cases shipped`} /></div>
        <Stat label="vs. same days last month" value={signedPct(mtd.change)} tone={mtd.change >= 0 ? "good" : "bad"} sub={mtd.change >= 0 ? "ahead of pace" : "behind pace"} />
        <Stat label="Texas share" value={pct(mtd.txShare)} sub="of distributor revenue" />
        <Stat label="Out-of-state share" value={pct(mtd.oosShare)} sub="AR · LA · FL" />
        <Stat label={`Bottle shop, ${mLabel}`} value={moneyK(mtd.bottleShop)} sub="ranch bottle sales" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card title="Revenue by month">
          <ColumnChart
            title="Revenue by month, stacked by channel"
            series={SERIES}
            format={moneyK}
            height={230}
            labelEvery={1}
            columns={months.map((m, i) => ({ label: `${monthLabel(m.month)} ${m.month.slice(0, 4)}`, note: i === months.length - 1 && partial ? "to date" : undefined, values: [m.tx, m.oos, m.bottleShop] }))}
          />
        </Card>
        <Card title="By state, 12 months">
          <BarList
            format={moneyK}
            rows={states.map((s) => ({ key: s.state, label: STATE_NAMES[s.state], value: s.revenue, sub: `${num(s.cases)} cases · ${s.activeAccounts} active accounts` }))}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[3fr_2fr]">
        <Card title="By SKU, 12 months" bodyClass="pb-2">
          <div className="demo-scroll-x">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">
                <tr className="border-b border-(--d-line)">
                  <th scope="col" className="py-2.5 pl-5 text-left font-medium">SKU</th>
                  <th scope="col" className="px-3 text-right font-medium">Cases</th>
                  <th scope="col" className="px-3 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-5 text-left font-medium">Monthly trend</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((r) => {
                  const ranchOnly = r.sku.channel === "ranch";
                  return (
                    <tr key={r.sku.id} className="border-b border-(--d-line)/60 last:border-0">
                      <td className="py-2.5 pl-5">
                        <span className="font-medium">{r.sku.name}</span>
                        <span className="block text-[12.5px] text-(--d-muted)">{r.sku.kind}{r.sku.channel === "limited" ? " · bottle shop + select TX stores" : ""}</span>
                      </td>
                      {ranchOnly ? (
                        <td colSpan={3} className="px-3 text-[13px] text-(--d-muted)">Ranch exclusive. Never sold to distributors; see the bottle shop.</td>
                      ) : (
                        <>
                          <td className="px-3 text-right">{num(r.cases)}</td>
                          <td className="px-3 text-right">{moneyK(r.revenue)}</td>
                          <td className="px-5"><Sparkline values={r.monthly.slice(0, partial ? -1 : undefined)} width={110} height={26} label={`${r.sku.name} monthly cases`} /></td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top 10 accounts, 12 months" bodyClass="pb-2">
          <ol className="divide-y divide-(--d-line)/60">
            {top.map((t, i) => (
              <li key={t.account.id} className="flex items-center gap-3 px-5 py-2.5 text-[14px]">
                <span className="demo-display w-6 text-[16px] text-(--d-accent)">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.account.name}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{t.account.type} · {marketName(t.account.marketId)}, {t.account.state}</span>
                </span>
                <span className="text-right">
                  <span className="block font-medium">{money(t.revenue)}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{num(t.cases)} cs</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
