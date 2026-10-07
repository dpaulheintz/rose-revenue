"use client";

import { useId, useMemo, useState } from "react";
import { addDays, diffDays, weekStart, weekday } from "@/lib/demo/dates";
import { dayDate, num, shortDate } from "@/lib/demo/format";
import { allLots, fmtDays, sum } from "@/lib/demo/farm/derive";
import { hash } from "@/lib/demo/rng";
import { ColumnChart } from "../../charts";
import Icon from "../../Icon";
import { Card, EarTag, Note, PageHeader, Pill, Stat, Tabs } from "../../ui";
import { useFarm } from "../FarmProvider";

type Tab = "cheese" | "tests" | "sanitation" | "sourdough" | "lots";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Production() {
  const [tab, setTab] = useState<Tab>("cheese");
  return (
    <div>
      <PageHeader title="Production" meta="Creamery, milk quality, sanitation, bakery and lot tracing" />
      <Tabs
        label="Production views"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "cheese", label: "Cheese" },
          { value: "tests", label: "Milk tests" },
          { value: "sanitation", label: "Sanitation" },
          { value: "sourdough", label: "Sourdough" },
          { value: "lots", label: "Lot lookup" },
        ]}
      />
      {tab === "cheese" ? <Cheese /> : tab === "tests" ? <Tests /> : tab === "sanitation" ? <Sanitation /> : tab === "sourdough" ? <Sourdough /> : <Lots />}
    </div>
  );
}

/* -------------------------------- cheese ------------------------------ */

