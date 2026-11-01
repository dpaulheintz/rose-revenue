"use client";

import { useState } from "react";
import { shortDay, type Shortage } from "@demos/buckeye/derive";
import type { Material } from "@demos/buckeye/data";
import { industry as ind } from "@demos/buckeye/industry";
import { ResponsiveTable, type Column } from "@demos/kit/blocks/ResponsiveTable";
import { usd } from "@demos/kit/data/format";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button, Card, Field, PageHeader, Pill, Tabs } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { LotTag, Num, v } from "@demos/buckeye/parts/bits";

const supplier = (id: string) => ind.suppliers.find((s) => s.id === id)!;

export default function Inventory() {
  const { shop, k, pos, material, openJob, customer } = useShop();
  const [tab, setTab] = useState<"raw" | "finished" | "pos">("raw");
  const [q, setQ] = useState("");
  const [buy, setBuy] = useState<{ materialId: string; need: Shortage | null } | null>(null);
  const shortIds = new Set(k.shortages.map((s) => s.material.id));
  const needle = q.trim().toLowerCase();
  const rows = shop.materials
    .filter((m) => !needle || `${m.name} ${m.kind}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(shortIds.has(b.id)) - Number(shortIds.has(a.id)) || Number(b.onHand < b.reorderAt) - Number(a.onHand < a.reorderAt));
  const openPos = pos.filter((p) => !p.received).sort((a, b) => (a.eta < b.eta ? -1 : 1));
  const pill = (m: Material) => shortIds.has(m.id) ? <Pill tone="bad">Runs out</Pill> : m.onHand < m.reorderAt ? <Pill tone="warn">Low</Pill> : <Pill tone="good">OK</Pill>;
  const onOrder = (id: string) => openPos.filter((p) => p.materialId === id).reduce((s, p) => s + p.qty, 0);

  const columns: Column<Material>[] = [
    { key: "n", header: v.material[0].toUpperCase() + v.material.slice(1), primary: true, cell: (m) => m.name },
    { key: "k", header: "Type", hideOnCard: true, cell: (m) => m.kind },
    { key: "h", header: "On hand", align: "right", cell: (m) => `${m.onHand} ${m.unit}` },
    { key: "r", header: "Reorder at", align: "right", cell: (m) => `${m.reorderAt} ${m.unit}` },
    { key: "o", header: "On order", align: "right", cell: (m) => (onOrder(m.id) ? `${onOrder(m.id)} ${m.unit}` : "None") },
    { key: "s", header: "Status", cell: pill },
    { key: "a", header: "", hideOnCard: true, cell: (m) => <Button onClick={() => setBuy({ materialId: m.id, need: k.shortages.find((s) => s.material.id === m.id) ?? null })}>Create PO</Button> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory & Purchasing" meta={`${shop.materials.length} ${v.material}s tracked. ${k.low.length} below reorder point, ${openPos.length} POs open.`} />

      {k.shortages.map((s) => (
        <section key={s.material.id} className="demo-card border-l-4 border-l-(--d-bad) p-4 sm:p-5" aria-label={`${s.material.name} shortage`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-(--d-bad)"><Icon name="alert" size={16} />Same alert as your Dashboard</p>
              <h2 className="demo-display mt-1 text-[24px] leading-tight">{s.material.name} runs out before {s.job.id} needs it</h2>
              <p className="mt-1 text-[14px] text-(--d-muted)">Short {s.short} {s.material.unit} on {shortDay(s.need)}. {s.po ? `${s.po.id} from ${supplier(s.po.supplierId).name} lands ${shortDay(s.po.eta)}, ${s.daysLate} days too late.` : "Nothing on order."}</p>
            </div>
            <Button variant="primary" onClick={() => setBuy({ materialId: s.material.id, need: s })}><Icon name="plus" size={16} />Create purchase order</Button>
          </div>
          <ol className="mt-3 grid gap-2 *:min-w-0 sm:grid-cols-3">
            <li className="rounded-[4px] bg-(--d-panel2) p-3"><span className="block text-[12.5px] text-(--d-muted)">In stock today</span><span className="demo-display text-[24px]">{s.material.onHand} {s.material.unit}</span></li>
            <li className="rounded-[4px] bg-(--d-panel2) p-3"><span className="block text-[12.5px] text-(--d-muted)">Left when {s.job.id} starts</span><span className="demo-display text-[24px]">{s.before} {s.material.unit}</span></li>
            <li className="rounded-[4px] bg-[color-mix(in_oklab,var(--d-bad)_10%,var(--d-panel))] p-3">
              <button type="button" onClick={() => openJob(s.job.id)} className="block min-h-12 w-full text-left">
                <span className="block text-[12.5px] text-(--d-muted)"><Num>{s.job.id}</Num> needs, {customer(s.job.customerId).name}</span>
                <span className="demo-display text-[24px] text-(--d-bad)">{Math.round(s.job.matNeed)} {s.material.unit}</span>
              </button>
            </li>
          </ol>
        </section>
      ))}
      {!k.shortages.length ? <p className="demo-card flex items-center gap-2 border-l-4 border-l-(--d-good) p-4 font-semibold"><Icon name="check" size={18} className="text-(--d-good)" />Nothing runs out before a {v.job} needs it. The Dashboard alert cleared too.</p> : null}

      <Tabs label="View" value={tab} onChange={setTab} tabs={[{ value: "raw", label: v.Materials, count: shop.materials.length }, { value: "finished", label: v.finished, count: shop.finished.length }, { value: "pos", label: "Purchase orders", count: openPos.length }]} />

      {tab === "raw" ? (
        <div className="space-y-3">
          <SearchBar label={`Search ${v.material}`} placeholder={`Search ${v.material}`} value={q} onChange={setQ} />
          <ResponsiveTable
            rows={rows} columns={columns} getKey={(m) => m.id} minWidth={780}
            card={(m) => (
              <>
                <span className="flex items-start justify-between gap-3"><span className="min-w-0 font-semibold">{m.name}</span>{pill(m)}</span>
                <span className="mt-1 block text-[13px] text-(--d-muted)">{m.onHand} {m.unit} on hand · reorder at {m.reorderAt}{onOrder(m.id) ? ` · ${onOrder(m.id)} on order` : ""}</span>
                <Button className="mt-2 w-full" onClick={() => setBuy({ materialId: m.id, need: k.shortages.find((s) => s.material.id === m.id) ?? null })}>Create PO</Button>
              </>
            )}
          />
        </div>
      ) : null}

      {tab === "finished" ? (
        <div className="grid gap-3 *:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          {shop.finished.map((f) => {
            const p = shop.partOf(f.partId);
            return (
              <Card key={f.partId} bodyClass="p-4">
                <p className="flex items-start justify-between gap-2"><span className="min-w-0 font-semibold">{p.name}</span>{f.onHand < f.min ? <Pill tone="warn">Low</Pill> : <Pill tone="good">OK</Pill>}</p>
                <p className="text-[13px] text-(--d-muted)"><Num>{p.number}</Num> · {customer(p.customerId).name}</p>
                <p className="mt-2 flex items-center justify-between gap-2 text-[13.5px]"><span>{f.onHand} {v.unit} on the shelf, min {f.min}</span><LotTag>{f.lot}</LotTag></p>
                <p className="text-[13px] text-(--d-muted)">{usd(f.onHand * f.unitPrice)} at {usd(f.unitPrice, true)} each</p>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === "pos" ? (
        <ResponsiveTable
          rows={openPos} getKey={(p) => p.id} minWidth={720}
          columns={[
            { key: "id", header: "PO", primary: true, cell: (p) => <Num>{p.id}</Num> },
            { key: "m", header: "Material", cell: (p) => material(p.materialId).name },
            { key: "s", header: "Supplier", cell: (p) => supplier(p.supplierId).name },
            { key: "q", header: "Qty", align: "right", cell: (p) => `${p.qty} ${material(p.materialId).unit}` },
            { key: "e", header: "Arrives", cell: (p) => <>{shortDay(p.eta)}{p.expedited ? <Pill tone="accent" className="ml-1.5">Expedited</Pill> : null}</> },
            { key: "c", header: "Cost", align: "right", cell: (p) => usd(p.cost) },
          ]}
        />
      ) : null}

      {buy ? <PoDialog key={buy.materialId} materialId={buy.materialId} need={buy.need} onClose={() => setBuy(null)} /> : null}
    </div>
  );
}

function PoDialog({ materialId, need, onClose }: { materialId: string; need: Shortage | null; onClose: () => void }) {
  const { material, createPo } = useShop();
  const m = material(materialId);
  const [qty, setQty] = useState(Math.max(10, Math.round(need ? need.short * 2 : m.reorderAt * 1.5)));
  const [expedite, setExpedite] = useState(!!need);
  return (
    <Dialog
      open onClose={onClose} title="Create purchase order" subtitle={m.name}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { createPo(materialId, qty, expedite); onClose(); }}>Send PO to supplier</Button></>}
    >
      <div className="space-y-3 text-[14px]">
        <p>Supplier: <span className="font-semibold">{supplier(m.supplier).name}</span> · usual lead time {m.leadDays} days</p>
        <Field label={`Quantity (${m.unit})`}><input className="demo-input" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></Field>
        <label className="flex min-h-12 items-center gap-3 rounded-[4px] border border-(--d-line) px-3"><input type="checkbox" className="size-5 accent-(--d-accent)" checked={expedite} onChange={(e) => setExpedite(e.target.checked)} /><span>Expedite, 2 workdays (+12%)</span></label>
        <p className="text-(--d-muted)">About {usd(qty * m.cost * (expedite ? 1.12 : 1))}. {need ? `${need.job.id} needs it by ${shortDay(need.need)}.` : ""}</p>
      </div>
    </Dialog>
  );
}
