"use client";

import { useId, useState } from "react";
import { shortDate } from "@demos/kit/data/format";
import { estimateTotal, type InvoiceRow } from "@demos/act2/derive";
import type { PayMethod } from "@demos/act2/model";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { Button, Field } from "@demos/kit/ui/ui";
import { DocumentPaper } from "@demos/kit/blocks/DocumentPaper";
import { StatusChip, usd } from "@demos/act2/parts/bits";
import { useShop } from "@demos/act2/parts/ShopProvider";

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
    <DocumentPaper
      ariaLabel={`Invoice ${inv.no}`}
      accent="#ea8a45"
      accentText="#b4561a"
      logo={{ src: cfg.brand!.logo!, alt: "Act 2 Mechanical LLC" }}
      company="Act 2 Mechanical LLC"
      tagline="All jobs for all people"
      contact="Central Ohio · (614) 555-0100 · office@example.com"
      title="Invoice"
      number={inv.no}
      meta={[`Issued ${longDate(inv.issued)}`, inv.due === inv.issued ? "Due on receipt" : `Due ${longDate(inv.due)}`]}
      parties={[
        { label: "Bill to", lines: [{ text: c.name, tone: "strong" }, ...(c.kind !== "Homeowner" ? [{ text: `Attn: ${c.contact}` }] : []), { text: c.email, tone: "muted" }] },
        { label: "Job site", lines: [{ text: where.address, tone: "strong" }, { text: `${where.town}, Ohio${job ? ` · ${job.no}` : ""}`, tone: "muted" }] },
      ]}
      lines={lines}
      totals={[
        { label: "Invoice total", amount: inv.amount, kind: "total" },
        ...inv.payments.map((p) => ({ label: `Paid ${shortDate(p.date)} · ${p.method}`, amount: p.amount, kind: "less" as const })),
        { label: "Balance due", amount: inv.balance, kind: "due" },
      ]}
      footer="Pay online by card or bank transfer, or mail a check to Act 2 Mechanical LLC. Thank you for your business."
    />
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