function Cheese() {
  const { ds, sku } = useFarm();
  const t = ds.anchor;
  const aging = ds.cheese.filter((c) => c.ready > t);
  const kinds = ["ch-cheddar", "ch-gouda", "ch-colby"];
  const madeYear = ds.cheese.filter((c) => c.date >= ds.windowStart);
  const log = [...ds.cheese].filter((c) => c.date <= t).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 14);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aging now" value={`${num(sum(aging, (c) => c.blocks))} blocks`} sub={`${num(sum(aging, (c) => c.lbs))} lb in ${aging.length} lots`} />
        <Stat label="Ready to sell" value={`${num(sum(kinds, (k) => Math.max(0, ds.stock[k] - (ds.committed[k] ?? 0))))} blocks`} sub="Half-pound, aged 60+ days" />
        <Stat label="Next lot ready" value={aging.length ? shortDate(aging.sort((a, b) => (a.ready < b.ready ? -1 : 1))[0].ready) : "—"} sub={aging.length ? `${aging[0].kind}, lot ${aging[0].lot}` : "Nothing aging"} />
        <Stat label="Made, 12 months" value={`${num(sum(madeYear, (c) => c.lbs))} lb`} sub={`from ${num(sum(madeYear, (c) => c.gallons))} gal of milk`} />
      </div>
      <Card title="Aging inventory">
        <ul className="grid gap-3 sm:grid-cols-3">
          {kinds.map((k) => {
            const lots = aging.filter((c) => c.sku === k).sort((a, b) => (a.ready < b.ready ? -1 : 1));
            return (
              <li key={k} className="rounded-2xl border border-(--d-line) p-4">
                <p className="font-semibold">{sku.get(k)!.name}</p>
                <p className="mt-1 text-[13px] text-(--d-muted)">{num(Math.max(0, ds.stock[k]))} ready · {num(sum(lots, (c) => c.blocks))} aging</p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {lots.slice(0, 4).map((c) => (
                    <li key={c.id} className="flex justify-between gap-2"><span className="demo-mono">{c.lot}</span><span className="text-(--d-muted)">ready {shortDate(c.ready)}</span></li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <Note>Raw-milk cheese ages at least 60 days before it&apos;s sold; cheddar goes 90.</Note>
      </Card>
      <Card title="Batch log">
        <div className="demo-scroll-x -mx-4 sm:-mx-5">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)">
                <th className="px-4 py-2.5 font-semibold sm:px-5">Made</th>
                <th className="px-2 py-2.5 font-semibold">Lot</th>
                <th className="px-2 py-2.5 font-semibold">Cheese</th>
                <th className="px-2 py-2.5 text-right font-semibold">Milk</th>
                <th className="px-2 py-2.5 text-right font-semibold">Yield</th>
                <th className="px-2 py-2.5 text-right font-semibold">Blocks</th>
                <th className="px-4 py-2.5 font-semibold sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {log.map((c) => (
                <tr key={c.id} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2.5 sm:px-5">{dayDate(c.date)}</td>
                  <td className="demo-mono px-2 py-2.5 text-[13px]">{c.lot}</td>
                  <td className="px-2 py-2.5">{c.kind}</td>
                  <td className="px-2 py-2.5 text-right">{num(c.gallons)} gal</td>
                  <td className="px-2 py-2.5 text-right">{c.lbs} lb</td>
                  <td className="px-2 py-2.5 text-right">{c.blocks}</td>
                  <td className="px-4 py-2.5 sm:px-5">{c.ready > t ? <Pill tone="info">Aging · {diffDays(c.ready, t)}d left</Pill> : <Pill tone="good">Ready</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------- tests ------------------------------- */

function Tests() {
  const { ds, seed } = useFarm();
  const recent = ds.tests.slice(-26);
  const failed = ds.tests.filter((x) => !x.pass);
  const charts = [
    { key: "spc" as const, name: "Standard plate count", unit: "CFU/mL", limit: "Limit 10,000", fmt: num, color: "var(--d-c1)" },
    { key: "coliform" as const, name: "Coliform", unit: "/mL", limit: "Limit 10", fmt: num, color: "var(--d-c3)" },
    { key: "scc" as const, name: "Somatic cell count", unit: "cells/mL", limit: "Herd target under 250,000", fmt: (n: number) => `${num(n / 1000)}k`, color: "var(--d-c4)" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tests, last 12 months" value={num(ds.tests.length)} sub={seed.lab.name} />
        <Stat label="Passed" value={num(ds.tests.filter((x) => x.pass).length)} sub={`${failed.length} needed a retest`} tone="good" />
        <Stat label="Latest SPC" value={num(ds.tests.at(-1)!.spc)} sub={`CFU/mL · ${shortDate(ds.tests.at(-1)!.week)}`} />
        <Stat label="Latest SCC" value={`${num(ds.tests.at(-1)!.scc / 1000)}k`} sub="cells/mL" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {charts.map((c) => (
          <Card key={c.key} title={c.name} action={<span className="text-[12.5px] text-(--d-muted)">{c.limit}</span>}>
            <ColumnChart title={`${c.name}, weekly`} columns={recent.map((x) => ({ label: shortDate(x.week), values: [x[c.key]], muted: !x.pass }))} series={[{ name: c.unit, color: c.color }]} format={c.fmt} height={140} labelEvery={6} />
          </Card>
        ))}
      </div>
      {failed.map((f) => (
        <div key={f.week} className="flex gap-3 rounded-2xl border border-(--d-bad)/40 bg-[color-mix(in_oklab,var(--d-bad)_8%,transparent)] p-4">
          <Icon name="alert" className="mt-0.5 text-(--d-bad)" />
          <p className="text-[14px]"><span className="font-semibold">Week of {shortDate(f.week)}: coliform {f.coliform}/mL.</span> {f.note}</p>
        </div>
      ))}
      <Card title="Recent results">
        <div className="demo-scroll-x -mx-4 sm:-mx-5">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)"><th className="px-4 py-2.5 font-semibold sm:px-5">Week of</th><th className="px-2 py-2.5 text-right font-semibold">SPC</th><th className="px-2 py-2.5 text-right font-semibold">Coliform</th><th className="px-2 py-2.5 text-right font-semibold">SCC</th><th className="px-4 py-2.5 font-semibold sm:px-5">Result</th></tr>
            </thead>
            <tbody>
              {[...ds.tests].reverse().slice(0, 10).map((x) => (
                <tr key={x.week} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2.5 sm:px-5">{shortDate(x.week)}</td>
                  <td className="px-2 py-2.5 text-right">{num(x.spc)}</td>
                  <td className="px-2 py-2.5 text-right">{x.coliform}</td>
                  <td className="px-2 py-2.5 text-right">{num(x.scc / 1000)}k</td>
                  <td className="px-4 py-2.5 sm:px-5"><Pill tone={x.pass ? "good" : "bad"}>{x.pass ? "Pass" : "Retest"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>Results arrive by email from the lab; the real system files them here and shares the latest with herdshare owners.</Note>
      </Card>
    </div>
  );
}

/* ------------------------------ sanitation ---------------------------- */

const DAILY = [
  { task: "Parlor + bucket units washed (hot, alkaline, acid rinse)", area: "Dairy", who: "micah" },
  { task: "Bulk tank cleaned after pickup, temp chart initialed", area: "Dairy", who: "micah" },
  { task: "Cheese room: surfaces sanitized, vat CIP logged", area: "Creamery", who: "leah" },
  { task: "Egg washer drained, water temp logged", area: "Poultry", who: "josie" },
  { task: "Walk-in cooler + freezer temps recorded (AM / PM)", area: "Cold storage", who: "tess" },
  { task: "Bakery benches + mixer sanitized", area: "Bakery", who: "mara" },
];
const WEEKLY = [
  { task: "Milk line acid flush + gasket check", area: "Dairy", who: "micah", day: 1 },
  { task: "Floor drains scrubbed (parlor + cheese room)", area: "Dairy", who: "leah", day: 3 },
  { task: "Rodent stations checked", area: "Barns", who: "sam", day: 5 },
  { task: "Delivery van coolers washed out", area: "Delivery", who: "ben", day: 0 },
];

function Sanitation() {
  const { ds, done, toggleDone, person } = useFarm();
  const t = ds.anchor;
  const dailyDone = DAILY.filter((_, i) => done.has(`san-d-${i}`)).length;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Daily checklist" action={<Pill tone={dailyDone === DAILY.length ? "good" : "warn"}>{dailyDone} of {DAILY.length}</Pill>}>
        <ul className="divide-y divide-(--d-line)">
          {DAILY.map((d, i) => (
            <li key={d.task}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                <input type="checkbox" className="size-5 shrink-0 accent-(--d-accent)" checked={done.has(`san-d-${i}`)} onChange={() => toggleDone(`san-d-${i}`)} />
                <span className="min-w-0 flex-1">
                  <span className={`block ${done.has(`san-d-${i}`) ? "text-(--d-muted) line-through" : ""}`}>{d.task}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{d.area} · {person(d.who).name}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Weekly">
        <ul className="divide-y divide-(--d-line)">
          {WEEKLY.map((w, i) => {
            const last = addDays(t, -((weekday(t) - w.day + 7) % 7 || 7));
            return (
              <li key={w.task}>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                  <input type="checkbox" className="size-5 shrink-0 accent-(--d-accent)" checked={done.has(`san-w-${i}`)} onChange={() => toggleDone(`san-w-${i}`)} />
                  <span className="min-w-0 flex-1">
                    <span className="block">{w.task}</span>
                    <span className="block text-[12.5px] text-(--d-muted)">{w.area} · {person(w.who).name} · {DAYS[w.day]}s · last done {shortDate(done.has(`san-w-${i}`) ? t : last)}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <Note>Checklists here are the ones inspectors ask for. The real system keeps the signed history.</Note>
      </Card>
    </div>
  );
}

/* ------------------------------ sourdough ----------------------------- */

function Sourdough() {
  const { ds, sku } = useFarm();
  const t = ds.anchor;
  const mon = weekStart(t);
  const avgFor = (wd: number, id: string) => {
    const days = ds.bakes.filter((b) => weekday(b.date) === wd);
    return Math.round(sum(days, (b) => b.loaves[id] ?? 0) / Math.max(1, days.length));
  };
  const plan = [1, 2, 3, 4, 5, 6].map((k) => {
    const d = addDays(mon, k - 1);
    const committed = sum(ds.orders.filter((o) => o.open && o.date === d), (o) => sum(o.lines.filter((l) => l.sku.startsWith("bread")), (l) => l.qty));
    return { d, wd: weekday(d), country: avgFor(weekday(d), "bread-country"), sandwich: avgFor(weekday(d), "bread-sandwich"), committed };
  });
  const sold = sum(ds.orders.filter((o) => !o.open && o.date >= addDays(t, -28)), (o) => sum(o.lines.filter((l) => l.sku.startsWith("bread")), (l) => l.qty));
  const baked = sum(ds.bakes.filter((b) => b.date >= addDays(t, -28)), (b) => (b.loaves["bread-country"] ?? 0) + (b.loaves["bread-sandwich"] ?? 0));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Baked, last 4 weeks" value={num(baked)} sub="loaves" />
        <Stat label="Sold, last 4 weeks" value={num(sold)} sub={`${Math.round((sold / Math.max(1, baked)) * 100)}% sell-through`} />
        <Stat label="Country loaf" value={`$${sku.get("bread-country")!.price}`} sub="Biggest seller" />
        <Stat label="Bake days" value="Mon–Sat" sub="Big bakes on delivery days" />
      </div>
      <Card title={`This week's bake plan`}>
        <div className="demo-scroll-x -mx-4 sm:-mx-5">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)"><th className="px-4 py-2.5 font-semibold sm:px-5">Day</th><th className="px-2 py-2.5 font-semibold">Feed starter</th><th className="px-2 py-2.5 font-semibold">Mix + shape</th><th className="px-2 py-2.5 text-right font-semibold">Country</th><th className="px-2 py-2.5 text-right font-semibold">Sandwich</th><th className="px-4 py-2.5 text-right font-semibold sm:px-5">Already ordered</th></tr>
            </thead>
            <tbody>
              {plan.map((p) => (
                <tr key={p.d} className={`border-b border-(--d-line) last:border-0 ${p.d === t ? "bg-[color-mix(in_oklab,var(--d-accent)_10%,transparent)]" : ""} ${p.d < t ? "text-(--d-muted)" : ""}`}>
                  <td className="px-4 py-2.5 font-semibold sm:px-5">{DAYS[p.wd]} {shortDate(p.d).split(" ")[1]}{p.d === t ? " · today" : ""}</td>
                  <td className="px-2 py-2.5">8:00 pm the night before</td>
                  <td className="px-2 py-2.5">{p.wd === 2 || p.wd === 4 || p.wd === 6 ? "3:30 am" : "4:30 am"}</td>
                  <td className="px-2 py-2.5 text-right">{p.country}</td>
                  <td className="px-2 py-2.5 text-right">{p.sandwich}</td>
                  <td className="px-4 py-2.5 text-right sm:px-5">{p.d >= t ? p.committed : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>Plan = average of the same weekday over the last four weeks. The real version adjusts to orders already placed.</Note>
      </Card>
    </div>
  );
}

/* ------------------------------- lot lookup --------------------------- */

function Lots() {
  const { ds, seed, sku } = useFarm();
  const lots = useMemo(() => allLots(ds), [ds]);
  const [q, setQ] = useState(lots.find((l) => l.kind === "beef")?.lot ?? lots[0].lot);
  const id = useId();
  const lot = lots.find((l) => l.lot.toLowerCase() === q.trim().toLowerCase());
  const t = ds.anchor;
  const batch = lot ? ds.batches.find((b) => b.lot === lot.lot) : null;
  const cheese = lot ? ds.cheese.find((c) => c.lot === lot.lot) : null;
  const steers = batch?.kind === "beef" ? ds.steers.filter((s) => s.lot === batch.lot) : [];
  // Paddocks the herd worked through in the 30 days before processing (by the rotation lap).
  const lap = ds.rotation.order.map((pid) => ds.paddocks.find((p) => p.id === pid)!.name);
  const startIdx = hash(lot?.lot ?? "") % lap.length;
  const grazed = Array.from({ length: 6 }, (_, i) => lap[(startIdx + i) % lap.length]);
  const sold = batch ? sum(ds.orders.filter((o) => o.date >= batch.back && diffDays(o.date, batch.back) <= 30), (o) => o.lines.filter((l) => (batch.yields[l.sku] ?? 0) > 0).length) : cheese ? sum(ds.orders.filter((o) => o.date >= cheese.ready && diffDays(o.date, cheese.ready) <= 30), (o) => o.lines.filter((l) => l.sku === cheese.sku).length) : 0;
  const test = cheese ? ds.tests.find((x) => x.week === weekStart(cheese.date)) : null;
  const animal = steers[0];

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <Card title="Find a lot">
          <label htmlFor={id} className="sr-only">Lot code</label>
          <div className="relative">
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
            <input id={id} className="demo-input demo-mono pl-10 uppercase" value={q} onChange={(e) => setQ(e.target.value)} placeholder="BF-260921" />
          </div>
          <p className="mt-3 text-[13px] text-(--d-muted)">Recent lots</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {lots.slice(0, 10).map((l) => (
              <button key={l.lot} type="button" onClick={() => setQ(l.lot)} className={`demo-mono inline-flex min-h-11 items-center rounded-full border px-3 text-[13px] ${lot?.lot === l.lot ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line) bg-(--d-panel)"}`}>{l.lot}</button>
            ))}
          </div>
        </Card>
        {lot ? (
          <Card title={`Lot ${lot.lot}`}>
            {batch ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
                <div><dt className="text-[12.5px] text-(--d-muted)">What</dt><dd className="font-semibold">{batch.kind === "beef" ? "Grass-fed beef" : batch.kind === "pork" ? "Pastured pork" : batch.kind === "lamb" ? "Lamb" : "Pastured chicken"}</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Processed</dt><dd>{dayDate(batch.kill)} · {batch.kind === "broiler" ? "on-farm" : seed.processor.name}</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">{batch.kind === "broiler" ? "Birds" : "Animals"}</dt><dd>{batch.kind === "broiler" ? num(batch.head) : <span className="flex flex-wrap gap-1">{batch.animals.map((a) => <EarTag key={a} tag={a} />)}</span>}</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Into the freezer</dt><dd>{dayDate(batch.back)}</dd></div>
                <div className="col-span-2"><dt className="text-[12.5px] text-(--d-muted)">Packed</dt><dd>{Object.entries(batch.yields).filter(([, n]) => n).map(([s, n]) => `${num(n)} ${sku.get(s)!.name.toLowerCase()}`).join(" · ")}</dd></div>
                <div className="col-span-2"><dt className="text-[12.5px] text-(--d-muted)">Went out in</dt><dd>{num(sold)} order lines in its first 30 days {batch.back > t ? "(not back yet)" : ""}</dd></div>
              </dl>
            ) : cheese ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
                <div><dt className="text-[12.5px] text-(--d-muted)">What</dt><dd className="font-semibold">Raw-milk {cheese.kind.toLowerCase()}</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Made</dt><dd>{dayDate(cheese.date)} by Leah</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Milk</dt><dd>{num(cheese.gallons)} gal from the herd</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Yield</dt><dd>{cheese.lbs} lb · {cheese.blocks} blocks</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Ready</dt><dd>{dayDate(cheese.ready)} ({fmtDays(diffDays(cheese.ready, t))})</dd></div>
                <div><dt className="text-[12.5px] text-(--d-muted)">Milk test that week</dt><dd>{test ? <Pill tone={test.pass ? "good" : "bad"}>{test.pass ? "Pass" : "Retest"}</Pill> : "—"}</dd></div>
              </dl>
            ) : null}
            <p className="mt-4 text-[13px] text-(--d-muted)">Pastures in the month before: {grazed.join(", ")}.</p>
          </Card>
        ) : (
          <p className="text-(--d-muted)">No lot matches “{q}”. Try one of the recent lots.</p>
        )}
      </div>

      {/* What a customer sees when they scan the label. */}
      <div className="lg:col-span-5">
        <p className="mb-2 text-[13px] font-semibold text-(--d-muted)">Mock: what a customer sees when they scan the QR on the label</p>
        <div className="mx-auto max-w-[330px] rounded-[38px] border-[10px] border-(--d-header) bg-(--d-panel) p-4 shadow-xl">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-(--d-line)" aria-hidden="true" />
          <p className="text-center text-[11px] font-semibold tracking-[0.2em] text-(--d-accent) uppercase">Sweet Grass Dairy</p>
          <h3 className="demo-display mt-1 text-center text-[24px]">{animal ? "Meet your animal" : cheese ? "Meet the herd" : "Meet your farm"}</h3>
          {animal ? (
            <div className="mt-3 rounded-2xl bg-(--d-panel2) p-3 text-[13.5px]">
              <p className="flex items-center gap-2"><EarTag tag={animal.tag} /> <span className="font-semibold">Steer #{animal.tag}</span></p>
              <p className="mt-1.5 text-(--d-muted)">Born on the farm {shortDate(animal.born)} {animal.born.slice(0, 4)}. {Math.round(diffDays(animal.kill, animal.born) / 30.4)} months on {seed.acres} acres of organic pasture, moved to fresh grass every day. Never fed grain.</p>
            </div>
          ) : cheese ? (
            <div className="mt-3 rounded-2xl bg-(--d-panel2) p-3 text-[13.5px] text-(--d-muted)">
              Made {shortDate(cheese.date)} from {num(cheese.gallons)} gallons of A2A2 milk from our grass-fed herd, then aged {diffDays(cheese.ready, cheese.date)} days.
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-(--d-panel2) p-3 text-[13.5px] text-(--d-muted)">Raised on pasture in Fredericktown, Ohio.</div>
          )}
          <ol className="mt-3 space-y-1.5 text-[13px]">
            {(animal
              ? [["Born", shortDate(animal.born)], ["On pasture", `${grazed.slice(0, 3).join(", ")}…`], ["Processed", shortDate(animal.kill)], ["Packed", batch!.lot]]
              : cheese
                ? [["Milked", shortDate(cheese.date)], ["Made", cheese.kind], ["Aged", `${diffDays(cheese.ready, cheese.date)} days`], ["Lot", cheese.lot]]
                : batch
                  ? [["Raised", "On pasture"], ["Processed", shortDate(batch.kill)], ["Lot", batch.lot]]
                  : []
            ).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-2 border-b border-(--d-line) pb-1.5 last:border-0"><span className="text-(--d-muted)">{k}</span><span className="font-semibold">{v}</span></li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-3">
            <MockQr seed={lot?.lot ?? "x"} />
            <p className="text-[11.5px] leading-snug text-(--d-muted)">Mock QR for the demo. In the real system every label prints a scannable code for its lot.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Decorative QR-like pattern (not scannable). */
function MockQr({ seed }: { seed: string }) {
  const n = 21;
  let h = hash(seed);
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    if (finder) continue;
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + x * 31 + y) >>> 0;
    if (h % 100 < 46) cells.push([x, y]);
  }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#22301e" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fffdf7" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#22301e" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width="88" height="88" className="shrink-0 rounded-md bg-[#fffdf7]" role="img" aria-label="Mock QR code (not scannable)" shapeRendering="crispEdges">
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" fill="#22301e" />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  );
}
