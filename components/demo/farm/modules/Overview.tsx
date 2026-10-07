"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { weekday } from "@/lib/demo/dates";
import { dayDate, money, moneyK, num, pct, signedPct } from "@/lib/demo/format";
import { CHANNELS, inventoryRows, monthToDate, openOrders, orderWeight, sum } from "@/lib/demo/farm/derive";
import { needsAttention } from "@/lib/demo/farm/insights";
import { useDemo } from "../../DemoProvider";
import { PreparedBy } from "../../Brand";
import Icon from "../../Icon";
import { Card, Pill, Stat } from "../../ui";
import { ChoreButtons } from "../Actions";
import { useFarm } from "../FarmProvider";
import PastureMap from "../PastureMap";
import { CustomerName } from "../bits";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Overview() {
  const { cfg, base } = useDemo();
  const { ds, seed, rotation, stats, serviced, eggsToday, milkToday, done, toggleDone, person } = useFarm();
  const t = ds.anchor;

  const mtd = useMemo(() => monthToDate(ds, seed), [ds, seed]);
  const attention = useMemo(() => needsAttention(ds, seed, rotation, stats, serviced), [ds, seed, rotation, stats, serviced]);
  const inv = useMemo(() => inventoryRows(ds, seed), [ds, seed]);
  const open = useMemo(() => openOrders(ds), [ds]);
  const today = open.filter((o) => o.date === t);
  const nextDay = today.length ? null : open.find((o) => o.date > t)?.date ?? null;
  const lastMilk = ds.milk.at(-1)!;
  const milkWeek = sum(ds.milk.slice(-8, -1), (d) => d.gallons) / 7;
  const lastEggs = ds.eggs.at(-1)!;
  const hens = ds.flocks.reduce((s, f) => s + f.hens, 0);
  const owners = ds.customers.filter((c) => c.herdshare && !c.stoppedOn);
  const eggsLogged = Object.values(eggsToday).reduce((s, n) => s + n, 0);
  const low = inv.filter((r) => r.status !== "In stock").sort((a, b) => b.waitlist - a.waitlist || a.free - b.free).slice(0, 6);
  const chores = seed.chores.map((c, i) => ({ ...c, key: `chore-${i}` }));
  const choresLeft = chores.filter((c) => !done.has(c.key));
  const href = (key: string) => `${base}/${cfg.modules.find((m) => m.key === key)!.path}`;
  const pack = today.length ? today : open.filter((o) => o.date === nextDay);
  const packWeight = sum(pack, (o) => orderWeight(o, new Map(seed.skus.map((s) => [s.id, s]))));

  return (
    <div className="space-y-5">
      {/* Masthead: date, place, weather. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-semibold text-(--d-accent)">{DAYS[weekday(t)]}, {dayDate(t).slice(4)} · {cfg.company.place}</p>
          <h1 className="demo-display mt-1 text-[32px] sm:text-[40px]">Today on the farm</h1>
        </div>
        <ul className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Sample forecast">
          {ds.weather.filter((w) => w.date >= t).slice(0, 5).map((w) => (
            <li key={w.date} className={`flex min-w-[76px] shrink-0 flex-col items-center rounded-2xl border px-3 py-2 text-center ${w.date === t ? "border-(--d-accent) bg-(--d-panel)" : "border-(--d-line) bg-(--d-panel)/60"}`}>
              <span className="text-[12px] font-semibold text-(--d-muted)">{w.date === t ? "Today" : DAYS[weekday(w.date)].slice(0, 3)}</span>
              <Icon name={w.sky === "Sunny" || w.sky === "Partly cloudy" ? "sun" : w.sky === "Cloudy" ? "cloud" : "rain"} size={22} className={w.sky === "Sunny" ? "text-[#b8860b]" : "text-(--d-muted)"} label={w.sky} />
              <span className="text-[14px] font-semibold">{w.hi}° <span className="font-normal text-(--d-muted)">{w.lo}°</span></span>
              <span className={`text-[11.5px] ${w.lo <= 34 ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}`}>{w.lo <= 34 ? "Frost" : `${w.rain}% rain`}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chore mode + the herd. */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card
          className="lg:col-span-7"
          title="Where the herd is today"
          action={<Link href={href("herd")} className="inline-flex min-h-12 items-center gap-1 text-[14px] font-semibold text-(--d-accent)">Herd & Pasture <Icon name="arrow" size={16} /></Link>}
        >
          <PastureMap compact />
        </Card>
        <Card className="order-first lg:order-none lg:col-span-5" title="Chore mode" action={<span className="text-[13px] text-(--d-muted)">Big buttons for the barn</span>}>
          <ChoreButtons layout="stack" />
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[14px] font-semibold">Chores due today</h3>
              <span className="text-[13px] text-(--d-muted)">{chores.length - choresLeft.length} of {chores.length} done</span>
            </div>
            <ul className="mt-2 divide-y divide-(--d-line)">
              {(choresLeft.length ? choresLeft : chores).slice(0, 5).map((c) => (
                <li key={c.key}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
                    <input type="checkbox" checked={done.has(c.key)} onChange={() => toggleDone(c.key)} className="size-5 shrink-0 accent-(--d-accent)" />
                    <span className="demo-mono w-12 shrink-0 text-[13px] text-(--d-muted)">{c.time}</span>
                    <span className={`min-w-0 flex-1 ${done.has(c.key) ? "text-(--d-muted) line-through" : ""}`}>{c.task}</span>
                    <span className="hidden text-[12.5px] text-(--d-muted) sm:inline">{person(c.owner).name.split(" ")[0]}</span>
                  </label>
                </li>
              ))}
            </ul>
            <Link href={href("projects")} className="mt-1 inline-flex min-h-12 items-center gap-1 text-[14px] font-semibold text-(--d-accent)">All daily chores <Icon name="arrow" size={16} /></Link>
          </div>
        </Card>
      </div>

      {/* The numbers that matter this morning. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={`Revenue, ${mtd.days} days in`} value={moneyK(mtd.revenue)} sub={mtd.prev ? `${signedPct(mtd.revenue / mtd.prev - 1)} vs. same days 4 weeks ago` : "First day of the month"} tone={mtd.revenue >= mtd.prev ? "good" : "warn"} />
        <Stat label={today.length ? "Orders to pack today" : "Orders to pack next"} value={num(pack.length)} sub={`${num(packWeight)} lb · ${nextDay ? dayDate(nextDay) : "today"}`} />
        <Stat label="Milk yesterday" value={`${num(lastMilk.gallons)} gal`} sub={milkToday != null ? `Today logged: ${num(milkToday)} gal` : `7-day avg ${num(milkWeek)} gal`} />
        <Stat label="Eggs yesterday" value={`${num(lastEggs.eggs / 12)} dz`} sub={eggsLogged ? `Today logged: ${num(eggsLogged)} eggs` : `Lay rate ${pct(lastEggs.eggs / hens)}`} />
        <Stat label="Herdshare owners" value={num(owners.length)} sub={`${num(sum(owners, (c) => c.herdshare!.gallons))} gal a week`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-5" title="Needs attention" action={<span className="text-[13px] text-(--d-muted)">Computed from today&apos;s data</span>}>
          <ul className="space-y-1">
            {attention.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link href={href(a.module)} className="group flex min-h-12 items-start gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-(--d-panel2)">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${a.tone === "bad" ? "bg-(--d-bad)" : a.tone === "warn" ? "bg-(--d-warn)" : "bg-(--d-info)"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{a.text}</span>
                    <span className="block text-[13px] text-(--d-muted)">{a.detail}</span>
                  </span>
                  <Icon name="arrow" size={16} className="mt-1 text-(--d-muted) group-hover:text-(--d-text)" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-4" title={today.length ? "Orders to pack today" : `Next to pack: ${nextDay ? dayDate(nextDay) : "none"}`} action={<Link href={href("delivery")} className="inline-flex min-h-12 items-center gap-1 text-[14px] font-semibold text-(--d-accent)">Routes <Icon name="arrow" size={16} /></Link>}>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CHANNELS.filter((c) => pack.some((o) => o.channel === c.key)).map((c) => (
              <Pill key={c.key}>{c.label} {pack.filter((o) => o.channel === c.key).length}</Pill>
            ))}
          </div>
          <ul className="divide-y divide-(--d-line)">
            {pack.slice(0, 7).map((o) => (
              <li key={o.id} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-semibold"><CustomerName order={o} /></span>
                  <span className="block truncate text-[12.5px] text-(--d-muted)">#{o.no} · {o.lines.reduce((s, l) => s + l.qty, 0)} items · {where(o.where, seed)}</span>
                </span>
                <span className="shrink-0 text-[14px] font-semibold">{money(o.total)}</span>
              </li>
            ))}
          </ul>
          {pack.length > 7 ? <p className="mt-2 text-[13px] text-(--d-muted)">+ {pack.length - 7} more on the route board</p> : null}
        </Card>

        <Card className="lg:col-span-3" title="Low + sold out" action={<Link href={href("inventory")} className="inline-flex min-h-12 items-center gap-1 text-[14px] font-semibold text-(--d-accent)">Inventory <Icon name="arrow" size={16} /></Link>}>
          <ul className="divide-y divide-(--d-line)">
            {low.map((r) => (
              <li key={r.s.id} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.s.name}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{r.status === "Out" ? (r.waitlist ? `${r.waitlist} waiting` : "None free") : `${num(r.free)} free · par ${num(r.s.par)}`}</span>
                </span>
                <Pill tone={r.status === "Out" ? "bad" : "warn"}>{r.status}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* The tools they already use. */}
      <section aria-labelledby="tools-h" className="demo-card flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="lg:w-64 lg:shrink-0">
          <h2 id="tools-h" className="demo-display text-[18px]">Connected tools</h2>
          <p className="text-[13px] text-(--d-muted)">Reads from what the farm already uses. Your store keeps selling; this runs the farm behind it.</p>
        </div>
        <ul className="grid flex-1 gap-2 sm:grid-cols-3">
          {seed.tools.map((tool) => (
            <li key={tool.name} className="rounded-2xl border border-(--d-line) px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{tool.name}</span>
                <Pill tone="good"><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />Connected</Pill>
              </div>
              <p className="text-[13px] text-(--d-muted)">{tool.what}</p>
              <p className="mt-1 text-[12.5px] text-(--d-muted)">{tool.mode} · {ago(tool.minutesAgo)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Every module, one tap away. */}
      <section aria-labelledby="mods-h">
        <h2 id="mods-h" className="demo-display mb-3 text-[20px]">Everything in {cfg.company.appName}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cfg.modules.filter((m) => m.key !== "overview").map((m) => (
            <li key={m.key}>
              <Link href={`${base}/${m.path}`} className="demo-card flex h-full min-h-12 items-start gap-3 p-4 hover:border-(--d-accent)">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--d-panel2) text-(--d-accent)"><Icon name={m.icon} size={21} /></span>
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="block text-[13px] leading-snug text-(--d-muted)">{m.blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* From Paul. */}
      <section aria-labelledby="close-h" className="overflow-hidden rounded-[22px] bg-(--d-header) text-(--d-on-header)">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <PreparedBy className="opacity-80" />
            <h2 id="close-h" className="demo-display mt-3 text-[26px] sm:text-[32px]">This runs on sample data. Yours would run on the real thing.</h2>
            <div className="mt-4 max-w-[62ch] space-y-3 text-[15px] leading-relaxed text-[#f4efdf]/90">
              <p>I built this so you could click around something that looks like your farm instead of a slide deck. Every name and number here is made up. The real version reads your GrazeCart exports, QuickBooks and Drip, the tools you already use. Your store keeps selling the food; this runs the farm behind it.</p>
              <p>It starts with a 2–3 week assessment of how the farm actually runs, then we build only what helps. You own the code and the data. Nobody gets replaced; the people you have get their evenings back.</p>
              <p className="font-semibold text-(--d-on-header)">— Paul Heintzman, Rose Revenue</p>
            </div>
          </div>
          <div className="rounded-2xl bg-black/15 p-5">
            <p className="text-[14px] text-[#f4efdf]/90">Fifteen minutes, free. I&apos;ll tell you honestly whether this is worth it for Sweet Grass.</p>
            <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fcf09a] px-5 text-[15px] font-bold text-[#263421] hover:brightness-105">
              <Icon name="calendar" size={18} />
              Book a free 15-min call
              <span className="sr-only"> (opens Cal.com in a new tab)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function where(id: string, seed: ReturnType<typeof useFarm>["seed"]) {
  return seed.zones.find((z) => z.id === id)?.name ?? seed.sites.find((s) => s.id === id)?.name ?? (id === "store" ? "Farm store" : id);
}
function ago(min: number) {
  return min < 60 ? `${min} min ago` : min < 60 * 24 ? `${Math.round(min / 60)} hr ago` : `${Math.round(min / 1440)} days ago`;
}
