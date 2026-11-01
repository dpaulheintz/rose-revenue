"use client";

import { useMemo } from "react";
import { customerStats, shortDay } from "@demos/buckeye/derive";
import type { Customer } from "@demos/buckeye/data";
import { industry as ind } from "@demos/buckeye/industry";
import { ListWithDetail } from "@demos/kit/blocks/ListWithDetail";
import { moneyK, usd } from "@demos/kit/data/format";
import Icon from "@demos/kit/ui/Icon";
import { Button, PageHeader, Pill } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { Num, StatusPill, v } from "@demos/buckeye/parts/bits";

export default function Customers() {
  const { shop, k, openJob, notify } = useShop();
  const stats = useMemo(() => new Map(shop.customers.map((c) => [c.id, customerStats(shop, c, k.open)])), [shop, k.open]);
  const s = (c: Customer) => stats.get(c.id)!;
  const rows = [...shop.customers].sort((a, b) => s(b).lifetime - s(a).lifetime);
  const dueCount = rows.filter((c) => s(c).dueToReorder).length;

  return (
    <div>
      <PageHeader title="Customers" meta={`${shop.customers.length} accounts. ${dueCount} about due to reorder with nothing open.`} />
      <ListWithDetail
        rows={rows} getKey={(c) => c.id} minWidth={860}
        searchText={(c) => `${c.name} ${c.city} ${c.contacts.map((x) => x.name).join(" ")}`}
        searchLabel="Search accounts" searchPlaceholder="Search name, city or contact"
        filters={[...ind.customerTypes.map((t) => ({ id: t, label: t, test: (c: Customer) => c.type === t })), { id: "due", label: "Due to reorder", test: (c: Customer) => s(c).dueToReorder }]}
        columns={[
          { key: "n", header: "Account", primary: true, cell: (c) => <>{c.name}<span className="block text-[12.5px] font-normal text-(--d-muted)">{c.type} · {c.city}</span></> },
          { key: "o", header: "Open", align: "right", cell: (c) => s(c).open.length },
          { key: "l", header: "Lifetime", align: "right", cell: (c) => moneyK(s(c).lifetime) },
          { key: "t", header: "On-time", align: "right", cell: (c) => `${s(c).onTime}%` },
          { key: "v", header: "Last visit", cell: (c) => (s(c).lastVisit ? shortDay(s(c).lastVisit!) : "None") },
          { key: "r", header: "Reorder", cell: (c) => (s(c).dueToReorder ? <Pill tone="warn">Due {shortDay(s(c).nextOrder!)}</Pill> : s(c).nextOrder ? shortDay(s(c).nextOrder!) : "None") },
        ]}
        card={(c) => (
          <>
            <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block font-semibold">{c.name}</span><span className="block text-[13px] text-(--d-muted)">{c.type} · {c.city}</span></span>{s(c).dueToReorder ? <Pill tone="warn">Reorder due</Pill> : null}</span>
            <span className="mt-2 grid grid-cols-3 gap-2 text-[13px]"><span><span className="block text-(--d-muted)">Open</span>{s(c).open.length}</span><span><span className="block text-(--d-muted)">Lifetime</span>{moneyK(s(c).lifetime)}</span><span><span className="block text-(--d-muted)">On-time</span>{s(c).onTime}%</span></span>
          </>
        )}
        title={(c) => c.name}
        subtitle={(c) => `${c.type} · ${c.address} · Net ${c.terms}`}
        footer={() => <Button variant="primary" onClick={() => notify()}>Log a visit</Button>}
        detail={(c) => {
          const d = s(c);
          return (
            <div className="space-y-5 text-[14px]">
              <dl className="grid grid-cols-2 gap-3 *:min-w-0 sm:grid-cols-4">
                {[["Lifetime revenue", usd(d.lifetime)], ["Last 12 months", usd(d.revenue12)], ["On-time", `${d.onTime}%`], ["Orders about every", d.every ? `${d.every} days` : "New"]].map(([l, val]) => (
                  <div key={l} className="rounded-[4px] bg-(--d-panel2) p-2.5"><dt className="text-[12px] text-(--d-muted)">{l}</dt><dd className="demo-display text-[20px]">{val}</dd></div>
                ))}
              </dl>
              {d.nextOrder ? <p className={d.dueToReorder ? "font-semibold text-(--d-warn)" : "text-(--d-muted)"}>Last order {shortDay(d.lastOrder!)}. {d.nextOrder < shop.today ? "Next one looks overdue, they usually would have ordered by" : "Next one likely around"} {shortDay(d.nextOrder)}.{d.dueToReorder ? " Worth a call." : ""}</p> : null}

              <section>
                <h3 className="demo-display mb-1 text-[17px]">Contacts</h3>
                <ul className="space-y-1.5">
                  {c.contacts.map((x) => (
                    <li key={x.email} className="rounded-[4px] border border-(--d-line) p-2.5">
                      <p className="font-semibold">{x.name} <span className="font-normal text-(--d-muted)">· {x.role}</span></p>
                      <p className="flex flex-wrap gap-x-4 text-[13px] text-(--d-muted)"><span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} />{x.phone}</span><span className="inline-flex min-w-0 items-center gap-1.5 break-all"><Icon name="mail" size={14} />{x.email}</span></p>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="demo-display mb-1 text-[17px]">Open orders ({d.open.length})</h3>
                {d.open.length ? (
                  <ul>
                    {d.open.map((j) => (
                      <li key={j.id} className="border-b border-(--d-line) last:border-0">
                        <button type="button" onClick={() => openJob(j.id)} className="flex min-h-12 w-full items-center justify-between gap-3 py-1.5 text-left"><span className="min-w-0"><Num>{j.id}</Num> <span className="text-(--d-muted)">· {shop.partOf(j.partId).name} · due {shortDay(j.dueDate)}</span></span><StatusPill status={j.status} /></button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-(--d-muted)">Nothing open right now.</p>}
              </section>

              <section>
                <h3 className="demo-display mb-1 text-[17px]">Visits + notes</h3>
                <ol className="space-y-2">
                  {c.visits.map((x, i) => <li key={i} className="flex gap-3"><span className="w-12 shrink-0 text-[13px] text-(--d-muted)">{shortDay(x.date)}</span><span className="min-w-0">{x.note} <span className="text-(--d-muted)">({x.by})</span></span></li>)}
                </ol>
              </section>
              <p className="text-[13px] text-(--d-muted)">{v.Jobs} shipped in the last 12 months: {d.shipped.length}.</p>
            </div>
          );
        }}
      />
    </div>
  );
}
