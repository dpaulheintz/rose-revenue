"use client";

import { useId, useMemo, useState } from "react";
import { addDays, diffDays, weekday } from "@/lib/demo/dates";
import { dayDate, money, moneyK, num, shortDate } from "@/lib/demo/format";
import { CHANNELS, fmtDays, sum, type CustomerStats } from "@/lib/demo/farm/derive";
import type { Account, Visit } from "@/lib/demo/farm/types";
import { useDemo } from "../../DemoProvider";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import { Avatar, Button, Card, Field, FilterChip, PageHeader, Pill, Stat, Tabs } from "../../ui";
import { useFarm } from "../FarmProvider";
import { useWhere } from "../bits";

type Tab = "customers" | "herdshare" | "wholesale";
type Seg = "All" | CustomerStats["segments"][number];
const SEGS: Seg[] = ["All", "Herdshare owner", "Freezer-bundle buyer", "Lapsed 30+", "New"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CH = Object.fromEntries(CHANNELS.map((c) => [c.key, c.label]));

export default function Customers() {
  const { ds, stats } = useFarm();
  const [tab, setTab] = useState<Tab>("customers");
  const owners = ds.customers.filter((c) => c.herdshare && !c.stoppedOn).length;
  return (
    <div>
      <PageHeader title="Customers" meta={`${num(ds.customers.length)} customers · ${owners} herdshare owners · ${ds.accounts.length} wholesale accounts. Imported from GrazeCart.`} />
      <Tabs
        label="Customer views"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "customers", label: "Customers", count: stats.size },
          { value: "herdshare", label: "Herdshare", count: owners },
          { value: "wholesale", label: "Wholesale", count: ds.accounts.length },
        ]}
      />
      {tab === "customers" ? <CustomerList /> : tab === "herdshare" ? <Herdshare /> : <Wholesale />}
    </div>
  );
}

/* ------------------------------ customers ----------------------------- */

function dueLabel(s: CustomerStats, today: string) {
  if (s.next) return { text: `Scheduled ${shortDate(s.next)}`, tone: "good" as const };
  if (!s.due) return { text: "No orders yet", tone: "neutral" as const };
  const d = diffDays(s.due, today);
  if (d < -45) return { text: "Lapsed", tone: "neutral" as const };
  if (d < 0) return { text: `Overdue ${-d}d`, tone: "bad" as const };
  if (d <= 3) return { text: "Due now", tone: "warn" as const };
  return { text: `In ${d} days`, tone: "neutral" as const };
}

