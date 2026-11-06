"use client";

import { useState, type ReactNode } from "react";
import { weekday } from "@demos/kit/data/dates";
import { DocumentPaper } from "@demos/kit/blocks/DocumentPaper";
import { PhotoTile } from "@demos/kit/blocks/PhotoTile";
import { ContactButtons } from "@demos/kit/ui/ContactButtons";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { Button, Field } from "@demos/kit/ui/ui";
import { EXPENSE_CATS, JOB_TYPES, jobType, PARTS, type Invoice, type JobType } from "@demos/atwood/data";
import { invoiceState, shortDay } from "@demos/atwood/derive";
import { Chip, DoorArt, DoorSpecs, money, PAY_TONE, reviewText, Stars } from "./bits";
import { useAt } from "./AtProvider";

export default function Sheets() {
  const { sheet, open } = useAt();
  if (!sheet) return null;
  const close = () => open(null);
  switch (sheet.kind) {
    case "job": return <JobSheet id={sheet.id} onClose={close} />;
    case "customer": return <CustomerSheet id={sheet.id} onClose={close} />;
    case "invoice": return <InvoiceSheet id={sheet.id} onClose={close} />;
    case "estimate": return <EstimateSheet id={sheet.id} onClose={close} />;
    case "pay": return <PaySheet id={sheet.id} onClose={close} />;
    case "newJob": return <NewJob customer={sheet.customer} onClose={close} />;
    case "newEstimate": return <NewEstimate customer={sheet.customer} onClose={close} />;
    case "expense": return <Expense onClose={close} />;
    case "review": return <ReviewSend onClose={close} />;
  }
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => <section className="mt-5"><h3 className="demo-display mb-2 text-[19px]">{title}</h3>{children}</section>;

function JobSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d, job, customer, open, finishJob, notify } = useAt();
  const j = job(id);
  const c = customer(j.customer);
  const state = j.invoice ? invoiceState(d.today, j.invoice) : null;
  const upcoming = !j.done;
  return (
    <Dialog open sheet onClose={onClose} title={`${jobType(j.type).label}`} subtitle={<span>{c.name}, {shortDay(j.date)} at {j.time}</span>}
      footer={upcoming ? (
        <>
          <Button onClick={() => open({ kind: "newJob", customer: `${c.id}|${j.id}` })}>Reschedule</Button>
          {j.date === d.today ? <Button onClick={() => finishJob(j.id)}>Mark done</Button> : null}
          <Button variant="primary" onClick={() => notify(`"On my way" texted to ${c.contact.split(" ")[0]} with your arrival time (demo).`)}><Icon name="truck" size={18} />On my way</Button>
        </>
      ) : state !== "Paid" ? <Button variant="primary" onClick={() => open({ kind: "pay", id: j.id })}><Icon name="dollar" size={18} />Take payment</Button> : <Button variant="primary" onClick={() => open({ kind: "invoice", id: j.id })}>View invoice</Button>}>
      <p className="text-[16px]">{c.street}, {c.town}</p>
      <button type="button" onClick={() => open({ kind: "customer", id: c.id })} className="mt-1 inline-flex min-h-12 items-center gap-1 text-[15.5px] font-bold text-(--d-accent)">Customer and door on file<Icon name="arrow" size={16} /></button>
      <div className="mt-2 flex items-center gap-3 rounded-[12px] border border-(--d-line) p-3">
        <DoorArt door={c.door} className="w-28 shrink-0" />
        <p className="text-[15px]"><span className="font-bold">{c.door.size} ft {c.door.color.toLowerCase()}</span><br />{c.door.model}<br /><span className="text-(--d-muted)">{c.door.springs}</span></p>
      </div>
      <Section title="Notes"><p className="text-[16px]">{j.notes}</p></Section>
      <Section title="Parts used">
        {j.parts.length ? <ul className="space-y-1.5">{j.parts.map((p) => <li key={p.part} className="flex justify-between gap-3 text-[15.5px]"><span className="min-w-0">{PARTS.find((x) => x.id === p.part)?.name}</span><span className="shrink-0 font-bold">× {p.qty}</span></li>)}</ul> : <p className="text-(--d-muted)">{upcoming ? "Added when the job is done." : "Labor only."}</p>}
      </Section>
      <Section title="Photos">
        {j.photos ? <div className="grid grid-cols-3 gap-2">{Array.from({ length: j.photos }, (_, i) => <PhotoTile key={i} id={`${j.id}-${i}`} tag={i ? "After" : "Before"} tagTone={i ? "good" : "neutral"} caption="Job photo placeholder" color="#266e71" size="sm" />)}</div> : <p className="text-(--d-muted)">Snap before and after photos on site.</p>}
      </Section>
      <Section title="Invoice">
        {j.invoice ? (
          <button type="button" onClick={() => open({ kind: "invoice", id: j.id })} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[12px] border border-(--d-line) px-4 text-left">
            <span><span className="block font-bold">{j.invoice.id}, {money(j.invoice.amount)}</span><span className="text-[14px] text-(--d-muted)">{j.invoice.paid ? `${j.invoice.method}, ${shortDay(j.invoice.paid)}` : `Due ${shortDay(j.invoice.due)}`}</span></span>
            <Chip tone={PAY_TONE[state!]}>{state}</Chip>
          </button>
        ) : <p className="text-[15.5px]">Quoted at {money(j.price)}. The invoice is made when you mark it done.</p>}
      </Section>
    </Dialog>
  );
}

function CustomerSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d, w, customer, open, notify } = useAt();
  const c = customer(id);
  const jobs = w.jobs.filter((j) => j.customer === c.id).reverse();
  const last = jobs.find((j) => j.done)?.date ?? d.lastService.get(c.id)!;
  const due = (Date.parse(d.today) - Date.parse(last)) / 864e5 > 365;
  return (
    <Dialog open sheet onClose={onClose} title={c.name} subtitle={<span className="flex flex-wrap items-center gap-2">{c.commercial ? <Chip tone="info">Commercial</Chip> : <Chip>Residential</Chip>}{due ? <Chip tone="warn">Due for tune-up</Chip> : null}</span>}
      footer={<><Button onClick={() => open({ kind: "newEstimate", customer: c.id })}>New estimate</Button><Button variant="primary" onClick={() => open({ kind: "newJob", customer: c.id })}>Book a job</Button></>}>
      <p className="text-[16px]">{c.street}, {c.town}{c.commercial ? `. Contact: ${c.contact}` : ""}</p>
      <p className="mb-3 text-[15px] text-(--d-muted)">{c.phone}</p>
      <ContactButtons name={c.contact.split(" ")[0]} phone={c.phone} email={c.email} onTap={(what) => notify(`${what}. (Demo: nothing is sent.)`)} />
      <Section title="Door profile">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <DoorArt door={c.door} className="mx-auto w-full max-w-[240px]" />
          <DoorSpecs door={c.door} today={d.today} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">{Array.from({ length: c.door.photos }, (_, i) => <PhotoTile key={i} id={`${c.id}-door-${i}`} tag={["Front", "Springs", "Opener", "Tracks"][i]} caption="Door photo placeholder" color="#266e71" size="sm" />)}</div>
      </Section>
      <Section title={`Job history (${jobs.length})`}>
        <ul className="divide-y divide-(--d-line)">
          {jobs.slice(0, 8).map((j) => (
            <li key={j.id}><button type="button" onClick={() => open({ kind: "job", id: j.id })} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-[15.5px]"><span className="min-w-0">{shortDay(j.date)}, {jobType(j.type).label}</span><span className="shrink-0 font-bold">{money(j.price)}</span></button></li>
          ))}
          {!jobs.length ? <li className="py-2 text-(--d-muted)">Last service {shortDay(last)}, {last.slice(0, 4)}. Nothing in the last year.</li> : null}
        </ul>
      </Section>
      <Section title="Notes"><p className="text-[16px]">{c.notes}</p></Section>
    </Dialog>
  );
}

function InvoiceSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d, job, customer, open, notify } = useAt();
  const j = job(id);
  const c = customer(j.customer);
  const inv = j.invoice!;
  const state = invoiceState(d.today, inv);
  const labor = Math.round(j.price * 0.55);
  return (
    <Dialog open sheet onClose={onClose} title={`Invoice ${inv.id}`} subtitle={<Chip tone={PAY_TONE[state]}>{state}</Chip>}
      footer={state === "Paid" ? <Button variant="primary" onClick={() => notify("Receipt texted to the customer (demo).")}>Text receipt</Button> : <><Button onClick={() => notify("Invoice texted with a pay link (demo).")}>Text invoice</Button><Button variant="primary" onClick={() => open({ kind: "pay", id: j.id })}>Take payment</Button></>}>
      <DocumentPaper
        ariaLabel={`Invoice ${inv.id}`} accent="#266e71" accentText="#1d5b5e" company="Atwood Door Co." tagline="Experience you can depend on" contact="Carroll, Ohio · (614) 555-0100 · office@example.com"
        title="Invoice" number={inv.id} meta={[`Date ${shortDay(inv.issued)}`, inv.paid ? `Paid ${shortDay(inv.paid)} by ${inv.method?.toLowerCase()}` : `Due ${shortDay(inv.due)}`]}
        parties={[{ label: "Bill to", lines: [{ text: c.name, tone: "strong" }, { text: `${c.street}, ${c.town}` }, { text: c.email, tone: "muted" }] }, { label: "Job", lines: [{ text: jobType(j.type).label, tone: "strong" }, { text: shortDay(j.date) }, { text: `${c.door.size} ft door`, tone: "muted" }] }]}
        lines={[{ desc: `${jobType(j.type).label}, labor`, amount: labor }, { desc: "Parts", sub: j.parts.map((p) => PARTS.find((x) => x.id === p.part)?.name).filter(Boolean).join(", ") || "Shop supplies", amount: j.price - labor }]}
        totals={[{ label: "Total", amount: j.price, kind: "total" }, ...(inv.paid ? [{ label: "Paid", amount: j.price, kind: "less" as const }] : []), { label: "Balance due", amount: inv.paid ? 0 : j.price, kind: "due" }]}
        footer="Thank you. Parts carry the maker's warranty; labor is covered for one year."
      />
    </Dialog>
  );
}

function PaySheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { job, takePayment, open } = useAt();
  const j = job(id);
  const [method, setMethod] = useState<NonNullable<Invoice["method"]>>("Card");
  return (
    <Dialog open sheet onClose={onClose} title="Take payment" subtitle={`${j.invoice?.id ?? j.id}, ${money(j.price)}`}
      footer={<Button variant="primary" className="w-full" onClick={() => { takePayment(j.id, method); open({ kind: "review" }); }}>Charge {money(j.price)}</Button>}>
      <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
        {(["Card", "Cash", "Check"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={`min-h-16 rounded-[12px] border-2 text-[17px] font-bold ${method === m ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_10%,white)]" : "border-(--d-line)"}`}>{m}</button>)}
      </div>
      <p className="mt-4 text-[15.5px] text-(--d-muted)">{method === "Card" ? "Tap, dip or type the card (concept). Nothing is charged in this demo." : method === "Check" ? "Snap a photo of the check for your records (concept)." : "Cash is logged with today's date."}</p>
    </Dialog>
  );
}

function EstimateSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { w, customer, setEstimate, notify } = useAt();
  const e = w.estimates.find((x) => x.id === id)!;
  const c = customer(e.customer);
  const [pick, setPick] = useState(e.chosen ?? 1);
  const o = e.options[pick];
  return (
    <Dialog open sheet onClose={onClose} title={e.title} subtitle={`${c.name}, ${e.id}. ${e.status}`}
      footer={e.status === "Approved" ? <Button variant="primary" onClick={() => notify(`Invoice for the ${money(o.price * e.deposit)} deposit texted (demo).`)}>Convert to invoice</Button> : <><Button onClick={() => notify("Reminder texted with the estimate link (demo).")}>Nudge</Button><Button variant="primary" onClick={() => { setEstimate(e.id, "Approved", pick); notify(`Marked approved: ${o.tier}. Deposit invoice ready.`); }}>Mark approved</Button></>}>
      <div className="space-y-2.5">
        {e.options.map((x, i) => (
          <button key={x.tier} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={`flex w-full items-center gap-3 rounded-[14px] border-2 p-3 text-left ${pick === i ? "border-(--d-accent)" : "border-(--d-line)"}`}>
            <DoorArt door={{ size: c.door.size, windows: i === 2, color: i === 2 ? "Desert tan" : "White", model: x.model }} className="w-24 shrink-0" />
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold text-(--d-muted)">{x.tier}</span><span className="block text-[16px] font-bold">{x.model}</span><span className="block text-[14px] text-(--d-muted)">{x.warranty}</span></span>
            <span className="demo-display shrink-0 text-[22px]">{money(x.price)}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[16px]">{o.tier}: {money(o.price)} installed. Deposit {Math.round(e.deposit * 100)}% ({money(o.price * e.deposit)}) to order the door.</p>
    </Dialog>
  );
}

function CustomerPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { d } = useAt();
  const list = [...d.customers].sort((a, b) => a.name.localeCompare(b.name));
  return <Field label="Customer"><select className="demo-input" value={value} onChange={(e) => onChange(e.target.value)}>{list.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.town}</option>)}</select></Field>;
}

