"use client";

import { addDays, addMonths, diffDays, monthKey, weekday } from "@demos/kit/data/dates";
import { dayDate, money, monthLabel, num, pct, shortDate, signedPct } from "@demos/kit/data/format";
import { inventoryRows, openOrders, revenueByMonth, skuSales, sum } from "@demos/sweetgrass/derive";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { EarTag } from "@demos/kit/ui/ui";
import { AskBox, type AskAnswer } from "@demos/kit/blocks/AskBox";
import { useFarm } from "@demos/sweetgrass/parts/FarmProvider";

type Answer = AskAnswer;
type Intent = { q: string; match: RegExp; run: () => Answer };

export default function Ask() {
  const { cfg } = useDemo();
  const farm = useFarm();
  const { ds, seed, sku, stats, rotation, serviced } = farm;
  const t = ds.anchor;
  const lastWeek = ds.weeks.at(-1)!;
  const lastWeekEnd = addDays(lastWeek, 6);
  const prevMonth = addMonths(monthKey(t), -1);

  const intents: Intent[] = [
    {
      q: "How many eggs did we sell last week?",
      match: /egg/i,
      run: () => {
        const days = ds.eggs.filter((d) => d.date >= lastWeek && d.date <= lastWeekEnd);
        const sold = sum(days, (d) => d.dozensSold);
        const laid = sum(days, (d) => d.eggs) / 12;
        const best = ds.flocks.map((f, i) => ({ f, n: sum(days, (d) => d.byFlock[i]) })).sort((a, b) => b.n - a.n)[0];
        return { source: "poultry", text: <>Week of {shortDate(lastWeek)}: <b>{num(sold)} dozen sold</b> out of {num(laid)} dozen laid ({pct(sold / laid)}). {best.f.name} laid the most ({num(best.n / 12)} dozen).</> };
      },
    },
    {
      q: "What's sold out right now?",
      match: /sold out|out of stock|\bout\b|waitlist/i,
      run: () => {
        const out = inventoryRows(ds, seed).filter((r) => r.status === "Out").sort((a, b) => b.waitlist - a.waitlist);
        return { source: "inventory", text: out.length ? <>{out.length} products: {out.slice(0, 6).map((r, i) => <span key={r.s.id}>{i ? ", " : ""}<b>{r.s.name}</b>{r.waitlist ? ` (${r.waitlist} waiting)` : ""}</span>)}{out.length > 6 ? "…" : "."}</> : "Nothing is sold out." };
      },
    },
    {
      q: "Which cows are giving the least milk?",
      match: /cow|least milk|low milk|lowest/i,
      run: () => {
        const low = ds.cows.filter((c) => c.status === "Milking").sort((a, b) => a.avg7 - b.avg7).slice(0, 3);
        const late = low.filter((c) => (c.dim ?? 0) > 220).length;
        return { source: "herd", text: <>Lowest over the last 7 days: {low.map((c, i) => <span key={c.id}>{i ? ", " : ""}<EarTag tag={c.tag} /> <b>{c.name}</b> {c.avg7.toFixed(1)} gal/day ({c.dim} days in milk{c.dip ? `, ${signedPct(c.avg7 / c.avgPrev - 1)} this week` : ""})</span>)}. {late >= 2 ? "Mostly late lactation." : "Not just late lactation."}{low.some((c) => c.dip) ? " The sudden drop is worth a look." : ""}</> };
      },
    },
    {
      q: "Who hasn't ordered in a while?",
      match: /hasn.?t ordered|lapsed|while|haven.?t|inactive/i,
      run: () => {
        const l = [...stats.values()].filter((s) => s.segments.includes("Lapsed 30+") && s.last && diffDays(t, s.last) <= 120).sort((a, b) => b.ltv - a.ltv).slice(0, 5);
        return { source: "customers", text: <>Best customers with no order in 30+ days: {l.map((s, i) => <span key={s.c.id}>{i ? ", " : ""}<b>{s.c.name}</b> ({money(s.ltv)}, last {shortDate(s.last!)})</span>)}. Open any of them in Customers to draft a check-in.</> };
      },
    },
    {
      q: "How many turkeys are left?",
      match: /turkey|thanksgiving/i,
      run: () => {
        const tk = ds.turkeys;
        return { source: "poultry", text: <><b>{tk.allocation - tk.preorders.length} of {tk.allocation}</b> still open. {tk.preorders.length} deposits in; processing {dayDate(tk.processing)}.</> };
      },
    },
    {
      q: "What's overdue for maintenance?",
      match: /overdue|maint|repair|service|tractor/i,
      run: () => {
        const late = ds.equipment.filter((e) => !serviced[e.id] && e.nextDue < t);
        return { source: "maintenance", text: late.length ? <>{late.map((e, i) => <span key={e.id}>{i ? "; " : ""}<b>{e.name}</b>, {diffDays(t, e.nextDue)} days ({e.task.toLowerCase()})</span>)}.</> : "Nothing is overdue." };
      },
    },
    {
      q: "Where does the herd go next?",
      match: /herd|paddock|pasture|graz|move/i,
      run: () => ({ source: "herd", text: <>The herd is in <b>{rotation.current.name}</b> (day {rotation.current.dayIn} of {rotation.current.stay}) and moves to <b>{rotation.next.name}</b> on {dayDate(rotation.leaving)}: {rotation.next.height.toFixed(1)}″ of forage after {rotation.next.rest} days of rest.</> }),
    },
    {
      q: "How did the farm store do last month?",
      match: /farm store|store/i,
      run: () => {
        const rows = revenueByMonth(ds, seed);
        const r = rows.find((x) => x.month === prevMonth);
        const p = rows.find((x) => x.month === addMonths(prevMonth, -1));
        const store = ds.orders.filter((o) => !o.open && o.channel === "store" && o.date.startsWith(prevMonth));
        const sat = sum(store.filter((o) => weekday(o.date) === 6), (o) => o.total) / Math.max(1, sum(store, (o) => o.total));
        return { source: "sales", text: r ? <>{monthLabel(prevMonth, true)}: <b>{money(r.by.store)}</b> across {store.length} sales{p ? <>, {signedPct(r.by.store / p.by.store - 1)} vs. {monthLabel(p.month)}</> : null}. Saturdays were {pct(sat)} of it.</> : "No data for last month." };
      },
    },
    {
      q: "Which delivery day is busiest this week?",
      match: /deliver|route|busiest|driver/i,
      run: () => {
        const by = new Map<string, number>();
        for (const o of openOrders(ds)) if (o.channel === "delivery" || o.channel === "wholesale") by.set(o.date, (by.get(o.date) ?? 0) + 1);
        const top = [...by].sort((a, b) => b[1] - a[1])[0];
        return { source: "delivery", text: top ? <><b>{dayDate(top[0])}</b> with {top[1]} stops (home deliveries + wholesale drops).</> : "No deliveries scheduled this week." };
      },
    },
    {
      q: "Where did last month's milk go?",
      match: /milk|gallon|cheese|butter/i,
      run: () => {
        const m = ds.milk.filter((d) => d.date.startsWith(prevMonth));
        const g = sum(m, (d) => d.gallons);
        const parts = [
          ["herdshare owners", sum(m, (d) => d.herdshare)],
          ["cheese vat", sum(m, (d) => d.cheese)],
          ["calves", sum(m, (d) => d.calves)],
          ["butter", sum(m, (d) => d.butter)],
          ["owners' extras", sum(m, (d) => d.extras)],
          ["hogs (skim + whey)", sum(m, (d) => d.other)],
        ] as const;
        return { source: "production", text: <>{monthLabel(prevMonth, true)}: <b>{num(g)} gallons</b>. {parts.map(([k, v], i) => <span key={k}>{i ? ", " : ""}{k} {num(v)} ({pct(v / g)})</span>)}.</> };
      },
    },
    {
      q: "What sold best this fall?",
      match: /best|top|sell/i,
      run: () => {
        const top = [...skuSales(ds, ds.weeks[0], lastWeekEnd)].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 3);
        return { source: "sales", text: <>Last 13 weeks by revenue: {top.map(([id, v], i) => <span key={id}>{i ? ", " : ""}<b>{sku.get(id)!.name}</b> {money(v.revenue)}</span>)}.</> };
      },
    },
  ];

  return (
    <AskBox
      title="Ask the Farm"
      look="soft"
      bubble="header"
      intro={<>Ask in plain words. Every answer here is computed from the same records as the rest of {cfg.company.appName}, and says where it came from. Try one:</>}
      placeholder="e.g. How many eggs did we sell last week?"
      fallback=<>I can&apos;t answer that one in the concept yet. The real version answers from all of your records. Try asking about eggs, milk, cows, turkeys, the herd&apos;s next paddock, deliveries, sold-out products or overdue maintenance.</>
      intents={intents}
    />
  );
}
