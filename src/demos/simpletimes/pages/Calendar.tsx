"use client";

import { useState } from "react";
import { addDays, type Ymd } from "@demos/kit/data/dates";
import { MonthGrid, WeekAgenda } from "@demos/kit/blocks/Calendar";
import { BRANDS, EVENT_KINDS, type EventKind } from "@demos/simpletimes/catalog";
import type { CalEvent } from "@demos/simpletimes/data";
import { inBrand } from "@demos/simpletimes/derive";
import { Chip, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

const color = (e: CalEvent) => (e.brand === "both" ? "#231f20" : BRANDS[e.brand].color);
const brandName = (e: CalEvent) => (e.brand === "both" ? "Both brands" : BRANDS[e.brand].name);

export default function Calendar() {
  const { d, brand, notify } = useSt();
  const [kinds, setKinds] = useState<EventKind[]>([]);
  const events = d.events.filter((e) => inBrand(brand, e.brand) && (!kinds.length || kinds.includes(e.kind)));
  const on = (day: Ymd) => events.filter((e) => day >= e.date && day < addDays(e.date, e.days));
  const card = (e: CalEvent) => (
    <span className="flex w-full items-stretch gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3 text-left">
      <span className="w-1.5 shrink-0 rounded-full" style={{ background: color(e) }} aria-hidden="true" />
      <span className="min-w-0 flex-1"><span className="block text-[16px] leading-snug font-semibold">{e.title}</span><span className="block text-[14px] text-(--d-muted)">{brandName(e)}{e.days > 1 ? `, ${e.days} days` : ""}</span></span>
      <span className="shrink-0"><Chip>{e.kind}</Chip></span>
    </span>
  );
  return (
    <div className="space-y-4">
      <Title sub="Launches, promos, posts, emails, shows and events.">Marketing calendar</Title>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1">
        {EVENT_KINDS.map((k) => { const sel = kinds.includes(k); return <button key={k} type="button" aria-pressed={sel} onClick={() => setKinds((x) => (sel ? x.filter((y) => y !== k) : [...x, k]))} className={`min-h-12 shrink-0 rounded-full border px-4 text-[15px] ${sel ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{k}</button>; })}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-(--d-muted)">
        {[["Mixers", BRANDS.mixers.color], ["Syrup Project", BRANDS.syrup.color], ["Both", "#231f20"]].map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ background: c }} aria-hidden="true" />{l}</span>)}
      </p>
      <div className="md:hidden">
        <WeekAgenda today={d.today} itemsOn={on} getKey={(e) => e.id} noun="item" itemClass="block" renderItem={(e) => <button type="button" className="block w-full" onClick={() => notify(`${e.title}: opens the brief, assets and owner (demo).`)}>{card(e)}</button>} />
      </div>
      <div className="hidden md:block">
        <MonthGrid today={d.today} itemsOn={on} getId={(e) => e.id} onOpen={(e) => notify(`${e.title}: opens the brief, assets and owner (demo).`)}
          renderDot={(e) => <><span className="size-2 shrink-0 rounded-full" style={{ background: color(e) }} aria-hidden="true" /><span className="truncate">{e.title}</span></>}
          renderItem={card} />
      </div>
    </div>
  );
}
