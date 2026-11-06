"use client";

import { useMemo, useState } from "react";
import { BRANDS, REPS } from "@demos/simpletimes/catalog";
import { inBrand, productName, shortDay, tastingRoi } from "@demos/simpletimes/derive";
import { Button } from "@demos/kit/ui/ui";
import Icon from "@demos/kit/ui/Icon";
import { Chip, H, money, NUM, RowCard, Tile, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function Tastings() {
  const { d, w, brand, open, account } = useSt();
  const [limit, setLimit] = useState(12);
  const list = w.tastings.filter((t) => inBrand(brand, t.brand));
  const upcoming = list.filter((t) => t.date >= d.today && t.upcoming);
  const past = useMemo(() => w.tastings.filter((t) => !t.upcoming && inBrand(brand, t.brand)).map((t) => ({ t, r: tastingRoi(w, t) })).reverse(), [w, brand]);
  const recent = past.filter(({ t }) => t.date >= `${+d.today.slice(0, 4) - 1}${d.today.slice(4)}`);
  const best = [...recent].sort((x, y) => y.r.roi - x.r.roi).slice(0, 3);
  const total = recent.reduce((s, x) => s + x.r.reorders, 0), cost = recent.reduce((s, x) => s + x.t.cost, 0);
  const rep = (id: string) => REPS.find((r) => r.id === id)?.name;

  return (
    <div className="space-y-5">
      <Title sub="In-store tastings and what they bring back." action={<Button variant="primary" onClick={() => open({ kind: "logTasting" })}><Icon name="plus" size={18} />Log tasting</Button>}>Tastings</Title>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0 lg:grid-cols-4">
        <Tile label="Tastings, 12 months" value={recent.length} />
        <Tile label="Bottles sold at them" value={recent.reduce((s, x) => s + x.t.sold, 0)} />
        <Tile label="Reorders within 30 days" value={money(total)} tone="good" sub="From the same stores" />
        <Tile label="Return on cost" value={`${cost ? (total / cost).toFixed(1) : 0}×`} sub={`${money(cost)} in samples and time`} />
      </div>

      <section className="rounded-[12px] border-2 p-4" style={{ borderColor: BRANDS.mixers.color }}>
        <H>Best tastings by return</H>
        <ol className="space-y-2.5">
          {best.map(({ t, r }, i) => (
            <li key={t.id}>
              <button type="button" onClick={() => open({ kind: "tasting", id: t.id })} className="flex min-h-12 w-full items-center gap-3 text-left">
                <span className={`${NUM} w-6 shrink-0 text-[24px] leading-none`}>{i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold">{account(t.account).name}</span><span className="block text-[14px] text-(--d-muted)">{shortDay(t.date)}. {t.poured.map(productName).slice(0, 2).join(", ")}</span></span>
                <span className="shrink-0 text-right"><span className={`${NUM} block text-[22px] leading-none`}>{r.roi.toFixed(1)}×</span><span className="text-[13px] text-(--d-muted)">{money(r.reorders)}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <H>Coming up</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {upcoming.map((t) => <li key={t.id}><RowCard stripe={BRANDS[t.brand].color} title={account(t.account).name} meta={`${t.date === d.today ? "Today" : shortDay(t.date)}, ${t.time}. ${rep(t.rep)}. Pouring ${t.poured.map(productName).join(", ")}`} right={t.date === d.today ? <Chip tone="warn">Today</Chip> : null} onClick={() => open({ kind: "tasting", id: t.id })} /></li>)}
          {!upcoming.length ? <li className="text-(--d-muted)">Nothing booked.</li> : null}
        </ul>
      </section>

      <section>
        <H>Past tastings</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {past.slice(0, limit).map(({ t, r }) => (
            <li key={t.id}>
              <RowCard stripe={BRANDS[t.brand].color} title={account(t.account).name} meta={`${shortDay(t.date)}. ${rep(t.rep)}. ${t.sold} bottles sold, ${t.samples} samples used`}
                right={<Chip tone={r.roi >= 3 ? "good" : r.roi > 0 ? "neutral" : "bad"}>{r.roi > 0 ? `${r.roi.toFixed(1)}×` : "No reorder yet"}</Chip>}
                foot={<span className="text-[14px] text-(--d-muted)">Reorders next 30 days: <span className="font-semibold text-(--d-text)">{money(r.reorders)}</span></span>}
                onClick={() => open({ kind: "tasting", id: t.id })} />
            </li>
          ))}
        </ul>
        {past.length > limit ? <div className="mt-3 flex justify-center"><Button onClick={() => setLimit((l) => l + 12)}>Show more</Button></div> : null}
      </section>
    </div>
  );
}