function NewJob({ customer, onClose }: { customer?: string; onClose: () => void }) {
  const { d, job, customer: cust, addJob, reschedule, open, nextDays } = useAt();
  const [cid, moving] = (customer ?? "").split("|");
  const existing = moving ? job(moving) : null;
  const [c, setC] = useState(cid || d.customers[3].id);
  const [type, setType] = useState<JobType>(existing?.type ?? "repair");
  const days = nextDays(10).filter((x) => weekday(x) !== 0);
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState("9:30");
  return (
    <Dialog open sheet onClose={onClose} title={existing ? "Reschedule" : "New job"} footer={<Button variant="primary" className="w-full" onClick={() => { if (existing) { reschedule(existing.id, date, time); onClose(); } else open({ kind: "job", id: addJob(c, type, date, time) }); }}>{existing ? "Move it" : "Book it"}</Button>}>
      <div className="space-y-4">
        {existing ? <p className="text-[16px]">{jobType(existing.type).label} for {cust(existing.customer).name}, now {shortDay(existing.date)} at {existing.time}.</p> : (
          <>
            <CustomerPick value={c} onChange={setC} />
            <div className="grid grid-cols-2 gap-2">{JOB_TYPES.map((t) => <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)} className={`min-h-14 rounded-[12px] border-2 px-2 text-[15px] font-bold ${type === t.key ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_10%,white)]" : "border-(--d-line)"}`}>{t.label}</button>)}</div>
          </>
        )}
        <div><p className="mb-2 text-[15.5px] font-bold">Day</p><div className="demo-scroll-x -mx-5 flex gap-2 px-5 pb-1">{days.map((x) => <button key={x} type="button" aria-pressed={date === x} onClick={() => setDate(x)} className={`min-h-14 shrink-0 rounded-[12px] border-2 px-3 text-[15px] font-bold ${date === x ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line)"}`}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday(x)]} {shortDay(x)}</button>)}</div></div>
        <div><p className="mb-2 text-[15.5px] font-bold">Time</p><div className="grid grid-cols-3 gap-2">{["8:00", "9:30", "11:00", "12:30", "2:00", "3:30"].map((t) => <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`min-h-12 rounded-[12px] border-2 text-[16px] font-bold ${time === t ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line)"}`}>{t}</button>)}</div></div>
        <p className="text-[14.5px] text-(--d-muted)">The customer gets a confirmation text and a reminder the day before (demo).</p>
      </div>
    </Dialog>
  );
}

