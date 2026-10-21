"use client";

import { useState } from "react";
import { shortDate } from "@/lib/demo/format";
import { jobTotal, sum } from "@/lib/demo/shop/derive";
import type { ChangeOrder } from "@/lib/demo/shop/types";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import { Button, FilterChip, PageHeader, Pill, Stat } from "../../ui";
import { SignaturePad, usd } from "../bits";
import { useShop } from "../ShopProvider";

export default function ChangeOrders() {
  const { book, customer, job, open } = useShop();
  const [filter, setFilter] = useState<ChangeOrder["status"] | "All">("All");
  const [signing, setSigning] = useState<string | null>(null);
  const cos = book.changeOrders.slice().sort((a, b) => (a.status === "Awaiting signature" ? -1 : b.status === "Awaiting signature" ? 1 : a.created < b.created ? 1 : -1));
  const list = cos.filter((c) => filter === "All" || c.status === filter);
  const approved = cos.filter((c) => c.status === "Approved" && c.created >= book.windowStart);
  return (
    <div className="space-y-5">
      <PageHeader title="Change orders" meta="Extras the customer signs for. Signing adds them to the job total, so the next invoice picks them up." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Waiting on a signature" value={String(cos.filter((c) => c.status === "Awaiting signature").length)} sub={usd(sum(cos.filter((c) => c.status === "Awaiting signature"), (c) => c.amount))} tone="warn" />
        <Stat label="Approved, 12 months" value={usd(sum(approved, (c) => c.amount))} sub={`${approved.length} change orders`} tone="good" />
        <Stat label="Avg margin on extras" value={`${Math.round((1 - sum(approved, (c) => c.cost) / Math.max(1, sum(approved, (c) => c.amount))) * 100)}%`} sub="Price vs. cost" />
      </div>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {(["All", "Awaiting signature", "Approved", "Declined"] as const).map((s) => <FilterChip key={s} on={filter === s} onClick={() => setFilter(s)} count={s === "All" ? cos.length : cos.filter((c) => c.status === s).length}>{s}</FilterChip>)}
      </div>
      <ul className="grid *:min-w-0 gap-2 lg:grid-cols-2">
        {list.map((c) => {
          const j = job(c.job);
          return (
            <li key={c.id} className={`demo-card p-4 ${c.status === "Awaiting signature" ? "border-(--d-warn)/60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{c.title}</p>
                  <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="mt-0.5 inline-flex min-h-11 items-center text-left text-[13px] text-(--d-muted) underline-offset-2 hover:underline">{c.no} · {j.no} {j.title} · {customer(j.customer).name}</button>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{usd(c.amount)}</p>
                  <Pill tone={c.status === "Approved" ? "good" : c.status === "Declined" ? "neutral" : "warn"}>{c.status}</Pill>
                </div>
              </div>
              <p className="text-[12.5px] text-(--d-muted)">Written {shortDate(c.created)}{c.signed ? ` · signed ${shortDate(c.signed)}` : ""}</p>
              {c.status === "Awaiting signature" ? <Button variant="primary" className="mt-3 w-full" onClick={() => setSigning(c.id)}><Icon name="pen" size={18} />Get signature</Button> : null}
            </li>
          );
        })}
      </ul>
      {signing ? <SignSheet id={signing} onClose={() => setSigning(null)} /> : null}
    </div>
  );
}

function SignSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { book, job, customer, signCO } = useShop();
  const co = book.changeOrders.find((c) => c.id === id)!;
  const j = job(co.job);
  const c = customer(j.customer);
  const [inked, setInked] = useState(false);
  const [done, setDone] = useState(false);
  const before = jobTotal(book, j);
  return (
    <Dialog
      open
      onClose={onClose}
      title={done ? "Signed" : "Change order"}
      subtitle={`${co.no} · ${j.title}`}
      footer={done ? <Button variant="primary" onClick={onClose}>Done</Button> : <><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!inked} onClick={() => { signCO(co.id); setDone(true); }}>Sign + approve</Button></>}
    >
      {done ? (
        <div className="space-y-2 text-[15px]">
          <p className="flex items-center gap-2 font-semibold text-(--d-good)"><Icon name="check" />{c.contact} signed {co.no}.</p>
          <p>Job total updated: <span className="tabular-nums">{usd(before - co.amount, true)}</span> → <span className="font-bold tabular-nums">{usd(before, true)}</span>.</p>
          <p className="text-[13.5px] text-(--d-muted)">It&apos;s on the next invoice automatically. The signed PDF goes to the customer and the job file.</p>
        </div>
      ) : (
        <div className="space-y-4 text-[14px]">
          <div className="rounded-[12px] bg-(--d-panel2) p-4">
            <p className="font-semibold">{co.title}</p>
            <p className="mt-1 text-(--d-muted)">Adds {usd(co.amount, true)} to the {j.title.toLowerCase()} at {customer(j.customer).properties.find((p) => p.id === j.property)?.address}. Schedule may extend a day.</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 tabular-nums">
              <div><dt className="text-[12.5px] text-(--d-muted)">Current job total</dt><dd className="font-semibold">{usd(before, true)}</dd></div>
              <div><dt className="text-[12.5px] text-(--d-muted)">New total</dt><dd className="font-semibold">{usd(before + co.amount, true)}</dd></div>
            </dl>
          </div>
          <p className="text-[13px] text-(--d-muted)">Hand the phone to {c.contact.split(" ")[0]} to sign with a finger.</p>
          <SignaturePad onChange={setInked} label={`${c.contact} signs here`} />
        </div>
      )}
    </Dialog>
  );
}
