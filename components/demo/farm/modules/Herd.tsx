"use client";

import { useMemo, useState } from "react";
import { addDays, addMonths, diffDays, monthKey } from "@/lib/demo/dates";
import { dayDate, monthLabel, num, shortDate, signedPct } from "@/lib/demo/format";
import { fmtDays, sum } from "@/lib/demo/farm/derive";
import type { Cow } from "@/lib/demo/farm/types";
import { ColumnChart } from "../../charts";
import Icon from "../../Icon";
import { Button, Card, EarTag, Note, PageHeader, Pill, Segmented } from "../../ui";
import { MoveHerdDialog } from "../Actions";
import { useFarm } from "../FarmProvider";
import PastureMap, { forageColor } from "../PastureMap";
import { Meter } from "../bits";

export default function Herd() {
  const { ds, seed, rotation, sku, milkToday } = useFarm();
  const [moving, setMoving] = useState(false);
  const [milkView, setMilkView] = useState<"weeks" | "months">("months");
  const t = ds.anchor;

  const milking = ds.cows.filter((c) => c.status === "Milking");
  const dry = ds.cows.filter((c) => c.status === "Dry");
  const finishers = ds.steers.filter((s) => s.kill > t && diffDays(s.kill, t) <= 365);
  const groups = [
    { label: "Milking cows", n: milking.length, sub: "A2A2, once-a-day" },
    { label: "Dry cows", n: dry.length, sub: "Calving soon" },
    { label: "Bred heifers", n: ds.heifers.bred, sub: "First calf in spring" },
    { label: "Yearling heifers", n: ds.heifers.yearlings, sub: "Replacements" },
    { label: "Calves on milk", n: ds.heifers.calves, sub: "Under 90 days" },
    { label: "Beef finishers", n: finishers.length, sub: "Grass-finished steers" },
    { label: "Hogs (woodlot)", n: ds.hogs.sows + ds.hogs.boar + ds.hogs.growers, sub: `${ds.hogs.sows} sows, ${ds.hogs.growers} growers` },
    { label: "Sheep", n: ds.sheep.ewes + ds.sheep.rams + ds.sheep.lambs, sub: `${ds.sheep.ewes} ewes, ${ds.sheep.lambs} lambs` },
  ];

  const lastMilk = ds.milk.at(-1)!;
  const avg7 = sum(ds.milk.slice(-7), (d) => d.gallons) / 7;
  const milkCols = useMemo(() => {
    if (milkView === "months") return ds.months.map((m) => ({ label: monthLabel(m), values: [Math.round(sum(ds.milk.filter((d) => d.date.startsWith(m)), (d) => d.gallons))] }));
    return ds.weeks.map((w) => {
      const days = ds.milk.filter((d) => d.date >= w && d.date <= addDays(w, 6));
      return { label: shortDate(w), values: [Math.round(sum(days, (d) => d.gallons) / Math.max(1, days.length))] };
    });
  }, [ds, milkView]);
  const ranked = [...milking].sort((a, b) => b.avg7 - a.avg7);

  // Breeding + calving calendar, next six months.
  const cal = useMemo(() => {
    const ev: Array<{ date: string; text: string; tone: "good" | "warn" | "info" | "neutral"; cow: Cow }> = [];
    const end = addDays(t, 183);
    for (const c of ds.cows) {
      if (c.nextDue >= t && c.nextDue <= end) ev.push({ date: c.nextDue, text: "Calve", tone: "good", cow: c });
      const dryOff = addDays(c.nextDue, -60);
      if (dryOff >= t && dryOff <= end) ev.push({ date: dryOff, text: "Dry off", tone: "neutral", cow: c });
      if (c.pregCheck === "Pending" && c.bred) ev.push({ date: addDays(c.bred, 35) < t ? t : addDays(c.bred, 35), text: "Preg check", tone: "info", cow: c });
      const breed = addDays(c.nextDue, 60);
      if (breed >= t && breed <= end) ev.push({ date: breed, text: "Breed", tone: "warn", cow: c });
    }
    ev.sort((a, b) => (a.date < b.date ? -1 : 1));
    const months = Array.from({ length: 6 }, (_, i) => addMonths(monthKey(t), i));
    return months.map((m) => ({ m, ev: ev.filter((e) => e.date.startsWith(m)) }));
  }, [ds, t]);

  // Finishing forecast → processing → next month's beef.
  const upcoming = ds.batches.filter((b) => b.kind === "beef" && b.kill >= t).slice(0, 4);
  const nextMonth = ds.batches.filter((b) => b.kind === "beef" && b.back >= t && diffDays(b.back, t) <= 31);
  const nextMonthCuts = new Map<string, number>();
  for (const b of nextMonth) for (const [id, n] of Object.entries(b.yields)) nextMonthCuts.set(id, (nextMonthCuts.get(id) ?? 0) + n);
  const nextLbs = sum([...nextMonthCuts], ([id, n]) => n * sku.get(id)!.lbs);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Herd & Pasture"
        meta={`${seed.acres} acres certified organic · chemical-free since ${seed.chemicalFreeSince} · herd moves to fresh grass daily`}
        actions={<Button variant="primary" onClick={() => setMoving(true)}><Icon name="move" size={18} />Move herd</Button>}
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {groups.map((g) => (
          <li key={g.label} className="demo-card p-4">
            <p className="text-[13px] font-medium text-(--d-muted)">{g.label}</p>
            <p className="demo-display mt-1 text-[28px]">{num(g.n)}</p>
            <p className="text-[12.5px] text-(--d-muted)">{g.sub}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7" title="Pasture map" action={<span className="text-[13px] text-(--d-muted)">Tap a paddock</span>}>
          <PastureMap />
        </Card>
        <Card className="xl:col-span-5" title="Rotation board" action={<Pill tone="accent">{rotation.cycle}-day lap</Pill>}>
          <div className="demo-scroll-x -mx-4 sm:-mx-5">
            <table className="w-full min-w-[460px] text-left text-[14px]">
              <thead className="text-[12.5px] text-(--d-muted)">
                <tr className="border-b border-(--d-line)">
                  <th className="px-4 py-2 font-semibold sm:px-5">Paddock</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 text-right font-semibold">Rest</th>
                  <th className="w-28 px-2 py-2 font-semibold">Forage</th>
                  <th className="px-4 py-2 font-semibold sm:px-5">Next graze</th>
                </tr>
              </thead>
              <tbody>
                {[...rotation.rows].sort((a, b) => order(a) - order(b) || (a.nextGraze ?? "9").localeCompare(b.nextGraze ?? "9")).map((p) => (
                  <tr key={p.id} className={`border-b border-(--d-line) last:border-0 ${p.status === "Grazing" ? "bg-[color-mix(in_oklab,var(--d-accent)_10%,transparent)]" : ""}`}>
                    <td className="px-4 py-2 sm:px-5"><span className="font-semibold">{p.name}</span><span className="block text-[12px] text-(--d-muted)">{p.acres} ac</span></td>
                    <td className="px-2 py-2"><Pill tone={p.status === "Grazing" ? "accent" : p.status === "Next" ? "info" : "neutral"}>{p.status === "Grazing" ? `Day ${p.dayIn} of ${p.stay}` : p.status}</Pill></td>
                    <td className="px-2 py-2 text-right">{p.rest == null ? "—" : `${p.rest}d`}</td>
                    <td className="px-2 py-2">
                      <span className="demo-mono text-[12.5px]">{p.height.toFixed(1)}″</span>
                      <Meter value={p.height} max={13} color={forageColor(p.height)} label={`${p.name} forage height`} />
                    </td>
                    <td className="px-4 py-2 text-[13px] sm:px-5">{p.status === "Grazing" ? `Leaves ${shortDate(rotation.leaving)}` : p.nextGraze ? shortDate(p.nextGraze) : p.status === "Stockpiled" ? "Winter" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card
          className="lg:col-span-7"
          title="Milk"
          action={<Segmented label="Milk range" value={milkView} onChange={setMilkView} options={[{ value: "months", label: "12 months" }, { value: "weeks", label: "13 weeks" }]} />}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-[14px]">
            <div><p className="text-[12.5px] text-(--d-muted)">Yesterday</p><p className="demo-display text-[22px]">{num(lastMilk.gallons)} gal</p></div>
            <div><p className="text-[12.5px] text-(--d-muted)">7-day average</p><p className="demo-display text-[22px]">{num(avg7)} gal</p></div>
            <div><p className="text-[12.5px] text-(--d-muted)">{milkToday != null ? "Logged today" : "Per milking cow"}</p><p className="demo-display text-[22px]">{milkToday != null ? `${num(milkToday)} gal` : `${(avg7 / milking.length).toFixed(1)} gal`}</p></div>
          </div>
          <ColumnChart
            title={milkView === "months" ? "Gallons per month" : "Average gallons per day, by week"}
            columns={milkCols}
            series={[{ name: milkView === "months" ? "Gallons" : "Gal/day", color: "var(--d-c1)" }]}
            format={num}
            height={190}
            labelEvery={milkView === "weeks" ? 2 : 1}
          />
          <Note>Spring calving brings the flush in April–June; fall calvers keep owners in milk through winter.</Note>
        </Card>
        <Card className="lg:col-span-5" title="Cows to watch">
          <CowList title="Top 5, last 7 days" cows={ranked.slice(0, 5)} />
          <CowList title="Bottom 5" cows={ranked.slice(-5).reverse()} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Breeding + calving calendar">
          <div className="demo-scroll-x demo-snap -mx-4 flex gap-3 px-4 pb-2 sm:-mx-5 sm:px-5">
            {cal.map(({ m, ev }) => (
              <section key={m} className="w-[80%] shrink-0 rounded-2xl border border-(--d-line) p-3 sm:w-[280px]">
                <h3 className="font-semibold">{monthLabel(m, true)} <span className="font-normal text-(--d-muted)">· {ev.length}</span></h3>
                <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto text-[13.5px]">
                  {ev.map((e, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="demo-mono w-12 shrink-0 text-[12px] text-(--d-muted)">{shortDate(e.date)}</span>
                      <EarTag tag={e.cow.tag} />
                      <span className="min-w-0 truncate">{e.cow.name}</span>
                      <Pill tone={e.tone} className="ml-auto">{e.text}</Pill>
                    </li>
                  ))}
                  {!ev.length ? <li className="text-(--d-muted)">Nothing scheduled.</li> : null}
                </ul>
              </section>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-5" title="Finishing → processing → freezer">
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <li key={b.id} className="rounded-2xl border border-(--d-line) p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{dayDate(b.kill)} <span className="font-normal text-(--d-muted)">· {fmtDays(diffDays(b.kill, t))}</span></p>
                  <span className="demo-mono text-[12.5px] text-(--d-muted)">{b.lot}</span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {ds.steers.filter((s) => s.lot === b.lot && s.kill === b.kill).map((s) => {
                    const live = Math.round(s.hanging / 0.58 - 1.7 * diffDays(s.kill, t));
                    return <li key={s.id} className="flex items-center gap-1.5 text-[13px]"><EarTag tag={s.tag} /> ~{num(live)} lb now</li>;
                  })}
                </ul>
                <p className="mt-1.5 text-[12.5px] text-(--d-muted)">{seed.processor.name} · back in the freezer {shortDate(b.back)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl bg-(--d-panel2) p-4">
            <p className="font-semibold">Next 30 days of beef: {num(nextLbs)} lb</p>
            <p className="mt-1 text-[13px] text-(--d-muted)">
              {[...nextMonthCuts].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id, n]) => `${num(n)} ${sku.get(id)!.name.toLowerCase()}`).join(" · ") || "No beef due back in the next 30 days."}
            </p>
          </div>
        </Card>
      </div>

      <MoveHerdDialog open={moving} onClose={() => setMoving(false)} />
    </div>
  );
}

const order = (p: { status: string }) => ({ Grazing: 0, Next: 1, Resting: 2, Stockpiled: 3, Hay: 4 })[p.status] ?? 5;

function CowList({ title, cows }: { title: string; cows: Cow[] }) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="text-[13px] font-semibold text-(--d-muted)">{title}</h3>
      <ul className="mt-1 divide-y divide-(--d-line)">
        {cows.map((c) => {
          const change = c.avgPrev ? c.avg7 / c.avgPrev - 1 : 0;
          return (
            <li key={c.id} className="flex min-h-12 items-center gap-3 py-1.5 text-[14px]">
              <EarTag tag={c.tag} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{c.name} {c.dip ? <Pill tone="bad" className="ml-1">Watch</Pill> : null}</span>
                <span className="block text-[12.5px] text-(--d-muted)">{c.breed} · lactation {c.lactation} · {c.dim} days in milk</span>
              </span>
              <span className="text-right">
                <span className="block font-semibold">{c.avg7.toFixed(1)} gal</span>
                <span className={`block text-[12px] ${change < -0.1 ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}`}>{c.avgPrev ? signedPct(change) : "Fresh"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

