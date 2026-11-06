"use client";

import { useState } from "react";
import { PhoneFrame } from "@demos/kit/blocks/PhoneFrame";
import { PhotoTile } from "@demos/kit/blocks/PhotoTile";
import { REVIEW_LINK } from "@demos/atwood/data";
import { DoorArt, money, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

/** What the homeowner gets in their text: the estimate, options, approve and pay. */
function Homeowner() {
  const { w, customer, notify } = useAt();
  const e = w.estimates.find((x) => x.status === "Viewed") ?? w.estimates[0];
  const c = customer(e.customer);
  const [pick, setPick] = useState(1);
  const [approved, setApproved] = useState(false);
  const o = e.options[pick];
  return (
    <div className="text-[#242424]">
      <p className="text-[12px] font-extrabold tracking-[0.08em] text-[#266e71]">ATWOOD DOOR CO.</p>
      <p className="text-[13px] text-[#555c5c]">Experience you can depend on</p>
      <h2 className="demo-display mt-3 text-[24px] leading-tight">Hi {c.contact.split(" ")[0]}, here&apos;s your estimate</h2>
      <p className="mt-1 text-[15px] text-[#555c5c]">{e.title} at {c.street}. Pick the one you like.</p>
      <div className="mt-3 space-y-2.5">
        {e.options.map((x, i) => (
          <button key={x.tier} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={`block w-full rounded-[14px] border-2 bg-white p-3 text-left ${pick === i ? "border-[#266e71]" : "border-[#d9dddc]"}`}>
            <span className="flex items-center gap-3">
              <DoorArt door={{ size: c.door.size, windows: i === 2, color: i === 2 ? "Desert tan" : "White", model: x.model }} className="w-20 shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold text-[#266e71]">{x.tier}{i === 1 ? ", most picked" : ""}</span><span className="block text-[15.5px] font-bold">{x.model}</span><span className="block text-[13.5px] text-[#555c5c]">{x.warranty}</span></span>
            </span>
            <span className="demo-display mt-2 block text-right text-[22px]">{money(x.price)}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-[14px] bg-[#eef5f5] p-3 text-[15px]">
        <p className="flex justify-between"><span>{o.tier} installed</span><span className="font-bold">{money(o.price)}</span></p>
        <p className="flex justify-between"><span>Deposit to order (30%)</span><span className="font-bold">{money(o.price * e.deposit)}</span></p>
      </div>
      {approved ? (
        <button type="button" onClick={() => notify(`Deposit of ${money(o.price * e.deposit)} paid by card (demo).`)} className="mt-3 min-h-14 w-full rounded-[14px] bg-[#266e71] text-[17px] font-bold text-white">Pay {money(o.price * e.deposit)} deposit</button>
      ) : (
        <button type="button" onClick={() => { setApproved(true); notify(`Approved: ${o.tier}. Atwood Door Co. gets a text right away (demo).`); }} className="mt-3 min-h-14 w-full rounded-[14px] bg-[#266e71] text-[17px] font-bold text-white">Approve {o.tier}</button>
      )}
      <button type="button" onClick={() => notify("Message sent to Atwood Door Co. (demo).")} className="mt-2 min-h-12 w-full rounded-[14px] border-2 border-[#d9dddc] bg-white text-[16px] font-bold">Ask a question</button>

      <h3 className="demo-display mt-6 mb-2 text-[19px]">Photos from your visit</h3>
      <div className="grid grid-cols-3 gap-2">{["Front", "Springs", "Opener"].map((t, i) => <PhotoTile key={t} id={`${e.id}-v${i}`} tag={t} caption="Photo placeholder" color="#266e71" size="sm" />)}</div>

      <div className="mt-6 rounded-[14px] border border-[#d9dddc] bg-white p-3">
        <p className="text-[15px] font-bold">Happy with the work?</p>
        <p className="text-[14px] text-[#555c5c]">A quick Google review means a lot to a one-man shop.</p>
        <button type="button" onClick={() => notify("Opens the Google review page (demo).")} className="mt-2 min-h-12 w-full rounded-[12px] bg-[#0e4042] text-[16px] font-bold text-white">Leave a review</button>
        <p className="mt-1 truncate text-[12.5px] text-[#555c5c]">{REVIEW_LINK}</p>
      </div>
    </div>
  );
}

export default function CustomerView() {
  return (
    <div className="space-y-4">
      <Title sub="Your customer gets a text with a link. No app, no login: pick a door, approve, pay the deposit, leave a review.">See what your customer sees</Title>
      <div className="-mx-4 bg-[#f7f9f9] px-4 py-5 md:hidden"><Homeowner /></div>
      <div className="hidden md:block"><PhoneFrame><Homeowner /></PhoneFrame></div>
    </div>
  );
}
