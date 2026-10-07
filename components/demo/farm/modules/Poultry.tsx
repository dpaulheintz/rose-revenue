"use client";

import { useMemo, useState } from "react";
import { addDays, diffDays, monthIndex } from "@/lib/demo/dates";
import { dayDate, money, monthLabel, num, pct, shortDate } from "@/lib/demo/format";
import { fmtDays, sum } from "@/lib/demo/farm/derive";
import { ColumnChart } from "../../charts";
import Icon from "../../Icon";
import { Card, Note, PageHeader, Pill, Stat } from "../../ui";
import { LogEggsDialog } from "../Actions";
import { useFarm } from "../FarmProvider";
import { Meter } from "../bits";

const FLOCK_COLORS = ["var(--d-c2)", "var(--d-c1)", "var(--d-c6)"];
const SIZES = ["Small (12–15 lb)", "Medium (16–19 lb)", "Large (20–24 lb)"] as const;
const SIZE_MIX = [0.25, 0.45, 0.3]; // expected flock size mix at processing

export default function Poultry() {
  const { ds, eggsToday, rotation, sku } = useFarm();
  const [logging, setLogging] = useState(false);
  const t = ds.anchor;
  const last = ds.eggs.at(-1)!;
  const week = ds.eggs.slice(-7);
  const hens = (fi: number) => ds.flocks[fi].hens;
  const allHens = sum(ds.flocks, (f) => f.hens);
  const layRate7 = sum(week, (d) => d.eggs) / 7 / allHens;
  const free = Math.max(0, (ds.stock.eggs ?? 0) - (ds.committed.eggs ?? 0));
  const loggedToday = sum(ds.flocks, (f) => eggsToday[f.id] ?? 0);

  const daily = useMemo(
    () => [
      ...ds.eggs.slice(-29).map((d) => ({ label: shortDate(d.date), values: d.byFlock })),
      { label: "Today", values: ds.flocks.map((f) => eggsToday[f.id] ?? 0), note: loggedToday ? "logged so far" : "not logged yet", muted: true },
    ],
    [ds, eggsToday, loggedToday],
  );
  const monthly = useMemo(
    () => ds.months.map((m) => {
      const days = ds.eggs.filter((d) => d.date.startsWith(m));
      return { label: monthLabel(m), values: [Math.round(sum(days, (d) => d.eggs) / 12), sum(days, (d) => d.dozensSold)] };
    }),
    [ds],
  );

  // Eggmobiles follow the cattle about three days behind.
  const coopPlan = (() => {
    const { order, days } = ds.rotation;
    let idx = order.indexOf(rotation.current.id);
    let dayIn = rotation.current.dayIn ?? 1;
    const herdAt: string[] = [];
    // Walk back 3 days then forward 7 to get the herd's paddock on each day.
    for (let k = 0; k < 3; k++) { dayIn--; if (dayIn < 1) { idx = (idx - 1 + order.length) % order.length; dayIn = days[order[idx]]; } }
    for (let k = 0; k < 7; k++) {
      herdAt.push(order[idx]);
      dayIn++;
      if (dayIn > days[order[idx]]) { idx = (idx + 1) % order.length; dayIn = 1; }
    }
    return herdAt.map((pid, k) => ({ date: addDays(t, k), paddock: ds.paddocks.find((p) => p.id === pid)!.name, move: k > 0 && pid !== herdAt[k - 1] }));
  })();

  const broilers = ds.broilers.filter((b) => b.arrived <= addDays(t, 30)).sort((a, b) => (a.arrived < b.arrived ? 1 : -1)).slice(0, 6);
  const tk = ds.turkeys;
  const bySize = SIZES.map((s, i) => ({ s, ordered: tk.preorders.filter((p) => p.size === s).length, expect: Math.round(tk.allocation * SIZE_MIX[i]) }));
  const paceWeeks = useMemo(() => {
    if (!tk.preorders.length) return [];
    const start = tk.preorders[0].placed;
    const weeks = Math.max(1, Math.ceil((diffDays(t, start) + 1) / 7));
    return Array.from({ length: weeks }, (_, i) => {
      const end = addDays(start, 7 * (i + 1) - 1);
      return { label: shortDate(addDays(start, 7 * i)), values: [tk.preorders.filter((p) => p.placed <= end).length] };
    });
  }, [tk, t]);

  return (
    <div className="space-y-5">
      <PageHeader title="Poultry & Eggs" meta={`${num(allHens)} laying hens in ${ds.flocks.length} eggmobiles · broilers on pasture April–November · Thanksgiving turkeys`} />

      <button
        type="button"
        onClick={() => setLogging(true)}
        className="flex min-h-[84px] w-full items-center gap-4 rounded-[22px] bg-(--d-accent) px-5 text-left text-(--d-on-accent) shadow-[inset_0_-4px_0_rgb(0_0_0_/_0.18)] hover:brightness-110 sm:w-auto sm:pr-10"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-black/15"><Icon name="egg" size={28} /></span>
        <span>
          <span className="block text-[20px] font-bold">Log eggs</span>
          <span className="block text-[13px] text-[#f4efdf]">{loggedToday ? `${num(loggedToday)} logged today across ${Object.keys(eggsToday).length} flock${Object.keys(eggsToday).length > 1 ? "s" : ""}` : "Count a collection round"}</span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Eggs yesterday" value={`${num(last.eggs / 12)} dz`} sub={`${num(last.eggs)} eggs`} />
        <Stat label="Lay rate, 7 days" value={pct(layRate7)} sub={[8, 9, 10, 11, 0, 1].includes(monthIndex(t)) ? "Shorter days, lower lay" : "Long days, peak lay"} />
        <Stat label="Free to sell" value={`${num(free)} dz`} sub={`${num(ds.committed.eggs ?? 0)} dz in this week's orders`} />
        <Stat label="Today, logged" value={num(loggedToday)} sub={loggedToday ? `${num(loggedToday / 12)} dozen so far` : "Tap Log eggs"} tone={loggedToday ? "good" : undefined} />
      </div>

      <Card title="Eggs per day, by flock">
        <ColumnChart title="Daily eggs by flock, last 30 days" columns={daily} series={ds.flocks.map((f, i) => ({ name: f.name, color: FLOCK_COLORS[i] }))} format={num} height={200} labelEvery={5} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Layer flocks">
          <div className="demo-scroll-x -mx-4 sm:-mx-5">
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead className="text-[12.5px] text-(--d-muted)">
                <tr className="border-b border-(--d-line)">
                  <th className="px-4 py-2 font-semibold sm:px-5">Flock</th>
                  <th className="px-2 py-2 text-right font-semibold">Hens</th>
                  <th className="px-2 py-2 text-right font-semibold">Age</th>
                  <th className="px-2 py-2 font-semibold">Lay rate, 7 days</th>
                  <th className="px-4 py-2 text-right font-semibold sm:px-5">Eggs/day</th>
                </tr>
              </thead>
              <tbody>
                {ds.flocks.map((f, i) => {
                  const perDay = sum(week, (d) => d.byFlock[i]) / 7;
                  const rate = perDay / hens(i);
                  const wks = Math.floor(diffDays(t, f.hatched) / 7);
                  return (
                    <tr key={f.id} className="border-b border-(--d-line) last:border-0">
                      <td className="px-4 py-2.5 sm:px-5"><span className="inline-flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-sm" style={{ background: FLOCK_COLORS[i] }} aria-hidden="true" />{f.name}</span><span className="block text-[12.5px] text-(--d-muted)">{f.coop}{eggsToday[f.id] ? ` · ${num(eggsToday[f.id])} logged today` : ""}</span></td>
                      <td className="px-2 py-2.5 text-right">{num(f.hens)}</td>
                      <td className="px-2 py-2.5 text-right">{wks < 60 ? `${wks} wk` : `${(wks / 52).toFixed(1)} yr`}</td>
                      <td className="w-40 px-2 py-2.5"><span className="text-[13px]">{rate ? pct(rate) : "Not laying yet"}</span><Meter value={rate} max={1} label={`${f.name} lay rate`} /></td>
                      <td className="px-4 py-2.5 text-right font-semibold sm:px-5">{num(perDay)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="lg:col-span-5" title="Eggmobile schedule">
          <p className="mb-2 text-[13px] text-(--d-muted)">The coops follow the cattle about three days behind to break up manure and pick out fly larvae.</p>
          <ul className="divide-y divide-(--d-line)">
            {coopPlan.map((c) => (
              <li key={c.date} className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-[14px]">
                <span className={c.date === t ? "font-semibold" : ""}>{c.date === t ? "Today" : dayDate(c.date)}</span>
                <span className="flex items-center gap-2">{c.move ? <Pill tone="info">Move</Pill> : null}<span>{c.paddock}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Laid vs. sold, by month">
        <ColumnChart title="Dozens laid and sold per month" columns={monthly} series={[{ name: "Laid (dz)", color: "var(--d-c2)" }, { name: "Sold (dz)", color: "var(--d-c1)" }]} mode="group" format={num} height={190} />
        <Note>Sold never runs past laid. Summer surplus goes to seconds and the bakery; winter eggs sell out.</Note>
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Broiler batches">
          <ul className="space-y-3">
            {broilers.map((b) => {
              const onFarm = diffDays(t, b.arrived);
              const status = b.arrived > t ? "Ordered" : b.processing < t ? "Processed" : onFarm < 21 ? "Brooder" : "On pasture";
              const batch = ds.batches.find((x) => x.id === b.id);
              return (
                <li key={b.id} className="rounded-2xl border border-(--d-line) p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">Batch {b.no} <span className="font-normal text-(--d-muted)">· {b.arrived.slice(0, 4)}</span></p>
                    <Pill tone={status === "Processed" ? "neutral" : status === "On pasture" ? "accent" : "info"}>{status}</Pill>
                  </div>
                  <p className="mt-0.5 text-[13px] text-(--d-muted)">Chicks {shortDate(b.arrived)} → processing {shortDate(b.processing)} · {num(status === "Processed" ? b.alive : b.chicks)} birds{status === "Processed" ? ` · ${b.avgLb} lb avg` : ""}</p>
                  {status === "Brooder" || status === "On pasture" ? (
                    <div className="mt-2">
                      <Meter value={onFarm} max={56} label={`Batch ${b.no} progress`} />
                      <p className="mt-1 text-[12.5px] text-(--d-muted)">Day {onFarm} of 56 · processing {fmtDays(diffDays(b.processing, t))}</p>
                    </div>
                  ) : null}
                  {batch && status === "Processed" ? (
                    <p className="mt-1.5 text-[12.5px] text-(--d-muted)">Yield: {Object.entries(batch.yields).map(([id, n]) => `${num(n)} ${sku.get(id)!.name.toLowerCase()}`).join(" · ")}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="lg:col-span-5" title="Thanksgiving turkeys">
          <div className="flex items-baseline justify-between">
            <p className="demo-display text-[30px]">{tk.preorders.length}<span className="text-[18px] text-(--d-muted)"> / {tk.allocation}</span></p>
            <span className="text-[13px] text-(--d-muted)">{money(sum(tk.preorders, (p) => p.deposit))} in deposits</span>
          </div>
          <Meter value={tk.preorders.length} max={tk.allocation} label="Turkeys pre-ordered of allocation" />
          <p className="mt-2 text-[13px] text-(--d-muted)">Processing {dayDate(tk.processing)} · pickups that weekend · {fmtDays(diffDays(tk.processing, t))}</p>
          <table className="mt-4 w-full text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)"><th className="py-2 font-semibold">Size</th><th className="py-2 text-right font-semibold">Ordered</th><th className="py-2 text-right font-semibold">Flock</th></tr>
            </thead>
            <tbody>
              {bySize.map((r) => (
                <tr key={r.s} className="border-b border-(--d-line) last:border-0">
                  <td className="py-2">{r.s}</td>
                  <td className="py-2 text-right font-semibold">{r.ordered}</td>
                  <td className="py-2 text-right">{r.expect} {r.ordered > r.expect ? <Pill tone="bad" className="ml-1">Over</Pill> : r.ordered > r.expect * 0.85 ? <Pill tone="warn" className="ml-1">Tight</Pill> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {paceWeeks.length > 1 ? (
            <div className="mt-4">
              <ColumnChart title="Pre-orders to date, by week" columns={paceWeeks} series={[{ name: "Pre-orders", color: "var(--d-c3)" }]} format={num} height={110} labelEvery={3} />
            </div>
          ) : null}
        </Card>
      </div>

      <LogEggsDialog open={logging} onClose={() => setLogging(false)} />
    </div>
  );
}
