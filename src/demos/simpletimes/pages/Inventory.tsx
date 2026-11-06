"use client";

import { useState } from "react";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button } from "@demos/kit/ui/ui";
import type { Stock } from "@demos/simpletimes/data";
import { clientName, shortages, shortDay } from "@demos/simpletimes/derive";
import { Chip, H, NUM, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

const KINDS = ["Ingredient", "Bottles", "Caps", "Labels", "Cartons", "Finished goods"];

export default function Inventory() {
  const { d, w, open } = useSt();
  const [own, setOwn] = useState<"own" | "client">("own");
  const [q, setQ] = useState("");
  const [kinds, setKinds] = useState<string[]>([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [sheet, setSheet] = useState(false);
  const short = shortages(d, w);
  const shortIds = new Set(short.map((s) => s.item.id));
  const isOwn = (s: Stock) => s.owner === "Simple Times" || s.owner === "mixers" || s.owner === "syrup";
  const low = (s: Stock) => s.reorderAt > 0 && s.onHand < s.reorderAt;
  const needle = q.trim().toLowerCase();
  const list = w.stock
    .filter((s) => (own === "own" ? isOwn(s) : !isOwn(s)) && (!needle || `${s.name} ${s.supplier}`.toLowerCase().includes(needle)) && (!kinds.length || kinds.includes(s.kind)) && (!lowOnly || low(s) || shortIds.has(s.id)))
    .sort((a, b) => Number(shortIds.has(b.id)) - Number(shortIds.has(a.id)) || Number(low(b)) - Number(low(a)));
  const pos = w.pos.filter((p) => p.eta >= d.today);
  const active = kinds.length + Number(lowOnly);

  return (
    <div className="space-y-4">
      <Title sub="Ingredients, glass, caps, labels and finished goods.">Inventory</Title>
      {short.map((s) => (
        <section key={s.item.id} className="rounded-[12px] border-2 border-(--d-bad) bg-(--d-panel) p-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-(--d-bad)"><Icon name="alert" size={18} />Same alert as Co-packing Home</p>
          <h2 className="demo-display mt-1 text-[26px] leading-tight">{s.item.name} runs short</h2>
          <p className="text-[15px]">Before run {s.run.id}, {s.run.product.toLowerCase()} on {shortDay(s.run.date)}.</p>
          <ol className="mt-3 grid grid-cols-3 gap-2 text-center">
            <li className="rounded-[10px] bg-(--d-panel2) p-2"><span className="block text-[13px] text-(--d-muted)">On hand</span><span className={`${NUM} block text-[22px]`}>{s.item.onHand}</span></li>
            <li className="rounded-[10px] bg-(--d-panel2) p-2"><span className="block text-[13px] text-(--d-muted)">Left for {s.run.id}</span><span className={`${NUM} block text-[22px]`}>{s.before}</span></li>
            <li className="rounded-[10px] bg-[color-mix(in_oklab,var(--d-bad)_10%,white)] p-2"><span className="block text-[13px] text-(--d-muted)">Needed {shortDay(s.run.date)}</span><span className={`${NUM} block text-[22px] text-(--d-bad)`}>{Math.round((s.before + s.short) * 10) / 10}</span></li>
          </ol>
          <p className="mt-2 text-[15px] text-(--d-muted)">In {s.item.unit}. {s.po ? `${s.po.id} from ${s.item.supplier} lands ${shortDay(s.po.eta)}, ${s.daysLate} days too late.` : "Nothing on order."}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" onClick={() => open({ kind: "po", item: s.item.id })}><Icon name="plus" size={18} />Create purchase order</Button><Button onClick={() => open({ kind: "run", id: s.run.id })}>Open {s.run.id}</Button></div>
        </section>
      ))}
      {!short.length ? <p className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4 font-semibold text-(--d-good)">Nothing runs short before a scheduled run.</p> : null}

      <div role="radiogroup" aria-label="Whose stock" className="grid grid-cols-2 gap-1 rounded-[12px] bg-(--d-panel2) p-1">
        {([["own", "Our stock"], ["client", "Client-owned"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={own === k} onClick={() => setOwn(k)} className={`min-h-12 rounded-[9px] text-[15px] font-semibold ${own === k ? "bg-(--d-panel) shadow-sm" : "text-(--d-muted)"}`}>{l}</button>)}
      </div>
      <div className="flex items-end gap-2">
        <SearchBar className="min-w-0 flex-1" label="Search inventory" placeholder="Item or supplier" value={q} onChange={setQ} />
        <Button onClick={() => setSheet(true)} aria-label={`Filters${active ? `, ${active} on` : ""}`}><Icon name="filter" size={18} />Filters{active ? <span className="rounded-full bg-(--d-accent) px-1.5 text-[12.5px] text-white">{active}</span> : null}</Button>
      </div>

      <H>{list.length} items</H>
      <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
        {list.map((s) => {
          const pct = s.reorderAt ? Math.min(100, (s.onHand / (s.reorderAt * 2)) * 100) : 100;
          const state = shortIds.has(s.id) ? "Runs short" : low(s) ? "Low" : null;
          return (
            <li key={s.id} className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4">
              <p className="flex items-start justify-between gap-3"><span className="min-w-0 text-[16px] font-semibold">{s.name}</span>{state ? <Chip tone={state === "Runs short" ? "bad" : "warn"}>{state}</Chip> : null}</p>
              <p className="text-[14px] text-(--d-muted)">{Math.round(s.onHand * 10) / 10} {s.unit} on hand{s.reorderAt ? `, reorder at ${s.reorderAt}` : ""}. {isOwn(s) ? (s.lead ? `${s.supplier}, ${s.lead}-day lead` : s.supplier) : `Belongs to ${clientName(w, s.owner)}`}</p>
              {s.reorderAt ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--d-panel2)" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: state ? (state === "Runs short" ? "var(--d-bad)" : "#cecb00") : "var(--d-good)" }} /></div> : null}
              {isOwn(s) && s.lead ? <div className="mt-2 flex justify-end"><Button onClick={() => open({ kind: "po", item: s.id })}>Create PO</Button></div> : null}
            </li>
          );
        })}
      </ul>

      <section>
        <H>On order</H>
        <ul className="space-y-2">
          {pos.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3 text-[15px]"><span className="min-w-0"><span className="font-semibold">{p.id}</span>, {w.stock.find((s) => s.id === p.item)?.name}</span><span className="shrink-0 text-(--d-muted)">{p.expedited ? "Rush, " : ""}{shortDay(p.eta)}</span></li>)}
        </ul>
      </section>

      <Dialog open={sheet} sheet onClose={() => setSheet(false)} title="Filter inventory" footer={<><Button variant="ghost" onClick={() => { setKinds([]); setLowOnly(false); }}>Clear</Button><Button variant="primary" onClick={() => setSheet(false)}>Show {list.length}</Button></>}>
        <p className="mb-2 text-[15px] font-semibold">Kind</p>
        <div className="mb-5 flex flex-wrap gap-2">{KINDS.map((k) => { const on = kinds.includes(k); return <button key={k} type="button" aria-pressed={on} onClick={() => setKinds((x) => (on ? x.filter((y) => y !== k) : [...x, k]))} className={`min-h-12 rounded-full border px-4 text-[15px] ${on ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line)"}`}>{k}</button>; })}</div>
        <label className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px]"><input type="checkbox" className="size-6 accent-(--d-accent)" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />Low or running short only</label>
      </Dialog>
    </div>
  );
}
