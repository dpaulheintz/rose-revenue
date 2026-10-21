"use client";

import { useId, useMemo, useState } from "react";
import { optionTotals } from "@/lib/demo/shop/derive";
import type { Estimate, EstimateOption, LineItem, LineKind } from "@/lib/demo/shop/types";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Button, Field, Pill } from "../ui";
import { usd } from "./bits";
import { useShop } from "./ShopProvider";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A starting estimate from a job type's usual scope. */
function template(typeKey: string, seed: ReturnType<typeof useShop>["seed"], markup: number): EstimateOption[] {
  const t = seed.jobTypes.find((x) => x.key === typeKey)!;
  const mid = (t.price[0] + t.price[1]) / 2;
  const rate = t.crew === "remodel" ? 85 : 115;
  const cost = t.crew === "remodel" ? 35 : 41;
  const base = (scale: number): LineItem[] => [
    ...t.labor.map((desc) => ({ kind: "Labor" as const, desc, qty: Math.max(1, Math.round(((mid * (1 - t.mat - t.sub)) / rate / t.labor.length) * 2) / 2), unit: "hr", price: rate, cost })),
    ...t.materials.map((desc) => { const c = Math.round(((mid * t.mat * scale) / t.materials.length / (1 + markup)) / 5) * 5; return { kind: "Materials" as const, desc, qty: 1, unit: "lot", price: r2(c * (1 + markup)), cost: c }; }),
    ...t.subs.map((desc) => { const c = Math.round((mid * t.sub) / t.subs.length / (1 + markup) / 5) * 5; return { kind: "Subcontractor" as const, desc, qty: 1, unit: "lot", price: r2(c * (1 + markup)), cost: c }; }),
  ];
  return t.big ? [{ name: "Good", lines: base(0.82) }, { name: "Better", lines: base(1) }, { name: "Best", lines: base(1.28) }] : [{ name: "Standard", lines: base(1) }];
}

