"use client";

import { useState } from "react";
import { dayDate, shortDate } from "@/lib/demo/format";
import { estimateTotal, jobFinance, optionTotals } from "@/lib/demo/shop/derive";
import { useDemo } from "../../DemoProvider";
import Icon from "../../Icon";
import { Card, PageHeader, Pill } from "../../ui";
import { PhoneFrame, PhotoTile, SignaturePad, usd } from "../bits";
import { useShop } from "../ShopProvider";

type Screen = "estimate" | "invoice" | "photos" | "schedule";

export default function Portal() {
  const { cfg, notify } = useDemo();
  const { book, seed, rows, customer, place, signCO } = useShop();
  // Live jobs with an estimate behind them make the best show-and-tell.
  // A job with a change order waiting on the homeowner is the best show-and-tell, then live jobs.
  const waiting = (id: string) => book.changeOrders.some((co) => co.job === id && co.status === "Awaiting signature");
  const candidates = book.jobs
    .filter((j) => j.estimate && (j.status === "In progress" || j.status === "Scheduled"))
    .sort((a, b) => Number(waiting(b.id)) - Number(waiting(a.id)) || Number(b.status === "In progress") - Number(a.status === "In progress") || b.contract - a.contract);
  const [jobId, setJobId] = useState(candidates[0]?.id ?? book.jobs.at(-1)!.id);
  const [screen, setScreen] = useState<Screen>("estimate");
  const [inked, setInked] = useState(false);
  const j = book.jobs.find((x) => x.id === jobId)!;
  const c = customer(j.customer);
  const est = book.estimates.find((e) => e.id === j.estimate);
  const pending = book.changeOrders.find((co) => co.job === j.id && co.status === "Awaiting signature");
  const inv = rows.filter((r) => r.job === j.id && r.status !== "Draft");
  const due = inv.find((r) => r.balance > 0) ?? inv.at(-1);
  const photos = book.photos.filter((p) => p.job === j.id);
  const f = jobFinance(book, seed, j, rows);
  const next = j.days.filter((d) => d >= book.anchor).slice(0, 5);
  const where = place(j);

  return (
    <div className="space-y-5">
      <PageHeader title="Customer view" meta="See what your customer sees: their estimate, signatures, invoices and progress photos, on their phone. No app to install." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <Card title="Pick a job">
            <ul className="space-y-2">
              {candidates.slice(0, 6).map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => { setJobId(x.id); setInked(false); }} aria-pressed={jobId === x.id} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[12px] border px-3.5 text-left ${jobId === x.id ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_12%,transparent)]" : "border-(--d-line)"}`}>
                    <span className="min-w-0"><span className="block truncate font-semibold">{customer(x.customer).name}</span><span className="block truncate text-[13px] text-(--d-muted)">{x.title} · {x.status}</span></span>
                    <span className="shrink-0 font-semibold tabular-nums">{usd(x.contract)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="What it does for you">
            <ul className="space-y-2.5 text-[14px]">
              {[
                ["Fewer calls", "Customers check the schedule and photos themselves instead of calling the office."],
                ["Faster yes", "They pick good/better/best and sign on the phone; the deposit invoice goes out on its own."],
                ["Faster money", "Pay by card or bank transfer from the invoice link. Payments land in Money."],
                ["Change orders in writing", "Extras get signed before the work, so the final invoice never surprises anyone."],
              ].map(([h, p]) => (
                <li key={h} className="flex gap-3"><Icon name="check" className="mt-0.5 text-(--d-accent)" /><span><span className="font-semibold">{h}.</span> <span className="text-(--d-muted)">{p}</span></span></li>
              ))}
            </ul>
          </Card>
        </div>

        <PhoneFrame>
          <header className="flex items-center gap-2.5 border-b border-[#e3e6e9] pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cfg.brand!.logo} alt="" width={36} height={36} className="rounded-full" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">Hi {c.contact.split(" ")[0]}</p>
              <p className="truncate text-[11.5px] text-[#545b63]">{j.title} · {where.address}</p>
            </div>
          </header>
          <nav className="mt-3 grid grid-cols-4 gap-1 rounded-[10px] bg-[#e9ecef] p-1 text-[12px] font-semibold" aria-label="Customer portal sections">
            {(["estimate", "invoice", "photos", "schedule"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setScreen(s)} aria-pressed={screen === s} className={`min-h-10 rounded-[8px] ${screen === s ? "bg-white shadow-sm" : "text-[#545b63]"}`}>{s[0].toUpperCase() + s.slice(1)}</button>
            ))}
          </nav>

          {screen === "estimate" && est ? (
            <section className="mt-4 space-y-3 text-[13.5px]">
              <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">Estimate {est.no}</p>
              {est.options.length > 1 ? (
                <ul className="space-y-1.5">
                  {est.options.map((o, i) => (
                    <li key={o.name} className={`flex items-center justify-between rounded-[10px] border p-2.5 ${i === est.chosen ? "border-[#ea8a45] bg-[#fff4ec]" : "border-[#e3e6e9]"}`}>
                      <span><span className="font-semibold">{o.name}</span>{i === est.chosen ? <span className="ml-1.5 text-[11.5px] font-semibold text-[#b4561a]">Your pick</span> : null}</span>
                      <span className="font-semibold tabular-nums">{usd(optionTotals(o, seed.taxRate).total)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="font-semibold">{usd(estimateTotal(est, seed.taxRate))}</p>}
              <p className="flex items-center gap-1.5 rounded-[10px] bg-[#e8f5ee] p-2.5 font-semibold text-[#1e7a4c]"><Icon name="check" size={16} />Signed {est.decided ? shortDate(est.decided) : ""}</p>
              {pending ? (
                <div className="rounded-[10px] border-2 border-[#ea8a45] p-3">
                  <p className="font-bold">Change order {pending.no}</p>
                  <p className="mt-0.5 text-[#545b63]">{pending.title}: adds {usd(pending.amount, true)}.</p>
                  <div className="mt-2"><SignaturePad onChange={setInked} label="Sign with your finger" /></div>
                  <button type="button" disabled={!inked} onClick={() => signCO(pending.id)} className="mt-1 min-h-12 w-full rounded-[10px] bg-[#ea8a45] font-bold text-[#17110b] disabled:opacity-40">Approve change order</button>
                </div>
              ) : <p className="text-[12.5px] text-[#545b63]">Nothing waiting for your signature.</p>}
            </section>
          ) : null}

          {screen === "invoice" ? (
            <section className="mt-4 space-y-3 text-[13.5px]">
              {due ? (
                <>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">Invoice {due.no} · {due.kind}</p>
                  <p className="text-[30px] font-extrabold tabular-nums leading-none">{usd(due.balance > 0 ? due.balance : due.amount, true)}</p>
                  <p className="text-[#545b63]">{due.balance > 0 ? (due.due < book.anchor ? `Was due ${shortDate(due.due)}` : `Due ${shortDate(due.due)}`) : `Paid ${due.payments.at(-1) ? shortDate(due.payments.at(-1)!.date) : ""}. Thank you!`}</p>
                  {due.balance > 0 ? <button type="button" onClick={() => notify()} className="min-h-12 w-full rounded-[10px] bg-[#ea8a45] font-bold text-[#17110b]">Pay {usd(due.balance, true)}</button> : null}
                  <p className="text-[12px] text-[#545b63]">Card or bank transfer. Job total {usd(f.total, true)} · paid so far {usd(f.paid, true)}.</p>
                </>
              ) : <p className="text-[#545b63]">No invoices yet. Your deposit invoice arrives when you sign.</p>}
            </section>
          ) : null}

          {screen === "photos" ? (
            <section className="mt-4">
              <ul className="grid *:min-w-0 grid-cols-2 gap-2">{photos.slice(0, 8).map((p) => <li key={p.id}><PhotoTile p={p} crew={j.crew} size="sm" /></li>)}</ul>
              {!photos.length ? <p className="text-[13.5px] text-[#545b63]">Photos show up here as the crew works.</p> : null}
            </section>
          ) : null}

          {screen === "schedule" ? (
            <section className="mt-4 space-y-2 text-[13.5px]">
              <p className="text-[11px] font-bold tracking-[0.12em] text-[#545b63] uppercase">Crew on site</p>
              {next.map((d) => <p key={d} className="flex justify-between rounded-[10px] bg-white p-2.5"><span className="font-semibold">{dayDate(d)}</span><span className="text-[#545b63]">from {j.startTime} am</span></p>)}
              {!next.length ? <p className="text-[#545b63]">All done. Thanks for having us!</p> : null}
            </section>
          ) : null}
          <p className="mt-5 text-center text-[11px] text-[#7a8189]">Act 2 Mechanical · All jobs for all people</p>
        </PhoneFrame>
      </div>
      <p className="text-[12.5px] text-(--d-muted)">Signing here updates the job in {cfg.company.appName} right away (try it, then open the job).<Pill className="ml-2">Concept</Pill></p>
    </div>
  );
}
