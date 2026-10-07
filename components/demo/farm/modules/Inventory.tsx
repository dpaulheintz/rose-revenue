"use client";

import { useId, useMemo, useState } from "react";
import { diffDays } from "@/lib/demo/dates";
import { dayDate, money, moneyK, num, shortDate } from "@/lib/demo/format";
import { buildable, fmtDays, inventoryRows, nextRestock, sum, type InvRow } from "@/lib/demo/farm/derive";
import { useDemo } from "../../DemoProvider";
import Icon from "../../Icon";
import { Button, Card, FilterChip, Note, PageHeader, Pill, Segmented, Stat } from "../../ui";
import { useFarm } from "../FarmProvider";
import { StockPill } from "../bits";

const KIND = { beef: "Beef", pork: "Pork", lamb: "Lamb", broiler: "Broilers" } as const;

export default function Inventory() {
  const { ds, seed, sku } = useFarm();
  const { notify } = useDemo();
  const rows = useMemo(() => inventoryRows(ds, seed), [ds, seed]);
  const cats = useMemo(() => [...new Set(seed.skus.filter((s) => s.source !== "turkey" && s.source !== "tickets").map((s) => s.category))], [seed]);
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<"all" | "Low" | "Out">("all");
  const [q, setQ] = useState("");
  const searchId = useId();
  const shown = rows.filter((r) => (cat === "All" || r.s.category === cat) && (status === "all" || r.status === status) && (!q.trim() || r.s.name.toLowerCase().includes(q.trim().toLowerCase())));

  const t = ds.anchor;
  const out = rows.filter((r) => r.status === "Out").sort((a, b) => b.waitlist - a.waitlist);
  const low = rows.filter((r) => r.status === "Low");
  const freezer = sum(rows.filter((r) => r.s.frozen && !r.s.components), (r) => r.onHand * r.s.price);
  const incoming = ds.batches.filter((b) => b.back >= t && diffDays(b.back, t) <= 45);
  const incomingUnits = sum(incoming.filter((b) => diffDays(b.back, t) <= 21), (b) => sum(Object.values(b.yields), (n) => n));

  // Produce / reorder suggestions for anything low or out.
  const suggestions = useMemo(() => [...out, ...low].filter((r) => r.s.source !== "bakery").slice(0, 8).map((r) => ({ r, text: suggest(r, ds, sku) })), [out, low, ds, sku]);

  // Surplus box: what's well over par and slow to move.
  const surplus = rows
    .filter((r) => !r.s.components && r.s.par > 0 && r.free > r.s.par * 1.6 && (r.dos == null || r.dos > 30))
    .sort((a, b) => b.free / b.s.par - a.free / a.s.par)
    .slice(0, 6)
    .map((r) => ({ r, qty: Math.min(4, Math.max(1, Math.round(r.free / r.s.par))) }));
  const boxValue = sum(surplus, (x) => x.qty * x.r.s.price);

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" meta={`On hand as of last night's close · ${num(rows.length)} products · committed = already in this week's orders`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="In stock" value={num(rows.filter((r) => r.status === "In stock").length)} sub="products" tone="good" />
        <Stat label="Running low" value={num(low.length)} sub="below par or < 5 days" tone="warn" />
        <Stat label="Sold out" value={num(out.length)} sub={`${num(sum(out, (r) => r.waitlist))} customers asked`} tone="bad" />
        <Stat label="Freezer value" value={moneyK(freezer)} sub="at retail prices" />
        <Stat label="Coming in, 3 weeks" value={num(incomingUnits)} sub={`packages from ${incoming.filter((b) => diffDays(b.back, t) <= 21).length} batches`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Sold out: who's waiting">
          <ul className="grid gap-2 sm:grid-cols-2">
            {out.slice(0, 8).map((r) => {
              const n = nextRestock(ds, r.s);
              return (
                <li key={r.s.id} className="rounded-2xl border border-(--d-line) p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold leading-snug">{r.s.name}</span>
                    <Pill tone={r.waitlist ? "bad" : "neutral"}>{r.waitlist} waiting</Pill>
                  </div>
                  <p className="mt-1 text-[13px] text-(--d-muted)">{n ? `Back ${fmtDays(diffDays(n.date, t))} · ${n.from}` : r.s.components ? `Short on ${shortComponent(r, ds, sku)}` : "No restock scheduled"}</p>
                </li>
              );
            })}
            {!out.length ? <li className="text-(--d-muted)">Nothing sold out right now.</li> : null}
          </ul>
          <Note>Waiting = customers who tried to order it in the last 30 days and couldn&apos;t. The real version emails them through Drip when it&apos;s back.</Note>
        </Card>
        <Card className="lg:col-span-5" title="What to make or reorder">
          <ul className="space-y-2.5">
            {suggestions.map(({ r, text }) => (
              <li key={r.s.id} className="flex gap-3">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${r.status === "Out" ? "bg-(--d-bad)" : "bg-(--d-warn)"}`} aria-hidden="true" />
                <span className="text-[14px]"><span className="font-semibold">{r.s.name}.</span> <span className="text-(--d-muted)">{text}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* The full list. */}
      <section aria-label="All products" className="space-y-3">
        <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
          {["All", ...cats].map((c) => (
            <FilterChip key={c} on={cat === c} onClick={() => setCat(c)} count={c === "All" ? rows.length : rows.filter((r) => r.s.category === c).length}>{c}</FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-56">
            <label htmlFor={searchId} className="sr-only">Search products</label>
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
            <input id={searchId} className="demo-input pl-10" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Segmented label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "Low", label: `Low (${low.length})` }, { value: "Out", label: `Out (${out.length})` }]} />
        </div>

        <ul className="space-y-2 md:hidden">
          {shown.map((r) => (
            <li key={r.s.id} className="demo-card p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold">{r.s.name}</span>
                  <span className="block text-[12.5px] text-(--d-muted)">{r.s.unit}{r.s.perLb ? ` · ${money(r.s.perLb)}/lb` : ` · ${money(r.s.price)}`}</span>
                </span>
                <StockPill status={r.status} />
              </div>
              <dl className="mt-2 grid grid-cols-4 gap-2 text-[13px]">
                <div><dt className="text-(--d-muted)">On hand</dt><dd className="font-semibold">{num(r.onHand)}</dd></div>
                <div><dt className="text-(--d-muted)">Free</dt><dd className="font-semibold">{num(r.free)}</dd></div>
                <div><dt className="text-(--d-muted)">Par</dt><dd>{r.s.par || "—"}</dd></div>
                <div><dt className="text-(--d-muted)">Days left</dt><dd>{dos(r)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="demo-card demo-scroll-x hidden md:block">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 text-right font-semibold">On hand</th>
                <th className="px-3 py-3 text-right font-semibold">Committed</th>
                <th className="px-3 py-3 text-right font-semibold">Free</th>
                <th className="px-3 py-3 text-right font-semibold">Par</th>
                <th className="px-3 py-3 text-right font-semibold">Days of supply</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.s.id} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2.5"><span className="font-semibold">{r.s.name}</span><span className="block text-[12.5px] text-(--d-muted)">{r.s.unit}{r.s.perLb ? ` · ${money(r.s.perLb)}/lb` : ` · ${money(r.s.price)}`}</span></td>
                  <td className="px-3 py-2.5 text-(--d-muted)">{r.s.category}</td>
                  <td className="px-3 py-2.5 text-right">{num(r.onHand)}</td>
                  <td className="px-3 py-2.5 text-right text-(--d-muted)">{r.committed ? num(r.committed) : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{num(r.free)}</td>
                  <td className="px-3 py-2.5 text-right">{r.s.par || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{dos(r)}</td>
                  <td className="px-4 py-2.5"><StockPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length ? <p className="text-(--d-muted)">No products match.</p> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Incoming processing batches">
          <ul className="space-y-3">
            {incoming.map((b) => (
              <li key={b.id} className="rounded-2xl border border-(--d-line) p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{KIND[b.kind]} · <span className="demo-mono text-[13px]">{b.lot}</span></p>
                  <p className="text-[13px] text-(--d-muted)">{b.kill <= t ? "Processed" : "Processing"} {shortDate(b.kill)} → in the freezer {dayDate(b.back)}</p>
                </div>
                <p className="mt-1 text-[13px] text-(--d-muted)">{b.kind === "broiler" ? `${num(b.head)} birds` : `${b.head} head${b.kind === "beef" ? ` · tags ${b.animals.join(", ")}` : ""}`} · {b.kind === "broiler" ? "on-farm processing" : seed.processor.name}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(b.yields).filter(([, n]) => n > 0).map(([id, n]) => <li key={id}><Pill>{num(n)} {sku.get(id)!.name.toLowerCase()}</Pill></li>)}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-5" title="Surplus box">
          <p className="text-[14px] text-(--d-muted)">Slow movers over par, bundled at 15% off. Good for a Drip email or the farm store counter.</p>
          <ul className="mt-3 divide-y divide-(--d-line)">
            {surplus.map(({ r, qty }) => (
              <li key={r.s.id} className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-[14px]">
                <span>{qty} × {r.s.name}</span>
                <span className="text-(--d-muted)">{num(r.free)} free · par {r.s.par}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[14px] text-(--d-muted)">Box value <s>{money(boxValue)}</s></span>
            <span className="demo-display text-[24px]">{money(boxValue * 0.85)}</span>
          </div>
          <Button variant="primary" className="mt-3 w-full" onClick={() => notify()} disabled={!surplus.length}>
            <Icon name="box" size={18} />Build a surplus box
          </Button>
        </Card>
      </div>
    </div>
  );
}

function dos(r: InvRow) {
  if (r.s.source === "bakery") return "Baked daily";
  if (r.dos == null) return "—";
  return r.dos > 99 ? "99+" : num(r.dos);
}

function shortComponent(r: InvRow, ds: ReturnType<typeof useFarm>["ds"], sku: Map<string, { name: string }>) {
  const comps = Object.entries(r.s.components ?? {}).map(([id, q]) => ({ id, can: Math.floor(Math.max(0, (ds.stock[id] ?? 0) - (ds.committed[id] ?? 0)) / q) }));
  const worst = comps.sort((a, b) => a.can - b.can)[0];
  return worst ? sku.get(worst.id)!.name.toLowerCase() : "parts";
}

function suggest(r: InvRow, ds: ReturnType<typeof useFarm>["ds"], sku: Map<string, { name: string }>) {
  const t = ds.anchor;
  if (r.s.components) {
    const can = buildable(ds, r.s);
    return can ? `${can} can be built from what's free.` : `Short on ${shortComponent(r, ds, sku)}; builds again when the next beef lot is back.`;
  }
  const n = nextRestock(ds, r.s);
  switch (r.s.source) {
    case "beef":
    case "pork":
    case "lamb":
    case "broiler":
      if (!n) return "Nothing scheduled. Book a processing slot.";
      return diffDays(n.date, t) > 21 ? `Next lot isn't back until ${shortDate(n.date)} (+${num(n.qty)}). Consider an earlier slot.` : `${n.from} adds ${num(n.qty)} on ${shortDate(n.date)}.`;
    case "cheese":
      return n ? `${num(n.qty)} blocks come off aging ${fmtDays(diffDays(n.date, t))}.` : "Nothing aging. Schedule a make.";
    case "butter":
      return `Churn ${n ? dayDate(n.date) : "next"}: about ${num(n?.qty ?? 0)} units. Demand runs ahead of cream all fall.`;
    case "broth":
      return `Next broth batch ${n ? dayDate(n.date) : "Monday"} adds ${num(n?.qty ?? 84)} quarts. ${num(ds.stock["beef-bones"])} soup bones on hand.`;
    case "partner":
      return n ? `Partner delivery due ${shortDate(n.date)}. Ask for ${num(Math.round(r.s.par * 1.5))}.` : "Reorder from the partner.";
    case "eggs":
      return "Hold wholesale eggs back a day.";
    default:
      return n ? `Restocks ${fmtDays(diffDays(n.date, t))}.` : "Check the plan.";
  }
}