export default function EstimateBuilder({ id, customer, onClose }: { id: string | null; customer?: string; onClose: () => void }) {
  const { book, seed, saveEstimate, convertEstimate, open, customer: cust } = useShop();
  const existing = id ? book.estimates.find((e) => e.id === id) ?? null : null;
  const homeowners = useMemo(() => book.customers.slice().sort((a, b) => a.name.localeCompare(b.name)), [book.customers]);
  const [draft, setDraft] = useState<Estimate>(() => {
    if (existing) return structuredClone(existing);
    const c = customer ?? homeowners[0].id;
    return {
      id: `ve-${Date.now().toString(36)}`, no: `E-${2400 + book.estimates.length}`, customer: c, property: cust(c).properties[0].id, type: "bath", title: "Bath remodel",
      created: book.anchor, sent: null, viewed: null, decided: null, status: "Draft", options: template("bath", seed, seed.markup.materials), chosen: 1, depositPct: 0.3, job: null, source: "Referral",
    };
  });
  const [markup, setMarkup] = useState(Math.round(seed.markup.materials * 100));
  const [tax, setTax] = useState(seed.taxRate * 100);
  const [tab, setTab] = useState(draft.chosen);
  const locked = draft.status === "Approved" && !!existing;
  const formId = useId();
  const opt = draft.options[tab];
  const totals = (o: EstimateOption) => optionTotals(o, tax / 100);

  const setLines = (fn: (ls: LineItem[]) => LineItem[]) => setDraft((d) => ({ ...d, options: d.options.map((o, i) => (i === tab ? { ...o, lines: fn(o.lines) } : o)) }));
  const reprice = (m: number) => {
    setMarkup(m);
    setDraft((d) => ({ ...d, options: d.options.map((o) => ({ ...o, lines: o.lines.map((l) => (l.kind === "Labor" ? l : { ...l, price: r2(l.cost * (1 + m / 100)) })) })) }));
  };
  const t = totals(opt);
  const deposit = r2(t.total * draft.depositPct);
  const final = (): Estimate => ({ ...draft, chosen: tab });

  return (
    <Dialog
      open
      drawer
      onClose={onClose}
      title={existing ? `Estimate ${draft.no}` : "New estimate"}
      subtitle={<span className="flex flex-wrap items-center gap-2">{cust(draft.customer).name} <Pill tone={draft.status === "Approved" ? "good" : draft.status === "Draft" ? "neutral" : "info"}>{draft.status}</Pill></span>}
      footer={locked ? <Button onClick={onClose}>Close</Button> : (
        <>
          <Button onClick={() => { saveEstimate(final(), "draft"); onClose(); }}>Save draft</Button>
          <Button onClick={() => { saveEstimate(final(), "send"); onClose(); }}><Icon name="mail" size={18} />Send to customer</Button>
          <Button variant="primary" onClick={() => { const inv = convertEstimate(final()); open({ kind: "invoice", id: inv }); }}><Icon name="receipt" size={18} />Convert to invoice</Button>
        </>
      )}
    >
      <form id={formId} onSubmit={(e) => e.preventDefault()} className="space-y-5">
        {!existing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer">
              <select className="demo-input" value={draft.customer} onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value, property: cust(e.target.value).properties[0].id }))}>
                {homeowners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Job type">
              <select className="demo-input" value={draft.type} onChange={(e) => { const k = e.target.value; const tt = seed.jobTypes.find((x) => x.key === k)!; setDraft((d) => ({ ...d, type: k, title: tt.titles[0], options: template(k, seed, markup / 100), chosen: tt.big ? 1 : 0, depositPct: tt.big ? 0.3 : tt.key === "hvac-install" ? 0.25 : 0 })); setTab(seed.jobTypes.find((x) => x.key === k)!.big ? 1 : 0); }}>
                {seed.jobTypes.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <p className="text-[14px] text-(--d-muted)">{draft.title} · {cust(draft.customer).properties.find((p) => p.id === draft.property)?.address}</p>
        )}

        {draft.options.length > 1 ? (
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-(--d-muted)">Options the customer can pick</p>
            <div className="grid grid-cols-3 gap-2">
              {draft.options.map((o, i) => (
                <button key={o.name} type="button" onClick={() => setTab(i)} aria-pressed={tab === i} className={`min-h-16 rounded-[12px] border p-2.5 text-left ${tab === i ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_12%,transparent)]" : "border-(--d-line)"}`}>
                  <span className="block text-[13px] font-semibold">{o.name}</span>
                  <span className="demo-display block text-[17px]">{usd(totals(o).total)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <section aria-label="Line items">
          <ul className="space-y-2">
            {opt.lines.map((l, i) => (
              <li key={i} className="rounded-[12px] border border-(--d-line) p-3">
                <div className="flex items-start gap-2">
                  <select aria-label="Line type" disabled={locked} className="demo-input !min-h-11 w-[132px] shrink-0 text-[13px]" value={l.kind} onChange={(e) => { const k = e.target.value as LineKind; setLines((ls) => ls.map((x, j) => (j === i ? { ...x, kind: k, unit: k === "Labor" ? "hr" : "lot", price: k === "Labor" ? 85 : r2(x.cost * (1 + markup / 100)) } : x))); }}>
                    {(["Labor", "Materials", "Subcontractor"] as const).map((k) => <option key={k}>{k}</option>)}
                  </select>
                  <input aria-label="Description" disabled={locked} className="demo-input !min-h-11 min-w-0 flex-1" value={l.desc} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))} />
                  {!locked ? <button type="button" aria-label={`Remove ${l.desc}`} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-[10px] text-(--d-muted) hover:bg-(--d-panel2)"><Icon name="x" size={18} /></button> : null}
                </div>
                <div className="mt-2 grid grid-cols-3 items-end gap-2 text-[13px]">
                  <label className="flex flex-col gap-1"><span className="text-(--d-muted)">{l.unit === "hr" ? "Hours" : "Qty"}</span><input disabled={locked} inputMode="decimal" className="demo-input !min-h-11" value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 } : x)))} /></label>
                  <label className="flex flex-col gap-1"><span className="text-(--d-muted)">{l.kind === "Labor" ? "Rate" : "Our cost"}</span><input disabled={locked} inputMode="decimal" className="demo-input !min-h-11" value={l.kind === "Labor" ? l.price : l.cost} onChange={(e) => { const v = Number(e.target.value.replace(/[^\d.]/g, "")) || 0; setLines((ls) => ls.map((x, j) => (j === i ? (x.kind === "Labor" ? { ...x, price: v } : { ...x, cost: v, price: r2(v * (1 + markup / 100)) }) : x))); }} /></label>
                  <p className="pb-2.5 text-right"><span className="block text-(--d-muted)">Line total</span><span className="font-semibold tabular-nums">{usd(l.qty * l.price, true)}</span></p>
                </div>
              </li>
            ))}
          </ul>
          {!locked ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Labor", "Materials", "Subcontractor"] as const).map((k) => (
                <Button key={k} variant="ghost" onClick={() => setLines((ls) => [...ls, k === "Labor" ? { kind: k, desc: "Labor", qty: 8, unit: "hr", price: 85, cost: 35 } : { kind: k, desc: k === "Materials" ? "Materials" : "Sub", qty: 1, unit: "lot", price: r2(500 * (1 + markup / 100)), cost: 500 }])}>
                  <Icon name="plus" size={16} />{k}
                </Button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-3 gap-2">
          <Field label="Markup %"><input disabled={locked} inputMode="decimal" className="demo-input" value={markup} onChange={(e) => reprice(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></Field>
          <Field label="Tax % (materials)"><input disabled={locked} inputMode="decimal" className="demo-input" value={tax} onChange={(e) => setTax(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></Field>
          <Field label="Deposit %"><input disabled={locked} inputMode="decimal" className="demo-input" value={Math.round(draft.depositPct * 100)} onChange={(e) => setDraft((d) => ({ ...d, depositPct: Math.min(100, Number(e.target.value.replace(/[^\d.]/g, "")) || 0) / 100 }))} /></Field>
        </div>

        <dl className="space-y-1 rounded-[12px] bg-(--d-panel2) p-4 text-[14px] tabular-nums">
          <div className="flex justify-between"><dt className="text-(--d-muted)">Subtotal</dt><dd>{usd(t.subtotal, true)}</dd></div>
          <div className="flex justify-between"><dt className="text-(--d-muted)">Tax on materials</dt><dd>{usd(t.tax, true)}</dd></div>
          <div className="flex justify-between text-[17px] font-bold"><dt>Total</dt><dd>{usd(t.total, true)}</dd></div>
          {draft.depositPct > 0 ? <div className="flex justify-between"><dt className="text-(--d-muted)">Deposit due at signing ({Math.round(draft.depositPct * 100)}%)</dt><dd className="font-semibold">{usd(deposit, true)}</dd></div> : null}
          <div className="flex justify-between border-t border-(--d-line) pt-1"><dt className="text-(--d-muted)">Est. gross margin</dt><dd className={t.margin < 0.25 ? "font-semibold text-(--d-warn)" : "font-semibold text-(--d-good)"}>{Math.round(t.margin * 100)}%</dd></div>
        </dl>
        {locked ? <p className="text-[13px] text-(--d-muted)">Approved {draft.decided ? `on ${draft.decided}` : ""}. The job and its invoices were created from this estimate.</p> : null}
      </form>
    </Dialog>
  );
}
