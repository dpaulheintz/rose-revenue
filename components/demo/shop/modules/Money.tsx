"use client";

import { useId, useMemo, useState } from "react";
import { addDays, diffDays } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import { aging, estimateTotal, INVOICE_STATUSES, jobTotal, sum, winRate, type InvoiceRow, type InvoiceStatus } from "@/lib/demo/shop/derive";
import type { EstimateStatus } from "@/lib/demo/shop/types";
import Icon from "../../Icon";
import { Button, Card, FilterChip, PageHeader, Pill, Stat, Tabs } from "../../ui";
import { n, StatusChip, usd } from "../bits";
import { useShop } from "../ShopProvider";

type Tab = "invoices" | "estimates" | "payments";

export default function Money() {
  const { rows, book } = useShop();
  const [tab, setTab] = useState<Tab>("invoices");
  const open = rows.filter((r) => r.balance > 0 && r.status !== "Draft");
  return (
    <div>
      <PageHeader title="Money" meta={`${usd(sum(open, (r) => r.balance))} outstanding on ${n(open.length, "invoice")} · ${book.estimates.filter((e) => e.status === "Sent" || e.status === "Viewed").length} estimates out`} />
      <Tabs<Tab>
        label="Money views"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "invoices", label: "Invoices", count: rows.length },
          { value: "estimates", label: "Estimates", count: book.estimates.length },
          { value: "payments", label: "Payments", count: book.payments.length },
        ]}
      />
      {tab === "invoices" ? <Invoices /> : tab === "estimates" ? <Estimates /> : <Payments />}
    </div>
  );
}

/* -------------------------------- invoices ---------------------------- */