function CustomerList() {
  const { ds, stats } = useFarm();
  const [seg, setSeg] = useState<Seg>("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"ltv" | "last" | "due" | "name">("ltv");
  const [limit, setLimit] = useState(40);
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => [...stats.values()], [stats]);
  const counts = useMemo(() => Object.fromEntries(SEGS.map((s) => [s, s === "All" ? all.length : all.filter((x) => x.segments.includes(s as never)).length])), [all]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = all.filter((x) => (seg === "All" || x.segments.includes(seg as never)) && (!needle || `${x.c.name} ${x.c.town} ${x.c.email}`.toLowerCase().includes(needle)));
    const key = (x: CustomerStats) => (sort === "ltv" ? -x.ltv : sort === "last" ? -(x.last ? Date.parse(x.last) : 0) : sort === "due" ? (x.next ? 9e15 : x.due ? Date.parse(x.due) : 8e15) : 0);
    return r.sort((a, b) => (sort === "name" ? a.c.last.localeCompare(b.c.last) : key(a) - key(b)));
  }, [all, seg, q, sort]);
  const searchId = useId();

  return (
    <>
      <div className="demo-scroll-x -mx-4 mb-3 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {SEGS.map((s) => (
          <FilterChip key={s} on={seg === s} onClick={() => { setSeg(s); setLimit(40); }} count={counts[s]}>{s === "All" ? "All customers" : s}</FilterChip>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <label htmlFor={searchId} className="sr-only">Search customers</label>
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
          <input id={searchId} className="demo-input pl-10" placeholder="Search name, town or email" value={q} onChange={(e) => { setQ(e.target.value); setLimit(40); }} />
        </div>
        <Field label="Sort by" className="w-48">
          <select className="demo-input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="ltv">Lifetime value</option>
            <option value="last">Last order</option>
            <option value="due">Reorder due</option>
            <option value="name">Last name</option>
          </select>
        </Field>
      </div>
      <p className="mb-2 text-[13px] text-(--d-muted)" aria-live="polite">{num(rows.length)} {rows.length === 1 ? "customer" : "customers"}</p>

      {/* Phone: cards. */}
      <ul className="space-y-2 md:hidden">
        {rows.slice(0, limit).map((x) => {
          const due = dueLabel(x, ds.anchor);
          return (
            <li key={x.c.id}>
              <button type="button" onClick={() => setOpen(x.c.id)} className="demo-card flex w-full items-start gap-3 p-4 text-left">
                <Avatar name={x.c.name} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{x.c.name}</span>
                    <span className="shrink-0 font-semibold">{money(x.ltv)}</span>
                  </span>
                  <span className="block text-[13px] text-(--d-muted)">{x.c.town} · {x.count} orders · last {x.last ? shortDate(x.last) : "—"}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {x.segments.map((s) => <Pill key={s} tone={segTone(s)}>{s}</Pill>)}
                    <Pill tone={due.tone}>{due.text}</Pill>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Tablet + desktop: table. */}
      <div className="demo-card demo-scroll-x hidden md:block">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="text-[12.5px] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Segments</th>
              <th className="px-3 py-3 text-right font-semibold">Orders</th>
              <th className="px-3 py-3 text-right font-semibold">Lifetime value</th>
              <th className="px-3 py-3 font-semibold">Last order</th>
              <th className="px-4 py-3 font-semibold">Reorder</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((x) => {
              const due = dueLabel(x, ds.anchor);
              return (
                <tr key={x.c.id} className="border-b border-(--d-line) last:border-0 hover:bg-(--d-panel2)/60">
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => setOpen(x.c.id)} className="flex min-h-12 items-center gap-3 text-left">
                      <Avatar name={x.c.name} size={34} />
                      <span>
                        <span className="block font-semibold underline-offset-2 hover:underline">{x.c.name}</span>
                        <span className="block text-[12.5px] text-(--d-muted)">{x.c.town}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2"><span className="flex flex-wrap gap-1">{x.segments.length ? x.segments.map((s) => <Pill key={s} tone={segTone(s)}>{s}</Pill>) : <span className="text-(--d-muted)">—</span>}</span></td>
                  <td className="px-3 py-2 text-right">{x.count}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(x.ltv)}</td>
                  <td className="px-3 py-2">{x.last ? shortDate(x.last) : "—"}</td>
                  <td className="px-4 py-2"><Pill tone={due.tone}>{due.text}</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > limit ? (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => setLimit((l) => l + 40)}>Show 40 more</Button>
        </div>
      ) : null}
      <CustomerDrawer id={open} onClose={() => setOpen(null)} />
    </>
  );
}

const segTone = (s: string) => (s === "Herdshare owner" ? "accent" : s === "Freezer-bundle buyer" ? "info" : s === "Lapsed 30+" ? "warn" : "good") as "accent" | "info" | "warn" | "good";

function draftFor(x: CustomerStats, skuName: (id: string) => string, today: string) {
  const fav = x.favs[0] ? skuName(x.favs[0].sku).toLowerCase() : "the usual";
  if (x.segments.includes("Lapsed 30+")) return `Hi ${x.c.first}, it's been a little while since your last order, so I wanted to say hello from the farm. Fall freezer bundles are back, and we've got fresh ${fav} this week. Want me to set one aside for your next ${x.c.channel === "delivery" ? "delivery" : "pickup"}?`;
  const due = x.due ? diffDays(x.due, today) : 99;
  if (due <= 3) return `Hi ${x.c.first}, you usually stock up about now. Should I put together your regular order with ${fav}? Reply here and it'll be on the next ${x.c.channel === "delivery" ? "route" : "pickup"}.`;
  return `Hi ${x.c.first}, thanks for being a Sweet Grass customer. Quick heads-up: ${fav} is in stock this week if you'd like to add it to your next order.`;
}

function CustomerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { ds, stats, sku, notes, addNote } = useFarm();
  const { notify } = useDemo();
  const where = useWhere();
  const x = id ? stats.get(id) : null;
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const noteId = useId();
  const draftId = useId();
  const close = () => { setNote(""); setDraft(null); onClose(); };
  if (!x) return <Dialog open={false} onClose={onClose} title="" drawer>{null}</Dialog>;
  const name = (s: string) => sku.get(s)?.name ?? s;
  const due = dueLabel(x, ds.anchor);
  const past = x.orders.filter((o) => !o.open);
  const h = x.c.herdshare;
  return (
    <Dialog
      open={!!x}
      onClose={close}
      drawer
      title={x.c.name}
      subtitle={<span className="flex flex-wrap gap-1">{x.segments.map((s) => <Pill key={s} tone={segTone(s)}>{s}</Pill>)}<Pill tone={due.tone}>{due.text}</Pill></span>}
      footer={draft == null ? <Button variant="primary" onClick={() => setDraft(draftFor(x, name, ds.anchor))}><Icon name="mail" size={18} />Message {x.c.first}</Button> : undefined}
    >
      <div className="space-y-6">
        {draft != null ? (
          <section aria-labelledby={draftId} className="rounded-2xl border-2 border-(--d-accent) p-4">
            <h3 id={draftId} className="font-semibold">Draft message</h3>
            <p className="text-[12.5px] text-(--d-muted)">Written from their history. Edit it, then send through Drip.</p>
            <textarea aria-label="Message text" className="demo-input mt-3 min-h-36" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button onClick={() => setDraft(null)}>Discard</Button>
              <Button variant="primary" onClick={() => { setDraft(null); notify(); }}>Send with Drip</Button>
            </div>
          </section>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
          <div><dt className="text-[12.5px] text-(--d-muted)">Lifetime value</dt><dd className="demo-display text-[22px]">{money(x.ltv)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Last 12 months</dt><dd className="demo-display text-[22px]">{money(x.spend)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Orders</dt><dd>{x.count} · avg {money(x.count ? x.spend / x.count : 0)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Customer since</dt><dd>{shortDate(x.c.joined)} {x.c.joined.slice(0, 4)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Phone</dt><dd><a className="inline-flex min-h-11 items-center text-(--d-accent) underline underline-offset-2" href={`tel:${x.c.phone.replace(/\D/g, "")}`}>{x.c.phone}</a></dd></div>
          <div className="min-w-0"><dt className="text-[12.5px] text-(--d-muted)">Email</dt><dd className="truncate">{x.c.email}</dd></div>
          <div className="col-span-2"><dt className="text-[12.5px] text-(--d-muted)">Gets orders by</dt><dd>{x.c.channel === "delivery" ? "Home delivery" : "Pickup"}: {where(x.c.where)} ({x.c.town})</dd></div>
        </dl>

        {h ? (
          <section className="rounded-2xl bg-(--d-panel2) p-4 text-[14px]">
            <h3 className="font-semibold">Herdshare</h3>
            <p className="mt-1 text-(--d-muted)">{h.shares} share{h.shares > 1 ? "s" : ""} · {h.gallons} gal/week at {where(h.site)} · renews {shortDate(h.renews)}</p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone={h.agreement ? "good" : "bad"}>{h.agreement ? "Agreement on file" : "Agreement missing"}</Pill>
              <Pill tone={h.fee === "Paid" ? "good" : h.fee === "Due" ? "warn" : "bad"}>Boarding fee: {h.fee}</Pill>
            </p>
          </section>
        ) : null}

        <section>
          <h3 className="font-semibold">Favorites</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {x.favs.length ? x.favs.map((f) => <li key={f.sku}><Pill>{name(f.sku)} · {f.units}</Pill></li>) : <li className="text-(--d-muted)">No orders in the last year.</li>}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold">Notes</h3>
          <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addNote(x.c.id, note.trim()); setNote(""); } }} className="mt-2 flex gap-2">
            <label htmlFor={noteId} className="sr-only">Add a note</label>
            <input id={noteId} className="demo-input" placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" disabled={!note.trim()}>Add</Button>
          </form>
          <ul className="mt-2 space-y-1.5 text-[14px]">
            {(notes[x.c.id] ?? []).map((n, i) => <li key={i} className="rounded-xl bg-(--d-panel2) px-3 py-2">{n.text} <span className="text-[12px] text-(--d-muted)">· you, today</span></li>)}
            {x.c.note ? <li className="rounded-xl bg-(--d-panel2) px-3 py-2">{x.c.note} <span className="text-[12px] text-(--d-muted)">· from GrazeCart</span></li> : null}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold">Order history</h3>
          <ul className="mt-2 divide-y divide-(--d-line)">
            {x.orders.slice(0, 10).map((o) => (
              <li key={o.id} className="py-2.5 text-[14px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{dayDate(o.date)} <span className="font-normal text-(--d-muted)">· #{o.no} · {CH[o.channel]}</span></span>
                  <span className="shrink-0 font-semibold">{money(o.total)}</span>
                </div>
                <p className="text-[13px] text-(--d-muted)">{o.open ? <Pill tone="good" className="mr-1.5">Scheduled</Pill> : null}{o.lines.map((l) => `${l.qty}× ${name(l.sku)}`).join(", ")}</p>
              </li>
            ))}
            {!past.length && !x.orders.length ? <li className="py-2 text-(--d-muted)">No orders yet.</li> : null}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}

/* ------------------------------ herdshare ----------------------------- */

function Herdshare() {
  const { ds, seed } = useFarm();
  const where = useWhere();
  const [filter, setFilter] = useState<"all" | "agreement" | "fees" | "renew">("all");
  const owners = ds.customers.filter((c) => c.herdshare && !c.stoppedOn);
  const t = ds.anchor;
  const renewSoon = (r: string) => diffDays(r, t) <= 30;
  const list = owners
    .filter((c) => filter === "all" || (filter === "agreement" && !c.herdshare!.agreement) || (filter === "fees" && c.herdshare!.fee !== "Paid") || (filter === "renew" && renewSoon(c.herdshare!.renews)))
    .sort((a, b) => (a.herdshare!.renews < b.herdshare!.renews ? -1 : 1));
  const gallons = sum(owners, (c) => c.herdshare!.gallons);
  const bySite = seed.sites.map((site) => {
    const here = owners.filter((c) => c.herdshare!.site === site.id);
    return { site, n: here.length, g: sum(here, (c) => c.herdshare!.gallons) };
  });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active owners" value={num(owners.length)} sub={`${num(sum(owners, (c) => c.herdshare!.shares))} shares`} />
        <Stat label="Milk per week" value={`${num(gallons)} gal`} sub={`${moneyK(gallons * 11 * 52 / 12)}/mo in boarding fees`} />
        <Stat label="Agreements missing" value={num(owners.filter((c) => !c.herdshare!.agreement).length)} sub="No pickup without one" tone="bad" />
        <Stat label="Renewing in 30 days" value={num(owners.filter((c) => renewSoon(c.herdshare!.renews)).length)} sub={`${owners.filter((c) => c.herdshare!.fee !== "Paid").length} with fees due or past due`} tone="warn" />
      </div>
      <Card title="Pickups by location">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {bySite.map((b) => (
            <li key={b.site.id} className="rounded-2xl border border-(--d-line) px-4 py-3">
              <p className="font-semibold">{b.site.name}</p>
              <p className="text-[13px] text-(--d-muted)">{b.n} owners · {b.g} gal · {DAYS[b.site.day]}s</p>
            </li>
          ))}
        </ul>
      </Card>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip on={filter === "all"} onClick={() => setFilter("all")} count={owners.length}>All owners</FilterChip>
        <FilterChip on={filter === "agreement"} onClick={() => setFilter("agreement")} count={owners.filter((c) => !c.herdshare!.agreement).length}>Agreement missing</FilterChip>
        <FilterChip on={filter === "fees"} onClick={() => setFilter("fees")} count={owners.filter((c) => c.herdshare!.fee !== "Paid").length}>Fees due</FilterChip>
        <FilterChip on={filter === "renew"} onClick={() => setFilter("renew")} count={owners.filter((c) => renewSoon(c.herdshare!.renews)).length}>Renewing soon</FilterChip>
      </div>
      <div className="demo-card demo-scroll-x">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="text-[12.5px] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-3 py-3 font-semibold">Agreement</th>
              <th className="px-3 py-3 font-semibold">Boarding fee</th>
              <th className="px-3 py-3 font-semibold">Pickup</th>
              <th className="px-3 py-3 text-right font-semibold">Gal/week</th>
              <th className="px-4 py-3 font-semibold">Renews</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const h = c.herdshare!;
              const d = diffDays(h.renews, t);
              return (
                <tr key={c.id} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-2.5"><span className="font-semibold">{c.name}</span><span className="block text-[12.5px] text-(--d-muted)">{h.shares} share{h.shares > 1 ? "s" : ""} · since {h.since.slice(0, 4)}</span></td>
                  <td className="px-3 py-2.5"><Pill tone={h.agreement ? "good" : "bad"}>{h.agreement ? "On file" : "Missing"}</Pill></td>
                  <td className="px-3 py-2.5"><Pill tone={h.fee === "Paid" ? "good" : h.fee === "Due" ? "warn" : "bad"}>{h.fee}</Pill></td>
                  <td className="px-3 py-2.5">{where(h.site)}</td>
                  <td className="px-3 py-2.5 text-right">{h.gallons}</td>
                  <td className="px-4 py-2.5">{shortDate(h.renews)} <span className={`text-[12.5px] ${d < 0 ? "font-semibold text-(--d-bad)" : d <= 30 ? "text-(--d-warn)" : "text-(--d-muted)"}`}>{d < 0 ? `${-d}d overdue` : fmtDays(d)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ wholesale ----------------------------- */

function nextDelivery(a: Account, ds: ReturnType<typeof useFarm>["ds"]) {
  if (a.stoppedOn) return null;
  const open = ds.orders.find((o) => o.open && o.account === a.id);
  if (open) return open.date;
  let d = ds.anchor;
  while (weekday(d) !== a.day) d = addDays(d, 1);
  return d;
}

function Wholesale() {
  const { ds, visits, person } = useFarm();
  const [open, setOpen] = useState<string | null>(null);
  const rev = useMemo(() => new Map(ds.accounts.map((a) => [a.id, sum(ds.orders.filter((o) => !o.open && o.account === a.id), (o) => o.total)])), [ds]);
  const rows = [...ds.accounts].sort((a, b) => rev.get(b.id)! - rev.get(a.id)!);
  return (
    <>
      <div className="demo-card demo-scroll-x">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead className="text-[12.5px] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-3 py-3 font-semibold">Contact</th>
              <th className="px-3 py-3 font-semibold">Standing order</th>
              <th className="px-3 py-3 font-semibold">Last visit</th>
              <th className="px-3 py-3 font-semibold">Next delivery</th>
              <th className="px-4 py-3 text-right font-semibold">12 months</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const last = visits.find((v) => v.account === a.id);
              const next = nextDelivery(a, ds);
              return (
                <tr key={a.id} className="border-b border-(--d-line) last:border-0 hover:bg-(--d-panel2)/60">
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => setOpen(a.id)} className="min-h-12 text-left">
                      <span className="block font-semibold underline-offset-2 hover:underline">{a.name}</span>
                      <span className="block text-[12.5px] text-(--d-muted)">{a.type} · {a.town}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2">{a.contact}<span className="block text-[12.5px] text-(--d-muted)">{a.phone}</span></td>
                  <td className="px-3 py-2">{a.every === 1 ? "Weekly" : "Every 2 weeks"}, {DAYS[a.day]}<span className="block text-[12.5px] text-(--d-muted)">{Object.keys(a.standing).length} items</span></td>
                  <td className="px-3 py-2">{last ? <>{shortDate(last.date)}<span className="block text-[12.5px] text-(--d-muted)">{last.kind} · {person(last.by).name.split(" ")[0]}</span></> : "—"}</td>
                  <td className="px-3 py-2">{next ? dayDate(next) : <Pill tone="warn">Paused {shortDate(a.stoppedOn!)}</Pill>}</td>
                  <td className="px-4 py-2 text-right font-semibold">{moneyK(rev.get(a.id)!)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AccountDrawer id={open} onClose={() => setOpen(null)} />
    </>
  );
}

function AccountDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { ds, sku, visits, logVisit, person, seed } = useFarm();
  const a = id ? ds.accounts.find((x) => x.id === id) : null;
  const [logging, setLogging] = useState(false);
  const [kind, setKind] = useState<Visit["kind"]>("Visit");
  const [by, setBy] = useState("owen");
  const [note, setNote] = useState("");
  const formId = useId();
  if (!a) return <Dialog open={false} onClose={onClose} title="" drawer>{null}</Dialog>;
  const log = visits.filter((v) => v.account === a.id);
  const deliveries = ds.orders.filter((o) => o.account === a.id).sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 6);
  const next = nextDelivery(a, ds);
  const close = () => { setLogging(false); setNote(""); onClose(); };
  return (
    <Dialog
      open
      drawer
      onClose={close}
      title={a.name}
      subtitle={`${a.type} · ${a.town} · ${a.every === 1 ? "weekly" : "every 2 weeks"} on ${DAYS[a.day]}s`}
      footer={logging
        ? <><Button onClick={() => setLogging(false)}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Save visit</Button></>
        : <Button variant="primary" onClick={() => setLogging(true)}><Icon name="plus" size={18} />Log a visit</Button>}
    >
      <div className="space-y-6 text-[14px]">
        {logging ? (
          <form id={formId} onSubmit={(e) => { e.preventDefault(); logVisit({ account: a.id, date: ds.anchor, by, kind, note: note.trim() || `${kind} logged.` }); setLogging(false); setNote(""); }} className="grid gap-3 rounded-2xl border-2 border-(--d-accent) p-4 sm:grid-cols-2">
            <Field label="Type">
              <select className="demo-input" value={kind} onChange={(e) => setKind(e.target.value as Visit["kind"])}>
                {(["Visit", "Call", "Tasting", "Delivery"] as const).map((k) => <option key={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Who">
              <select className="demo-input" value={by} onChange={(e) => setBy(e.target.value)}>
                {seed.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea className="demo-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, what they need" />
            </Field>
          </form>
        ) : null}
        <dl className="grid grid-cols-2 gap-3">
          <div><dt className="text-[12.5px] text-(--d-muted)">Contact</dt><dd className="font-semibold">{a.contact}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Phone</dt><dd><a className="inline-flex min-h-11 items-center text-(--d-accent) underline underline-offset-2" href={`tel:${a.phone.replace(/\D/g, "")}`}>{a.phone}</a></dd></div>
          <div className="col-span-2 min-w-0"><dt className="text-[12.5px] text-(--d-muted)">Email</dt><dd className="truncate">{a.email}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Next delivery</dt><dd>{next ? dayDate(next) : `Paused since ${shortDate(a.stoppedOn!)}`}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Account opened</dt><dd>{shortDate(a.opened)} {a.opened.slice(0, 4)}</dd></div>
        </dl>
        <section>
          <h3 className="font-semibold">Standing order</h3>
          <ul className="mt-2 divide-y divide-(--d-line)">
            {Object.entries(a.standing).map(([s, q]) => (
              <li key={s} className="flex justify-between gap-3 py-2"><span>{q} × {sku.get(s)?.name}</span><span className="text-(--d-muted)">{money(q * sku.get(s)!.price * 0.75)}</span></li>
            ))}
          </ul>
          <p className="mt-1 text-[12.5px] text-(--d-muted)">Wholesale pricing: 25% off retail.</p>
        </section>
        <section>
          <h3 className="font-semibold">Visit log</h3>
          <ul className="mt-2 space-y-2">
            {log.slice(0, 8).map((v) => (
              <li key={v.id} className="rounded-xl bg-(--d-panel2) px-3 py-2">
                <p className="font-semibold">{v.kind} · {shortDate(v.date)} <span className="font-normal text-(--d-muted)">· {person(v.by).name}</span></p>
                <p className="text-(--d-muted)">{v.note}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Recent deliveries</h3>
          <ul className="mt-2 divide-y divide-(--d-line)">
            {deliveries.map((o) => (
              <li key={o.id} className="flex justify-between gap-3 py-2"><span>{dayDate(o.date)} {o.open ? <Pill tone="good">Scheduled</Pill> : null}</span><span className="font-semibold">{money(o.total)}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}
