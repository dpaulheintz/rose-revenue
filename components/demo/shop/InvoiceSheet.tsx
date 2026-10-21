"use client";

import { useId, useState } from "react";
import { shortDate } from "@/lib/demo/format";
import { estimateTotal, type InvoiceRow } from "@/lib/demo/shop/derive";
import type { PayMethod } from "@/lib/demo/shop/types";
import { useDemo } from "../DemoProvider";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Button, Field } from "../ui";
import { StatusChip, usd } from "./bits";
import { useShop } from "./ShopProvider";

const longDate = (d: string) => `${shortDate(d)}, ${d.slice(0, 4)}`;

/** The invoice as the customer receives it: always white paper, printable. */
export function InvoiceDoc({ inv }: { inv: InvoiceRow }) {
  const { cfg } = useDemo();
  const { book, seed, customer, place } = useShop();
  const c = customer(inv.customer);
  const job = book.jobs.find((j) => j.id === inv.job);
  const est = job?.estimate ? book.estimates.find((e) => e.id === job.estimate) : inv.job.startsWith("est:") ? book.estimates.find((e) => `est:${e.id}` === inv.job) : null;
  const where = job ? place(job) : c.properties[0];
  const prior = book.invoices.filter((i) => i.job === inv.job && i.id !== inv.id && i.issued <= inv.issued && (i.kind === "Deposit" || i.kind === "Progress"));
  const cos = job ? book.changeOrders.filter((co) => co.job === job.id && co.status === "Approved" && (!co.signed || co.signed <= inv.issued)) : [];
  const lines: Array<{ desc: string; amount: number; sub?: string }> = [];
  if (inv.kind === "Deposit" || inv.kind === "Progress") {
    const total = est ? estimateTotal(est, seed.taxRate) : job?.contract ?? inv.amount;
    lines.push({ desc: `${inv.kind === "Deposit" ? "Deposit" : "Progress billing"} (${Math.round((inv.amount / total) * 100)}% of contract)`, sub: `${job?.title ?? est?.title ?? ""} · contract ${usd(total, true)}${est ? ` · estimate ${est.no}` : ""}`, amount: inv.amount });
  } else {
    const src = job?.lines ?? est?.options[est.chosen].lines ?? [];
    const by = (k: string) => src.filter((l) => l.kind === k).reduce((s, l) => s + l.qty * l.price, 0);
    const labor = src.filter((l) => l.kind === "Labor");
    if (labor.length) lines.push({ desc: "Labor", sub: labor.map((l) => `${l.desc}${l.unit === "hr" ? ` (${l.qty} hr)` : ""}`).join(" · "), amount: by("Labor") });
    if (by("Materials")) lines.push({ desc: "Materials + equipment", sub: src.filter((l) => l.kind === "Materials").map((l) => l.desc).join(" · "), amount: by("Materials") });
    if (by("Subcontractor")) lines.push({ desc: "Subcontracted work", sub: src.filter((l) => l.kind === "Subcontractor").map((l) => l.desc).join(" · "), amount: by("Subcontractor") });
    if (by("Materials")) lines.push({ desc: `Sales tax on materials (${(seed.taxRate * 100).toFixed(2)}%)`, amount: by("Materials") * seed.taxRate });
    for (const co of cos) lines.push({ desc: `Change order ${co.no}`, sub: co.title, amount: co.amount });
    for (const p of prior) lines.push({ desc: `Less ${p.kind.toLowerCase()} ${p.no}`, amount: -p.amount });
  }
  return (
    <article className="demo-print rounded-[10px] bg-white p-5 text-[13.5px] text-[#14171b] shadow-sm sm:p-7" aria-label={`Invoice ${inv.no}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-[#ea8a45] pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.brand!.logo} alt="Act 2 Mechanical LLC" width={56} height={56} className="rounded-full" />
          <div>
            <p className="demo-display text-[19px] leading-none tracking-tight uppercase">Act 2 Mechanical LLC</p>
            <p className="mt-1 text-[11px] font-bold tracking-[0.18em] text-[#b4561a] uppercase">All jobs for all people</p>
            <p className="mt-1 text-[12px] text-[#545b63]">Central Ohio · (614) 555-0100 · office@example.com</p>
          </div>
        </div>
        <div className="text-right">
          <p className="demo-display text-[26px] leading-none">Invoice</p>
          <p className="mt-1 font-semibold">{inv.no}</p>
          <p className="text-[12.5px] text-[#545b63]">Issued {longDate(inv.issued)}</p>
          <p className="text-[12.5px] text-[#545b63]">{inv.due === inv.issued ? "Due on receipt" : `Due ${longDate(inv.due)}`}</p>
        </div>
      </header>
      <div className="grid gap-4 py-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">Bill to</p>
          <p className="font-semibold">{c.name}</p>
          {c.kind !== "Homeowner" ? <p>Attn: {c.contact}</p> : null}
          <p className="text-[#545b63]">{c.email}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">Job site</p>
          <p className="font-semibold">{where.address}</p>
          <p className="text-[#545b63]">{where.town}, Ohio{job ? ` · ${job.no}` : ""}</p>
        </div>
      </div>
      <table className="w-full text-left">
        <thead className="text-[11px] tracking-[0.1em] text-[#545b63] uppercase">
          <tr className="border-y border-[#d6dade]"><th className="py-2 font-bold">Description</th><th className="py-2 text-right font-bold">Amount</th></tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-[#eaecee] align-top">
              <td className="py-2 pr-3"><span className="font-semibold">{l.desc}</span>{l.sub ? <span className="block text-[12px] text-[#545b63]">{l.sub}</span> : null}</td>
              <td className={`py-2 text-right tabular-nums ${l.amount < 0 ? "text-[#545b63]" : ""}`}>{l.amount < 0 ? `−${usd(-l.amount, true)}` : usd(l.amount, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 ml-auto w-full max-w-[280px] space-y-1 text-right tabular-nums">
        <div className="flex justify-between gap-4 text-[15px] font-bold"><dt>Invoice total</dt><dd>{usd(inv.amount, true)}</dd></div>
        {inv.payments.map((p) => (
          <div key={p.id} className="flex justify-between gap-4 text-[12.5px] text-[#545b63]"><dt>Paid {shortDate(p.date)} · {p.method}</dt><dd>−{usd(p.amount, true)}</dd></div>
        ))}
        <div className="flex justify-between gap-4 border-t-2 border-[#14171b] pt-1 text-[16px] font-bold"><dt>Balance due</dt><dd>{usd(inv.balance, true)}</dd></div>
      </dl>
      <footer className="mt-5 border-t border-[#eaecee] pt-3 text-[12px] text-[#545b63]">
        Pay online by card or bank transfer, or mail a check to Act 2 Mechanical LLC. Thank you for your business.
      </footer>
    </article>
  );
}

export default function InvoiceSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { rows, recordPayment, sendInvoice, remind, open } = useShop();
  const inv = rows.find((r) => r.id === id);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayMethod>("Card");
  const formId = useId();
  if (!inv) return null;
  const job = inv.job.startsWith("est:") ? null : inv.job;
  return (
    <Dialog
      open
      drawer
      onClose={onClose}
      title={<span className="flex items-center gap-2">{inv.no} <StatusChip status={inv.status} /></span>}
      subtitle={`${inv.kind} invoice · ${usd(inv.amount, true)} · balance ${usd(inv.balance, true)}`}
      footer={
        paying ? (
          <><Button onClick={() => setPaying(false)}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Record {usd(Number(amount) || inv.balance, true)}</Button></>
        ) : (
          <>
            <Button onClick={() => window.print()}><Icon name="receipt" size={18} />Print</Button>
            {inv.status === "Draft" ? <Button variant="primary" onClick={() => sendInvoice(inv.id)}><Icon name="mail" size={18} />Send invoice</Button> : null}
            {inv.balance > 0 && inv.status !== "Draft" ? <Button onClick={() => remind(inv.id)}><Icon name="mail" size={18} />Send reminder</Button> : null}
            {inv.balance > 0 && inv.status !== "Draft" ? <Button variant="primary" onClick={() => { setAmount(String(inv.balance)); setPaying(true); }}><Icon name="dollar" size={18} />Record payment</Button> : null}
          </>
        )
      }
    >
      <div className="space-y-4">
        {paying ? (
          <form id={formId} onSubmit={(e) => { e.preventDefault(); const a = Math.min(inv.balance, Number(amount) || inv.balance); if (a > 0) recordPayment(inv.id, a, method); setPaying(false); }} className="grid gap-3 rounded-[12px] border-2 border-(--d-accent) p-4 sm:grid-cols-2">
            <Field label="Amount">
              <input className="demo-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
            </Field>
            <fieldset>
              <legend className="text-[13px] font-semibold text-(--d-muted)">Method</legend>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {(["Card", "Check", "ACH", "Cash"] as const).map((m) => (
                  <label key={m} className={`grid min-h-12 cursor-pointer place-items-center rounded-[10px] border text-[13.5px] font-semibold ${method === m ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line)"}`}>
                    <input type="radio" name="method" className="sr-only" checked={method === m} onChange={() => setMethod(m)} />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-[12.5px] text-(--d-muted) sm:col-span-2">Max {usd(inv.balance, true)}. Partial payments leave the rest open.</p>
          </form>
        ) : null}
        {job ? <Button variant="ghost" className="-ml-2" onClick={() => open({ kind: "job", id: job })}><Icon name="hammer" size={18} />Open the job</Button> : null}
        <InvoiceDoc inv={inv} />
      </div>
    </Dialog>
  );
}