function NewEstimate({ customer, onClose }: { customer?: string; onClose: () => void }) {
  const { d, customer: cust, addEstimate, open } = useAt();
  const [c, setC] = useState(customer ?? d.customers[7].id);
  const [base, setBase] = useState(1900);
  const [opener, setOpener] = useState(true);
  const door = cust(c).door;
  const add = opener ? 520 : 0;
  const options = [
    { tier: "Good" as const, model: "Steel raised panel, non-insulated", price: base + add, insulated: "No", warranty: "Limited lifetime door, 1-year labor" },
    { tier: "Better" as const, model: "Steel raised panel, insulated R-12", price: Math.round((base * 1.35) / 10) * 10 + add, insulated: "R-12", warranty: "Limited lifetime door, 2-year labor" },
    { tier: "Best" as const, model: "Carriage house, insulated R-18, windows", price: Math.round((base * 1.9) / 10) * 10 + add, insulated: "R-18", warranty: "Limited lifetime door, 5-year labor" },
  ];
  return (
    <Dialog open sheet onClose={onClose} title="New estimate" footer={<Button variant="primary" className="w-full" onClick={() => open({ kind: "estimate", id: addEstimate({ customer: c, title: `New ${door.size} garage door${opener ? " and opener" : ""}`, options, deposit: 0.3 }) })}>Text it to the customer</Button>}>
      <div className="space-y-4">
        <CustomerPick value={c} onChange={setC} />
        <p className="text-[15.5px]">Door on file: {door.size} ft, {door.model.toLowerCase()}.</p>
        <Field label={`Base door price: ${money(base)}`}><input type="range" min={1400} max={3200} step={50} value={base} onChange={(e) => setBase(+e.target.value)} className="min-h-12 w-full accent-(--d-accent)" /></Field>
        <label className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px]"><input type="checkbox" className="size-6 accent-(--d-accent)" checked={opener} onChange={(e) => setOpener(e.target.checked)} />Add a belt-drive opener ({money(520)})</label>
        <ul className="space-y-2">{options.map((o) => <li key={o.tier} className="flex items-center justify-between gap-3 rounded-[12px] border border-(--d-line) px-4 py-3 text-[15.5px]"><span><span className="font-bold">{o.tier}</span><span className="block text-[14px] text-(--d-muted)">{o.model}</span></span><span className="demo-display text-[20px]">{money(o.price)}</span></li>)}</ul>
        <p className="text-[14.5px] text-(--d-muted)">30% deposit on approval to order the door.</p>
      </div>
    </Dialog>
  );
}

function Expense({ onClose }: { onClose: () => void }) {
  const { logExpense } = useAt();
  const [cat, setCat] = useState(EXPENSE_CATS[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState(false);
  return (
    <Dialog open sheet onClose={onClose} title="Log expense" footer={<Button variant="primary" className="w-full" disabled={!+amount} onClick={() => { logExpense(cat, +amount, note || cat, receipt); onClose(); }}>Save expense</Button>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">{EXPENSE_CATS.map((x) => <button key={x} type="button" aria-pressed={cat === x} onClick={() => setCat(x)} className={`min-h-14 rounded-[12px] border-2 px-2 text-[15px] font-bold ${cat === x ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_10%,white)]" : "border-(--d-line)"}`}>{x}</button>)}</div>
        <Field label="Amount"><input className="demo-input" inputMode="decimal" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} /></Field>
        <Field label="What for"><input className="demo-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Springs from the supplier" /></Field>
        <button type="button" onClick={() => setReceipt(true)} className={`flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed text-[16px] font-bold ${receipt ? "border-(--d-good) text-(--d-good)" : "border-(--d-line) text-(--d-muted)"}`}>
          <Icon name={receipt ? "check" : "camera"} size={26} />{receipt ? "Receipt photo attached (placeholder)" : "Snap the receipt"}
        </button>
      </div>
    </Dialog>
  );
}

function ReviewSend({ onClose }: { onClose: () => void }) {
  const { d, w, customer, askReview } = useAt();
  const ready = w.jobs.filter((j) => j.invoice?.paid && !j.review && (Date.parse(d.today) - Date.parse(j.invoice.paid)) / 864e5 <= 21).reverse();
  const [id, setId] = useState(ready[0]?.id ?? "");
  const j = ready.find((x) => x.id === id);
  const c = j ? customer(j.customer) : null;
  return (
    <Dialog open sheet onClose={onClose} title="Send review request" footer={j ? <Button variant="primary" className="w-full" onClick={() => { askReview([j.id]); onClose(); }}>Send text</Button> : null}>
      {ready.length ? (
        <div className="space-y-4">
          <Field label="Paid job"><select className="demo-input" value={id} onChange={(e) => setId(e.target.value)}>{ready.map((x) => <option key={x.id} value={x.id}>{customer(x.customer).name}, {jobType(x.type).label}, {shortDay(x.invoice!.paid!)}</option>)}</select></Field>
          <div className="rounded-[16px] rounded-br-[4px] bg-(--d-accent) p-4 text-[16px] text-white">{reviewText(c!.contact.split(" ")[0])}</div>
          <p className="flex items-center gap-2 text-[14.5px] text-(--d-muted)"><Stars n={5} size={14} />Written for you. Edit it if you like.</p>
        </div>
      ) : <p className="text-[16px]">Everyone paid in the last three weeks has been asked.</p>}
    </Dialog>
  );
}

