"use client";

import { useId, useState } from "react";
import { diffDays } from "@/lib/demo/dates";
import { dayDate, shortDate } from "@/lib/demo/format";
import { coFor, fmtDays, invoicesFor, jobFinance } from "@/lib/demo/shop/derive";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Button, Pill, Tabs } from "../ui";
import { CrewTag, PhotoTile, StatusChip, usd } from "./bits";
import { useShop } from "./ShopProvider";

type Tab = "overview" | "money" | "changes" | "photos" | "permits";

export function BudgetBar({ label, budget, actual }: { label: string; budget: number; actual: number }) {
  const max = Math.max(budget, actual, 1);
  const over = actual > budget * 1.05;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums"><span className={over ? "font-semibold text-(--d-bad)" : ""}>{usd(actual)}</span> <span className="text-(--d-muted)">of {usd(budget)}</span></span>
      </div>
      <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-(--d-panel2)" role="img" aria-label={`${label}: ${usd(actual)} spent of ${usd(budget)} budget`}>
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(Math.min(actual, budget) / max) * 100}%`, background: "var(--d-c2)" }} />
        {over ? <span className="absolute inset-y-0 rounded-r-full bg-(--d-bad)" style={{ left: `${(budget / max) * 100}%`, width: `${((actual - budget) / max) * 100}%` }} /> : null}
        <span className="absolute inset-y-0 w-0.5 bg-(--d-text)" style={{ left: `${(budget / max) * 100}%` }} />
      </div>
    </div>
  );
}

export default function JobSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { book, seed, rows, job, customer, place, worker, open, addNote, message } = useShop();
  const j = job(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [note, setNote] = useState("");
  const noteId = useId();
  if (!j) return null;
  const c = customer(j.customer);
  const where = place(j);
  const t = seed.jobTypes.find((x) => x.key === j.type)!;
  const f = jobFinance(book, seed, j, rows);
  const inv = invoicesFor(rows, j.id);
  const cos = coFor(book, j.id);
  const photos = book.photos.filter((p) => p.job === j.id);
  const notes = book.notes.filter((n) => n.job === j.id);
  const permits = book.permits.filter((p) => p.job === j.id);
  const crew = seed.workers.filter((w) => w.crew === j.crew);
  const nextDay = j.days.find((d) => d >= book.anchor);

  return (
    <Dialog
      open
      drawer
      onClose={onClose}
      title={<span>{j.title}</span>}
      subtitle={<span className="flex flex-wrap items-center gap-2"><span className="tabular-nums">{j.no}</span><Pill tone={j.status === "In progress" ? "accent" : j.status === "Scheduled" ? "info" : "good"}>{j.status}</Pill>{f.over ? <Pill tone="bad">Over budget</Pill> : null}</span>}
      footer={
        <>
          <Button onClick={message}><Icon name="mail" size={18} />Message customer</Button>
          {j.status === "Scheduled" || j.status === "In progress" ? <Button variant="primary" onClick={() => open({ kind: "move", id: j.id })}><Icon name="calendar" size={18} />Move job</Button> : null}
        </>
      }
    >
      <div className="mb-4 grid gap-3 rounded-[12px] bg-(--d-panel2) p-3.5 text-[14px] sm:grid-cols-2">
        <div>
          <p className="font-semibold">{c.name}</p>
          <p className="text-(--d-muted)">{c.kind !== "Homeowner" ? `${c.contact} · ` : ""}<a className="underline underline-offset-2" href={`tel:${c.phone.replace(/\D/g, "")}`}>{c.phone}</a></p>
        </div>
        <div>
          <p className="flex items-center gap-1.5"><Icon name="pin" size={16} className="text-(--d-muted)" />{where.address}, {where.town}</p>
          <p className="mt-0.5"><CrewTag crew={j.crew} /></p>
        </div>
      </div>
      <Tabs<Tab>
        label="Job sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "money", label: "Money", count: inv.length },
          { value: "changes", label: "Change orders", count: cos.length },
          { value: "photos", label: "Photos & notes", count: photos.length },
          { value: "permits", label: "Permits", count: permits.length },
        ]}
      />
      {tab === "overview" ? (
        <div className="space-y-5 text-[14px]">
          <section>
            <h3 className="font-semibold">Scope</h3>
            <p className="mt-1 text-(--d-muted)">{j.scope}</p>
          </section>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-[12.5px] text-(--d-muted)">Start</p><p className="font-semibold">{shortDate(j.start)}</p></div>
            <div><p className="text-[12.5px] text-(--d-muted)">Finish</p><p className="font-semibold">{shortDate(j.end)}</p></div>
            <div><p className="text-[12.5px] text-(--d-muted)">Crew days</p><p className="font-semibold">{j.days.length}</p></div>
            <div><p className="text-[12.5px] text-(--d-muted)">Next on site</p><p className="font-semibold">{nextDay ? `${dayDate(nextDay)} ${j.startTime}` : "Done"}</p></div>
          </section>
          <section>
            <h3 className="font-semibold">Crew</h3>
            <ul className="mt-1 flex flex-wrap gap-2">{crew.map((w) => <li key={w.id}><Pill>{w.name} · {w.role}</Pill></li>)}</ul>
          </section>
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Budget vs. actual</h3>
              <span className="text-[12.5px] text-(--d-muted)">{Math.round(f.progress * 100)}% of crew days done</span>
            </div>
            <BudgetBar label="Materials" budget={f.budget.materials} actual={f.actual.materials} />
            <BudgetBar label={`Labor (${Math.round(f.actual.laborHours)} of ${f.budget.laborHours} hr)`} budget={f.budget.laborCost} actual={f.actual.laborCost} />
            {f.budget.subs ? <BudgetBar label="Subcontractors" budget={f.budget.subs} actual={f.actual.subs} /> : null}
            <p className="text-[13px] text-(--d-muted)">
              Contract {usd(f.total)} · {f.done ? "profit" : "projected profit"} <span className={f.margin < 0.2 ? "font-semibold text-(--d-warn)" : "font-semibold text-(--d-good)"}>{usd(f.profit)} ({Math.round(f.margin * 100)}%)</span>
            </p>
          </section>
        </div>
      ) : null}
      {tab === "money" ? (
        <div className="space-y-4 text-[14px]">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><dt className="text-[12.5px] text-(--d-muted)">Job total</dt><dd className="demo-display text-[19px]">{usd(f.total)}</dd></div>
            <div><dt className="text-[12.5px] text-(--d-muted)">Billed</dt><dd className="demo-display text-[19px]">{usd(f.billed)}</dd></div>
            <div><dt className="text-[12.5px] text-(--d-muted)">Collected</dt><dd className="demo-display text-[19px]">{usd(f.paid)}</dd></div>
            <div><dt className="text-[12.5px] text-(--d-muted)">Not billed yet</dt><dd className="demo-display text-[19px]">{usd(f.unbilled)}</dd></div>
          </dl>
          <ul className="divide-y divide-(--d-line)">
            {inv.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => open({ kind: "invoice", id: i.id })} className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left">
                  <span><span className="font-semibold">{i.no}</span> <span className="text-(--d-muted)">· {i.kind} · {shortDate(i.issued)}</span></span>
                  <span className="flex items-center gap-2"><span className="tabular-nums">{usd(i.amount)}</span><StatusChip status={i.status} /></span>
                </button>
              </li>
            ))}
            {!inv.length ? <li className="py-2 text-(--d-muted)">Nothing billed yet. {t.big ? "Deposit invoices go out when the estimate is signed." : "Invoiced when the work is done."}</li> : null}
          </ul>
        </div>
      ) : null}
      {tab === "changes" ? (
        <ul className="space-y-2 text-[14px]">
          {cos.map((co) => (
            <li key={co.id} className="rounded-[12px] border border-(--d-line) p-3.5">
              <div className="flex items-start justify-between gap-3">
                <span><span className="font-semibold">{co.title}</span><span className="block text-[12.5px] text-(--d-muted)">{co.no} · {shortDate(co.created)}</span></span>
                <span className="text-right"><span className="block font-semibold tabular-nums">{usd(co.amount)}</span><Pill tone={co.status === "Approved" ? "good" : co.status === "Declined" ? "neutral" : "warn"}>{co.status}</Pill></span>
              </div>
            </li>
          ))}
          {!cos.length ? <li className="text-(--d-muted)">No change orders on this job.</li> : null}
        </ul>
      ) : null}
      {tab === "photos" ? (
        <div className="space-y-5">
          <ul className="grid *:min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p) => <li key={p.id}><PhotoTile p={p} crew={j.crew} /></li>)}
          </ul>
          {!photos.length ? <p className="text-(--d-muted)">No photos yet.</p> : null}
          <Button variant="secondary" onClick={() => open({ kind: "quick", what: "photo", job: j.id })}><Icon name="camera" size={18} />Add photo</Button>
          <section>
            <h3 className="font-semibold">Notes</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addNote(j.id, note.trim()); setNote(""); } }} className="mt-2 flex gap-2">
              <label htmlFor={noteId} className="sr-only">Add a note</label>
              <input id={noteId} className="demo-input" placeholder="Add a note for the crew" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button type="submit" disabled={!note.trim()}>Add</Button>
            </form>
            <ul className="mt-2 space-y-1.5 text-[14px]">
              {notes.map((n) => <li key={n.id} className="rounded-[10px] bg-(--d-panel2) px-3 py-2">{n.text} <span className="text-[12px] text-(--d-muted)">· {worker(n.by).name}, {shortDate(n.date)}</span></li>)}
            </ul>
          </section>
        </div>
      ) : null}
      {tab === "permits" ? (
        <ul className="space-y-3 text-[14px]">
          {permits.map((p) => (
            <li key={p.id} className="rounded-[12px] border border-(--d-line) p-3.5">
              <p className="font-semibold">{p.kind} permit <span className="font-normal text-(--d-muted)">· {p.no} · {p.town}</span></p>
              <p className="text-[12.5px] text-(--d-muted)">Applied {shortDate(p.applied)} · {p.issued ? `issued ${shortDate(p.issued)}` : "waiting on the city"}</p>
              <ul className="mt-2 space-y-1">
                {p.inspections.map((i, k) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span>{i.kind} · {shortDate(i.date)} <span className="text-(--d-muted)">({fmtDays(diffDays(i.date, book.anchor))})</span></span>
                    <Pill tone={i.result === "Passed" ? "good" : i.result === "Failed" ? "bad" : "info"}>{i.result}</Pill>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {!permits.length ? <li className="text-(--d-muted)">No permit needed for this kind of work.</li> : null}
        </ul>
      ) : null}
    </Dialog>
  );
}
