"use client";

import { useState } from "react";
import { addDays } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import { sum } from "@/lib/demo/shop/derive";
import Icon from "../../Icon";
import { Card, PageHeader, Pill, Stat, Tabs } from "../../ui";
import { usd } from "../bits";
import { useShop } from "../ShopProvider";

type Tab = "pos" | "receipts" | "suppliers";

export default function Materials() {
  const { book, seed, job, open, worker } = useShop();
  const [tab, setTab] = useState<Tab>("pos");
  const y = addDays(book.anchor, -1);
  const since30 = addDays(book.anchor, -30);
  const spend30 = sum(book.pos.filter((p) => p.date >= since30 && p.date <= y), (p) => p.amount) + sum(book.receipts.filter((r) => r.date >= since30 && r.date <= y), (r) => r.amount);
  const openPos = book.pos.filter((p) => p.status !== "Billed");
  const liveJobs = book.jobs.filter((j) => j.status === "In progress" || j.status === "Scheduled");
  const byJob = [...liveJobs, ...book.jobs.filter((j) => j.end >= addDays(book.anchor, -30) && j.end < book.anchor)]
    .map((j) => ({ j, pos: book.pos.filter((p) => p.job === j.id) }))
    .filter((x) => x.pos.length)
    .slice(0, 12);
  const receipts = book.receipts.filter((r) => r.date <= y).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 24);
  const supplier = (id: string) => seed.suppliers.find((s) => s.id === id)!;
  return (
    <div className="space-y-5">
      <PageHeader title="Materials" meta="Purchase orders, receipts and suppliers. Every dollar lands on a job, so job costing stays honest." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Spent, last 30 days" value={usd(spend30)} sub="POs + receipts" />
        <Stat label="Open POs" value={String(openPos.length)} sub={usd(sum(openPos, (p) => p.amount))} />
        <Stat label="Receipts this month" value={String(book.receipts.filter((r) => r.date >= `${book.anchor.slice(0, 7)}-01` && r.date <= y).length)} sub="Snapped from the truck" />
      </div>
      <Tabs<Tab> label="Materials views" value={tab} onChange={setTab} tabs={[{ value: "pos", label: "Purchase orders" }, { value: "receipts", label: "Receipts" }, { value: "suppliers", label: "Suppliers", count: seed.suppliers.length }]} />
      {tab === "pos" ? (
        <ul className="grid *:min-w-0 gap-3 lg:grid-cols-2">
          {byJob.map(({ j, pos }) => (
            <li key={j.id} className="demo-card p-4">
              <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="min-h-11 text-left font-semibold underline-offset-2 hover:underline">{j.no} · {j.title}</button>
              <ul className="mt-1 divide-y divide-(--d-line) text-[14px]">
                {pos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0"><span className="block truncate">{p.items}</span><span className="block text-[12.5px] text-(--d-muted)">{p.no} · {supplier(p.supplier).name} · {shortDate(p.date)}</span></span>
                    <span className="shrink-0 text-right"><span className="block tabular-nums">{usd(p.amount)}</span><Pill tone={p.status === "Billed" ? "neutral" : p.status === "Delivered" ? "good" : "info"}>{p.status}</Pill></span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "receipts" ? (
        <ul className="grid *:min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {receipts.map((r) => (
            <li key={r.id} className="demo-card overflow-hidden">
              <div className="relative grid aspect-[3/4] place-items-center bg-[repeating-linear-gradient(0deg,var(--d-panel2)_0_14px,color-mix(in_oklab,var(--d-panel2)_70%,var(--d-line))_14px_15px)]" aria-hidden="true">
                <span className="grid w-3/5 gap-1.5 rounded-[4px] bg-(--d-panel) p-2 shadow">
                  <span className="h-1.5 w-2/3 rounded bg-(--d-line)" /><span className="h-1.5 w-full rounded bg-(--d-line)" /><span className="h-1.5 w-4/5 rounded bg-(--d-line)" /><span className="mt-1 h-2 w-1/2 justify-self-end rounded bg-(--d-c2)" />
                </span>
                <Icon name="camera" size={18} className="absolute right-2 bottom-2 text-(--d-muted)" />
              </div>
              <div className="p-3 text-[13px]">
                <p className="flex justify-between gap-2"><span className="truncate font-semibold">{supplier(r.supplier).name}</span><span className="tabular-nums">{usd(r.amount)}</span></p>
                <p className="truncate text-(--d-muted)">{r.note} · {job(r.job).no}</p>
                <p className="text-(--d-muted)">{shortDate(r.date)} · {worker(r.by).name.split(" ")[0]}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "suppliers" ? (
        <Card title="Suppliers, last 12 months">
          <ul className="divide-y divide-(--d-line)">
            {seed.suppliers.map((s) => {
              const spend = sum(book.pos.filter((p) => p.supplier === s.id && p.date >= book.windowStart && p.date <= y), (p) => p.amount) + sum(book.receipts.filter((r) => r.supplier === s.id && r.date >= book.windowStart && r.date <= y), (r) => r.amount);
              return (
                <li key={s.id} className="flex min-h-14 items-center justify-between gap-3 py-2 text-[14px]">
                  <span><span className="block font-semibold">{s.name}</span><span className="block text-[12.5px] text-(--d-muted)">{s.kind}</span></span>
                  <span className="font-semibold tabular-nums">{usd(spend)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