function Invoices() {
  const { book, rows, customer, open, remind, seed } = useShop();
  const [status, setStatus] = useState<InvoiceStatus | "Open" | "All">("Open");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(30);
  const searchId = useId();
  const ages = aging(rows);
  const counts = useMemo(() => Object.fromEntries(INVOICE_STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])), [rows]);
  const list = rows
    .filter((r) => (status === "All" ? true : status === "Open" ? r.balance > 0 : r.status === status))
    .filter((r) => { const n = q.trim().toLowerCase(); return !n || `${r.no} ${customer(r.customer).name}`.toLowerCase().includes(n); })
    .sort((a, b) => (status === "Open" ? b.late - a.late || (a.issued < b.issued ? 1 : -1) : a.issued < b.issued ? 1 : -1));

  // Progress billing on the big jobs that are live or just finished.
  const big = book.jobs
    .filter((j) => seed.jobTypes.find((t) => t.key === j.type)!.big && (j.status === "In progress" || j.status === "Scheduled" || (j.end >= addDays(book.anchor, -45) && j.status !== "Paid")))
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <ul className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Aging">
        {ages.map((a, i) => (
          <li key={a.label} className="demo-card p-4">
            <p className="text-[13px] font-semibold text-(--d-muted)">{a.label} days</p>
            <p className={`demo-display mt-1 text-[24px] ${i >= 2 && a.amount > 0 ? "text-(--d-bad)" : ""}`}>{usd(a.amount)}</p>
            <p className="text-[12.5px] text-(--d-muted)">{a.count} invoice{a.count === 1 ? "" : "s"}</p>
          </li>
        ))}
      </ul>

      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip on={status === "Open"} onClick={() => setStatus("Open")} count={rows.filter((r) => r.balance > 0).length}>Open</FilterChip>
        {INVOICE_STATUSES.map((s) => <FilterChip key={s} on={status === s} onClick={() => setStatus(s)} count={counts[s]}>{s}</FilterChip>)}
        <FilterChip on={status === "All"} onClick={() => setStatus("All")} count={rows.length}>All</FilterChip>
      </div>
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">Search invoices</label>
        <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
        <input id={searchId} className="demo-input pl-10" placeholder="Search customer or invoice #" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* Phone: cards. */}
      <ul className="space-y-2 md:hidden">
        {list.slice(0, limit).map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => open({ kind: "invoice", id: r.id })} className="demo-card flex w-full items-start justify-between gap-3 p-4 text-left">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{customer(r.customer).name}</span>
                <span className="block text-[13px] text-(--d-muted)">{r.no} · {r.kind} · {shortDate(r.issued)}{r.late ? ` · ${r.late}d late` : ""}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{usd(r.balance > 0 ? r.balance : r.amount)}</span>
                <StatusChip status={r.status} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {/* Tablet + desktop: table. */}
      <div className="demo-card demo-scroll-x hidden md:block">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="text-[12.5px] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Issued</th>
              <th className="px-3 py-3 font-semibold">Due</th>
              <th className="px-3 py-3 text-right font-semibold">Amount</th>
              <th className="px-3 py-3 text-right font-semibold">Balance</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, limit).map((r) => (
              <tr key={r.id} className="border-b border-(--d-line) last:border-0 hover:bg-(--d-panel2)/60">
                <td className="px-4 py-1.5"><button type="button" onClick={() => open({ kind: "invoice", id: r.id })} className="min-h-12 text-left"><span className="block font-semibold underline-offset-2 hover:underline">{r.no}</span><span className="block text-[12.5px] text-(--d-muted)">{r.kind}</span></button></td>
                <td className="px-3 py-1.5">{customer(r.customer).name}</td>
                <td className="px-3 py-1.5">{shortDate(r.issued)}</td>
                <td className={`px-3 py-1.5 ${r.status === "Overdue" ? "font-semibold text-(--d-bad)" : ""}`}>{r.due === r.issued ? "On receipt" : shortDate(r.due)}{r.late && r.balance > 0 ? ` · ${r.late}d` : ""}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{usd(r.amount)}</td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{r.balance > 0 ? usd(r.balance) : "—"}</td>
                <td className="px-3 py-1.5"><StatusChip status={r.status} /></td>
                <td className="px-4 py-1.5 text-right">{r.status === "Overdue" ? <Button variant="ghost" onClick={() => remind(r.id)}>Remind</Button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length ? <p className="text-(--d-muted)">No invoices match.</p> : null}
      {list.length > limit ? <div className="flex justify-center"><Button onClick={() => setLimit((l) => l + 30)}>Show 30 more</Button></div> : null}

      <Card title="Deposits + progress billing on big jobs">
        <ul className="space-y-3">
          {big.map((j) => {
            const inv = rows.filter((r) => r.job === j.id);
            const total = jobTotal(book, j);
            const billed = sum(inv, (r) => r.amount);
            const paid = sum(inv, (r) => r.paid);
            return (
              <li key={j.id}>
                <button type="button" onClick={() => open({ kind: "job", id: j.id })} className="w-full rounded-[12px] border border-(--d-line) p-3.5 text-left hover:border-(--d-accent)">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{j.title} <span className="font-normal text-(--d-muted)">· {customer(j.customer).name}</span></span>
                    <span className="text-[13px] tabular-nums">{usd(paid)} paid · {usd(billed)} billed · <span className="font-semibold">{usd(total)}</span></span>
                  </span>
                  <span className="mt-2 flex h-3 overflow-hidden rounded-full bg-(--d-panel2)" role="img" aria-label={`${Math.round((paid / total) * 100)}% paid, ${Math.round((billed / total) * 100)}% billed`}>
                    <span style={{ width: `${(paid / total) * 100}%` }} className="bg-(--d-good)" />
                    <span style={{ width: `${((billed - paid) / total) * 100}%` }} className="bg-(--d-warn)" />
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {inv.map((r) => <Pill key={r.id} tone={r.status === "Paid" ? "good" : r.status === "Overdue" ? "bad" : "neutral"}>{r.kind} {usd(r.amount)}</Pill>)}
                    {total - billed > 1 ? <Pill>Still to bill {usd(total - billed)}</Pill> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[12.5px] text-(--d-muted)"><span className="mr-1 inline-block size-2.5 rounded-sm bg-(--d-good) align-middle" />Paid <span className="mr-1 ml-3 inline-block size-2.5 rounded-sm bg-(--d-warn) align-middle" />Billed, not paid. Deposits go out when the estimate is signed, progress at rough-in, the balance at completion.</p>
      </Card>
    </div>
  );
}

/* -------------------------------- estimates --------------------------- */

const EST_TONE: Record<EstimateStatus, "neutral" | "info" | "accent" | "good" | "bad" | "warn"> = { Draft: "neutral", Sent: "info", Viewed: "accent", Approved: "good", Declined: "bad", Expired: "neutral" };

function Estimates() {
  const { book, seed, customer, open } = useShop();
  const [status, setStatus] = useState<EstimateStatus | "Open" | "All">("Open");
  const wr = winRate(book);
  const est = book.estimates.slice().sort((a, b) => (a.created < b.created ? 1 : -1));
  const openEst = est.filter((e) => e.status === "Draft" || e.status === "Sent" || e.status === "Viewed");
  const list = est.filter((e) => (status === "All" ? true : status === "Open" ? openEst.includes(e) : e.status === status)).slice(0, 60);
  const total = (e: (typeof est)[number]) => estimateTotal(e, seed.taxRate);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Out for signature" value={usd(sum(openEst.filter((e) => e.status !== "Draft"), total))} sub={`${openEst.filter((e) => e.status !== "Draft").length} estimates`} />
          <Stat label="Win rate, 12 months" value={`${Math.round(wr.rate * 100)}%`} sub={`${wr.won} of ${wr.decided} decided`} />
          <Stat label="Waiting 3+ days" value={String(openEst.filter((e) => e.sent && diffDays(book.anchor, e.sent) > 3 && e.status !== "Draft").length)} sub="Worth a follow-up call" tone="warn" />
        </div>
      </div>
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => open({ kind: "estimate", id: null })}><Icon name="plus" size={18} />New estimate</Button>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip on={status === "Open"} onClick={() => setStatus("Open")} count={openEst.length}>Open</FilterChip>
        {(["Draft", "Sent", "Viewed", "Approved", "Declined", "Expired"] as const).map((s) => <FilterChip key={s} on={status === s} onClick={() => setStatus(s)} count={est.filter((e) => e.status === s).length}>{s}</FilterChip>)}
        <FilterChip on={status === "All"} onClick={() => setStatus("All")} count={est.length}>All</FilterChip>
      </div>
      <ul className="grid *:min-w-0 gap-2 lg:grid-cols-2">
        {list.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => open({ kind: "estimate", id: e.id })} className="demo-card flex w-full items-start justify-between gap-3 p-4 text-left hover:border-(--d-accent)">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{e.title}</span>
                <span className="block truncate text-[13px] text-(--d-muted)">{customer(e.customer).name} · {e.no} · {e.sent ? `sent ${shortDate(e.sent)}` : "not sent"}{e.options.length > 1 ? " · 3 options" : ""}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{usd(total(e))}</span>
                <Pill tone={EST_TONE[e.status]}>{e.status}</Pill>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- payments ---------------------------- */

function Payments() {
  const { book, rows, customer, open } = useShop();
  const since = addDays(book.anchor, -30);
  const recent = book.payments.filter((p) => p.date >= since).sort((a, b) => (a.date < b.date ? 1 : -1));
  const inv = new Map<string, InvoiceRow>(rows.map((r) => [r.id, r]));
  const methods = (["Card", "Check", "ACH", "Cash"] as const).map((m) => ({ m, v: sum(recent.filter((p) => p.method === m), (p) => p.amount) }));
  const total = sum(recent, (p) => p.amount);
  const deposits = recent.filter((p) => inv.get(p.invoice)?.kind === "Deposit");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Collected, last 30 days" value={usd(total)} sub={n(recent.length, "payment")} tone="good" />
        <Stat label="Deposits in" value={usd(sum(deposits, (p) => p.amount))} sub={`${deposits.length} signed jobs`} />
        <Stat label="Avg days to pay" value={String(Math.round(sum(recent, (p) => diffDays(p.date, inv.get(p.invoice)?.issued ?? p.date)) / Math.max(1, recent.length)))} sub="From invoice to money in" />
      </div>
      <Card title="How customers paid">
        <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label={methods.map((x) => `${x.m} ${Math.round((x.v / Math.max(1, total)) * 100)}%`).join(", ")}>
          {methods.map((x, i) => <span key={x.m} style={{ width: `${(x.v / Math.max(1, total)) * 100}%`, background: ["var(--d-c1)", "var(--d-c2)", "var(--d-c3)", "var(--d-c4)"][i] }} />)}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {methods.map((x, i) => <li key={x.m} className="flex items-center gap-2 text-[14px]"><span className="size-3 rounded-sm" style={{ background: ["var(--d-c1)", "var(--d-c2)", "var(--d-c3)", "var(--d-c4)"][i] }} aria-hidden="true" />{x.m} <span className="font-semibold">{usd(x.v)}</span></li>)}
        </ul>
      </Card>
      <Card title="Recent payments" bodyClass="p-0 pt-2">
        <ul className="divide-y divide-(--d-line)">
          {recent.slice(0, 40).map((p) => {
            const i = inv.get(p.invoice);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => i && open({ kind: "invoice", id: i.id })} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-(--d-panel2)/60 sm:px-5">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{i ? customer(i.customer).name : "—"}</span>
                    <span className="block text-[13px] text-(--d-muted)">{shortDate(p.date)} · {i?.no} · {p.ref}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-(--d-good)">+{usd(p.amount, true)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
