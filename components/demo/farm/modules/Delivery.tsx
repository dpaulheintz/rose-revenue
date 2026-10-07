"use client";

import { useMemo, useState } from "react";
import { addDays, weekday } from "@/lib/demo/dates";
import { dayDate, money, num } from "@/lib/demo/format";
import { coldPacks, openOrders, orderWeight, sum } from "@/lib/demo/farm/derive";
import type { Order } from "@/lib/demo/farm/types";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import { Avatar, Card, PageHeader, Pill, Stat } from "../../ui";
import { useFarm } from "../FarmProvider";
import { CustomerName } from "../bits";

type Route = { id: string; day: string; kind: "Home delivery" | "Pickup" | "Wholesale" | "Farm store"; title: string; driver: string | null; miles: number | null; orders: Order[] };

export default function Delivery() {
  const { ds, seed, sku, person } = useFarm();
  const [open, setOpen] = useState<Route | null>(null);
  const t = ds.anchor;
  const orders = useMemo(() => openOrders(ds), [ds]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, k) => addDays(t, k)), [t]);

  const routes = useMemo(() => {
    const out: Route[] = [];
    for (const d of days) {
      const today = orders.filter((o) => o.date === d);
      for (const z of seed.zones) {
        const os = today.filter((o) => o.channel === "delivery" && o.where === z.id);
        if (os.length) out.push({ id: `${d}-${z.id}`, day: d, kind: "Home delivery", title: z.name, driver: z.driver, miles: z.miles, orders: os });
      }
      const ws = today.filter((o) => o.channel === "wholesale");
      if (ws.length) out.push({ id: `${d}-w`, day: d, kind: "Wholesale", title: "Wholesale drops", driver: weekday(d) === 3 ? "owen" : "ben", miles: null, orders: ws });
      for (const s of seed.sites) {
        const os = today.filter((o) => o.channel === "pickup" && o.where === s.id);
        if (os.length) out.push({ id: `${d}-${s.id}`, day: d, kind: s.id === "s-farm" ? "Farm store" : "Pickup", title: s.name, driver: s.id === "s-farm" ? null : "owen", miles: null, orders: os });
      }
    }
    return out;
  }, [orders, seed, days]);

  const weight = (os: Order[]) => sum(os, (o) => orderWeight(o, sku));
  const packs = (os: Order[]) => sum(os, (o) => coldPacks(o, sku));
  const activeDays = days.filter((d) => routes.some((r) => r.day === d));
  const drivers = ["ben", "owen"].map((id) => ({ id, routes: routes.filter((r) => r.driver === id) }));

  return (
    <div className="space-y-5">
      <PageHeader title="Delivery" meta={`Next 7 days · ${dayDate(t)} – ${dayDate(addDays(t, 6))} · from GrazeCart orders + wholesale standing orders`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders to fulfil" value={num(orders.length)} sub={`${num(orders.filter((o) => o.channel === "delivery").length)} home deliveries`} />
        <Stat label="Routes + pickups" value={num(routes.length)} sub={`over ${activeDays.length} days`} />
        <Stat label="To pack" value={`${num(weight(orders))} lb`} sub={money(sum(orders, (o) => o.total))} />
        <Stat label="Cold packs" value={num(packs(orders))} sub="1 per 10 lb frozen, 15 lb chilled" />
      </div>

      <section aria-label="Route board">
        <div className="demo-scroll-x demo-snap -mx-4 flex gap-3 px-4 pb-3 sm:mx-0 sm:px-0">
          {activeDays.map((d) => {
            const rs = routes.filter((r) => r.day === d);
            return (
              <section key={d} aria-label={dayDate(d)} className="w-[84%] shrink-0 rounded-[20px] bg-(--d-panel2) p-3 sm:w-[300px]">
                <header className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="demo-display text-[18px]">{d === t ? "Today" : dayDate(d)}</h2>
                  <span className="text-[13px] text-(--d-muted)">{sum(rs, (r) => r.orders.length)} orders · {num(weight(rs.flatMap((r) => r.orders)))} lb</span>
                </header>
                <ul className="space-y-2">
                  {rs.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setOpen(r)} className="demo-card w-full p-3.5 text-left hover:border-(--d-accent)">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-semibold leading-snug">{r.title}</span>
                          <Pill tone={r.kind === "Home delivery" ? "accent" : r.kind === "Wholesale" ? "info" : "neutral"}>{r.kind}</Pill>
                        </span>
                        <span className="mt-1.5 grid grid-cols-3 gap-2 text-[13px]">
                          <span><span className="block text-(--d-muted)">{r.kind === "Home delivery" || r.kind === "Wholesale" ? "Stops" : "Orders"}</span><span className="font-semibold">{r.orders.length}</span></span>
                          <span><span className="block text-(--d-muted)">Weight</span><span className="font-semibold">{num(weight(r.orders))} lb</span></span>
                          <span><span className="block text-(--d-muted)">Cold packs</span><span className="font-semibold">{packs(r.orders)}</span></span>
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-[12.5px] text-(--d-muted)">
                          {r.driver ? <><Avatar name={person(r.driver).name} size={22} />{person(r.driver).name}</> : "Farm store counter"}
                          {r.miles ? <span className="ml-auto">{r.miles} mi loop</span> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <Card title="Drivers this week">
        <ul className="grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-2xl border border-(--d-line) p-4">
              <Avatar name={person(d.id).name} size={40} />
              <span className="min-w-0">
                <span className="block font-semibold">{person(d.id).name}</span>
                <span className="block text-[13px] text-(--d-muted)">{d.routes.length} runs · {sum(d.routes, (r) => r.orders.length)} stops · {num(weight(d.routes.flatMap((r) => r.orders)))} lb · {[...new Set(d.routes.map((r) => dayDate(r.day).slice(0, 3)))].join(", ")}</span>
              </span>
              <a href={`tel:${(person(d.id).phone ?? "").replace(/\D/g, "")}`} className="ml-auto grid size-12 shrink-0 place-items-center rounded-xl border border-(--d-line)" aria-label={`Call ${person(d.id).name}`}><Icon name="phone" /></a>
            </li>
          ))}
        </ul>
      </Card>

      <RouteDialog route={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function RouteDialog({ route, onClose }: { route: Route | null; onClose: () => void }) {
  const { sku, person, ds } = useFarm();
  if (!route) return <Dialog open={false} onClose={onClose} title="">{null}</Dialog>;
  const pack = new Map<string, number>();
  for (const o of route.orders) for (const l of o.lines) pack.set(l.sku, (pack.get(l.sku) ?? 0) + l.qty);
  const byTown = [...route.orders].sort((a, b) => town(a).localeCompare(town(b)));
  function town(o: Order) {
    if (o.account) return ds.accounts.find((a) => a.id === o.account)!.town;
    return o.customer ? ds.customers.find((c) => c.id === o.customer)!.town : "";
  }
  return (
    <Dialog open onClose={onClose} drawer title={route.title} subtitle={`${dayDate(route.day)} · ${route.kind}${route.driver ? ` · ${person(route.driver).name}` : ""}`}>
      <div className="space-y-6 text-[14px]">
        <section>
          <h3 className="font-semibold">{route.kind === "Home delivery" || route.kind === "Wholesale" ? "Stops" : "Orders"}</h3>
          <ol className="mt-2 divide-y divide-(--d-line)">
            {byTown.map((o, i) => (
              <li key={o.id} className="flex items-start gap-3 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--d-panel2) text-[12.5px] font-semibold">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold"><CustomerName order={o} /> <span className="font-normal text-(--d-muted)">· {town(o)}</span></span>
                  <span className="block text-[13px] text-(--d-muted)">{o.lines.map((l) => `${l.qty}× ${sku.get(l.sku)!.name}`).join(", ")}</span>
                </span>
                <span className="shrink-0 text-right text-[13px]"><span className="block font-semibold">{num(orderWeight(o, sku))} lb</span><span className="text-(--d-muted)">{coldPacks(o, sku)} packs</span></span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="font-semibold">Pack list</h3>
          <ul className="mt-2 divide-y divide-(--d-line)">
            {[...pack].sort((a, b) => b[1] - a[1]).map(([id, q]) => (
              <li key={id} className="flex justify-between gap-3 py-2">
                <span>{q} × {sku.get(id)!.name}</span>
                <span className="text-(--d-muted)">{sku.get(id)!.frozen ? "Freezer" : sku.get(id)!.source === "bakery" ? "Bakery" : "Cooler"} · {num(q * sku.get(id)!.lbs)} lb</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}
