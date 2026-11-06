"use client";

import { useState } from "react";
import { PhoneFrame } from "@demos/kit/blocks/PhoneFrame";
import { RUN_STATUSES } from "@demos/simpletimes/catalog";
import { shortDay } from "@demos/simpletimes/derive";
import { Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** What a co-pack client sees: their runs, batch records and invoices. */
function Portal({ clientId }: { clientId: string }) {
  const { d, w, notify } = useSt();
  const c = w.clients.find((x) => x.id === clientId)!;
  const runs = w.runs.filter((r) => r.owner === c.id).slice(-5).reverse();
  const invoices = d.invoices.filter((i) => i.client === c.id).slice(-4).reverse();
  return (
    <div className="text-[#231f20]">
      <p className="text-[13.5px] text-[#5c5657]">Made by Simple Times Co-Packing</p>
      <p className="demo-display text-[30px] leading-none">{c.name}</p>
      <p className="mt-1 text-[15px] text-[#5c5657]">Hi {c.contact.name.split(" ")[0]}. Here&apos;s everything we&apos;re making for you.</p>

      <h3 className="demo-display mt-5 mb-2 text-[21px]">Your runs</h3>
      <ul className="space-y-2.5">
        {runs.map((r) => {
          const i = RUN_STATUSES.indexOf(r.status);
          return (
            <li key={r.id} className="rounded-[12px] border border-[#e0ddd8] bg-white p-3">
              <p className="flex items-start justify-between gap-2"><span className="text-[16px] font-semibold">{r.product}</span><span className="shrink-0 text-[14px] text-[#5c5657]">{shortDay(r.date)}</span></p>
              <p className="text-[14px] text-[#5c5657]">{r.bottles.toLocaleString("en-US")} bottles, {r.size}. {r.status === "QA hold" ? "Re-testing one QA check before release." : r.ship ? `Ships ${shortDay(r.ship)}.` : ""}</p>
              <ol className="mt-2 grid grid-cols-6 gap-1" aria-label={`Status: ${r.status}`}>
                {RUN_STATUSES.map((s, n) => <li key={s} className={`h-1.5 rounded-full ${n <= i ? (r.status === "QA hold" && n === i ? "bg-[#b8393a]" : "bg-[#2671a4]") : "bg-[#e0ddd8]"}`} />)}
              </ol>
              <p className="mt-1 text-[14px] font-semibold">{r.status}</p>
              {r.lots.length && r.status !== "Scheduled" ? <button type="button" onClick={() => notify(`Batch record for ${r.id} (PDF, demo).`)} className="mt-1 inline-flex min-h-12 items-center text-[15px] font-semibold text-[#2671a4]">Batch record and QA results</button> : null}
            </li>
          );
        })}
        {!runs.length ? <li className="text-[14px] text-[#5c5657]">No runs yet.</li> : null}
      </ul>

      <h3 className="demo-display mt-5 mb-2 text-[21px]">Invoices</h3>
      <ul className="divide-y divide-[#e0ddd8] rounded-[12px] border border-[#e0ddd8] bg-white">
        {invoices.map((i) => (
          <li key={i.id} className="flex min-h-14 items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0"><span className="block text-[15px] font-semibold">{i.id}</span><span className="block text-[13.5px] text-[#5c5657]">{shortDay(i.date)}</span></span>
            <span className="text-right">
              <span className="block text-[15px] font-semibold">{usd(i.amount)}</span>
              {i.paid ? <span className="text-[13.5px] text-[#2a6b3c]">Paid {shortDay(i.paid)}</span> : <button type="button" onClick={() => notify("Pay by card or ACH (demo).")} className="min-h-12 text-[15px] font-semibold text-[#2671a4]">Pay now</button>}
            </span>
          </li>
        ))}
        {!invoices.length ? <li className="p-3 text-[14px] text-[#5c5657]">No invoices yet.</li> : null}
      </ul>
      <button type="button" onClick={() => notify("Message sent to the Simple Times team (demo).")} className="mt-4 min-h-12 w-full rounded-[12px] bg-[#2671a4] text-[16px] font-semibold text-white">Message the team</button>
    </div>
  );
}

export default function ClientView() {
  const { w } = useSt();
  const live = w.clients.filter((c) => c.stage === "Production" || c.stage === "Repeat");
  const [id, setId] = useState(live[0].id);
  return (
    <div className="space-y-4">
      <Title sub="Each co-pack client gets their own login: run status, batch records and invoices, without calling you.">What your client sees</Title>
      <div role="radiogroup" aria-label="Client" className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1">
        {live.map((c) => <button key={c.id} type="button" role="radio" aria-checked={id === c.id} onClick={() => setId(c.id)} className={`min-h-12 shrink-0 rounded-full border px-4 text-[15px] ${id === c.id ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{c.name}</button>)}
      </div>
      <div className="-mx-4 bg-[#f6f7f8] px-4 py-5 md:hidden"><Portal clientId={id} /></div>
      <div className="hidden md:block"><PhoneFrame><Portal clientId={id} /></PhoneFrame></div>
    </div>
  );
}
