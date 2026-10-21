"use client";

import { useId, useMemo, useState } from "react";
import { diffDays } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import { customerView, sum, type CustomerRow } from "@/lib/demo/shop/derive";
import type { CustomerKind, Lead, LeadStage } from "@/lib/demo/shop/types";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import Kanban from "../../Kanban";
import { Avatar, Button, Card, Field, FilterChip, PageHeader, Pill, Tabs } from "../../ui";
import { n, StatusChip, usd } from "../bits";
import { useShop } from "../ShopProvider";

type Tab = "customers" | "leads";
const STAGES: LeadStage[] = ["New", "Contacted", "Estimate sent", "Won", "Lost"];

export default function Customers() {
  const { book } = useShop();
  const [tab, setTab] = useState<Tab>("customers");
  const openLeads = book.leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost").length;
  return (
    <div>
      <PageHeader title="Customers" meta={`${book.customers.filter((c) => c.kind === "Homeowner").length} homeowners · ${book.customers.filter((c) => c.kind !== "Homeowner").length} property managers + builders · ${openLeads} open leads`} />
      <Tabs<Tab> label="Customer views" value={tab} onChange={setTab} tabs={[{ value: "customers", label: "Customers", count: book.customers.length }, { value: "leads", label: "Leads", count: openLeads }]} />
      {tab === "customers" ? <CustomerList /> : <Leads />}
    </div>
  );
}

function CustomerList() {
  const { book, rows } = useShop();
  const all = useMemo(() => customerView(book, rows), [book, rows]);
  const [kind, setKind] = useState<CustomerKind | "All" | "Balance">("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"ltv" | "last" | "balance" | "name">("ltv");
  const [limit, setLimit] = useState(40);
  const [openId, setOpenId] = useState<string | null>(null);
  const searchId = useId();
  const list = all
    .filter((x) => (kind === "All" ? true : kind === "Balance" ? x.open > 0 : x.c.kind === kind))
    .filter((x) => { const n = q.trim().toLowerCase(); return !n || `${x.c.name} ${x.c.contact} ${x.c.properties.map((p) => `${p.address} ${p.town}`).join(" ")}`.toLowerCase().includes(n); })
    .sort((a, b) => (sort === "ltv" ? b.ltv - a.ltv : sort === "balance" ? b.open - a.open : sort === "last" ? ((b.lastJob ?? "") > (a.lastJob ?? "") ? 1 : -1) : a.c.name.localeCompare(b.c.name)));
  return (
    <>
      <div className="demo-scroll-x -mx-4 mb-3 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {(["All", "Homeowner", "Property manager", "Builder", "Balance"] as const).map((k) => (
          <FilterChip key={k} on={kind === k} onClick={() => { setKind(k); setLimit(40); }} count={k === "All" ? all.length : k === "Balance" ? all.filter((x) => x.open > 0).length : all.filter((x) => x.c.kind === k).length}>
            {k === "All" ? "Everyone" : k === "Balance" ? "Open balance" : `${k}s`}
          </FilterChip>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <label htmlFor={searchId} className="sr-only">Search customers</label>
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
          <input id={searchId} className="demo-input pl-10" placeholder="Name, street or town" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Field label="Sort by" className="w-44">
          <select className="demo-input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="ltv">Lifetime value</option>
            <option value="last">Last job</option>
            <option value="balance">Open balance</option>
            <option value="name">Name</option>
          </select>
        </Field>
      </div>
      <ul className="grid *:min-w-0 gap-2 lg:grid-cols-2">
        {list.slice(0, limit).map((x) => (
          <li key={x.c.id}>
            <button type="button" onClick={() => setOpenId(x.c.id)} className="demo-card flex w-full items-start gap-3 p-4 text-left hover:border-(--d-accent)">
              <Avatar name={x.c.name} size={40} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2"><span className="truncate font-semibold">{x.c.name}</span><span className="shrink-0 font-semibold tabular-nums">{usd(x.ltv)}</span></span>
                <span className="block truncate text-[13px] text-(--d-muted)">{x.c.kind === "Homeowner" ? `${x.c.properties[0].address}, ${x.c.properties[0].town}` : `${x.c.contact} · ${x.c.properties.length} properties`}</span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  <Pill tone={x.c.kind === "Homeowner" ? "neutral" : x.c.kind === "Builder" ? "info" : "accent"}>{x.c.kind}</Pill>
                  {x.open > 0 ? <Pill tone={x.invoices.some((i) => i.status === "Overdue") ? "bad" : "warn"}>Owes {usd(x.open)}</Pill> : null}
                  {x.nextJob ? <Pill tone="good">Next job {shortDate(x.nextJob)}</Pill> : x.lastJob ? <Pill>Last job {shortDate(x.lastJob)}</Pill> : <Pill>Past customer</Pill>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {list.length > limit ? <div className="mt-4 flex justify-center"><Button onClick={() => setLimit((l) => l + 40)}>Show 40 more</Button></div> : null}
      {openId ? <CustomerDrawer row={all.find((x) => x.c.id === openId)!} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

function CustomerDrawer({ row, onClose }: { row: CustomerRow; onClose: () => void }) {
  const { open, message, seed } = useShop();
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const noteId = useId();
  const c = row.c;
  const first = c.contact.split(" ")[0];
  const overdue = row.invoices.filter((i) => i.status === "Overdue");
  const suggestion = overdue.length
    ? `Hi ${first}, quick note from Act 2. Invoice ${overdue[0].no} for ${usd(overdue[0].balance, true)} is past due. You can pay by card from the link in the invoice, or reply and I'll call. Thanks!`
    : row.nextJob
      ? `Hi ${first}, just confirming we're on the schedule for ${shortDate(row.nextJob)}. The crew will be there around 7:30. Reply here with any questions.`
      : `Hi ${first}, it's been a while since we were out at your place. If anything's come up (furnace check before winter, a small repair), reply here and we'll get you on the schedule.`;
  return (
    <Dialog
      open
      drawer
      onClose={onClose}
      title={c.name}
      subtitle={<span className="flex flex-wrap gap-1.5"><Pill tone={c.kind === "Homeowner" ? "neutral" : "accent"}>{c.kind}</Pill><Pill>Since {c.since.slice(0, 4)}</Pill><Pill>{c.source}</Pill></span>}
      footer={draft == null ? <Button variant="primary" onClick={() => setDraft(suggestion)}><Icon name="mail" size={18} />Message {first}</Button> : undefined}
    >
      <div className="space-y-6 text-[14px]">
        {draft != null ? (
          <section className="rounded-[12px] border-2 border-(--d-accent) p-4">
            <h3 className="font-semibold">Text message</h3>
            <textarea aria-label="Message text" className="demo-input mt-2 min-h-32" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="mt-2 flex justify-end gap-2"><Button onClick={() => setDraft(null)}>Discard</Button><Button variant="primary" onClick={() => { setDraft(null); message(); }}>Send text</Button></div>
          </section>
        ) : null}
        <dl className="grid grid-cols-2 gap-3">
          <div><dt className="text-[12.5px] text-(--d-muted)">Lifetime value</dt><dd className="demo-display text-[22px]">{usd(row.ltv)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Open balance</dt><dd className={`demo-display text-[22px] ${row.open > 0 ? "text-(--d-bad)" : ""}`}>{usd(row.open)}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Contact</dt><dd className="font-semibold">{c.contact}</dd></div>
          <div><dt className="text-[12.5px] text-(--d-muted)">Phone</dt><dd><a className="inline-flex min-h-11 items-center text-(--d-accent) underline underline-offset-2" href={`tel:${c.phone.replace(/\D/g, "")}`}>{c.phone}</a></dd></div>
          <div className="col-span-2 min-w-0"><dt className="text-[12.5px] text-(--d-muted)">Email</dt><dd className="truncate">{c.email}</dd></div>
        </dl>
        <section>
          <h3 className="font-semibold">Properties</h3>
          <ul className="mt-1.5 space-y-1">{c.properties.map((p) => <li key={p.id} className="flex items-center gap-2"><Icon name="pin" size={16} className="text-(--d-muted)" />{p.address}, {p.town}</li>)}</ul>
        </section>
        <section>
          <h3 className="font-semibold">Jobs</h3>
          <ul className="mt-1.5 divide-y divide-(--d-line)">
            {row.jobs.slice(0, 10).map((j) => (
              <li key={j.id}><button type="button" onClick={() => open({ kind: "job", id: j.id })} className="flex min-h-12 w-full items-center justify-between gap-3 py-1.5 text-left"><span><span className="font-semibold">{j.title}</span> <span className="text-(--d-muted)">· {j.no} · {shortDate(j.start)}</span></span><Pill tone={j.status === "Paid" ? "good" : j.status === "In progress" ? "accent" : j.status === "Scheduled" ? "info" : "neutral"}>{j.status}</Pill></button></li>
            ))}
            {!row.jobs.length ? <li className="py-1.5 text-(--d-muted)">No jobs in the last year{c.priorSpend ? ` (${usd(c.priorSpend)} before that)` : ""}.</li> : null}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Invoices</h3>
          <ul className="mt-1.5 divide-y divide-(--d-line)">
            {row.invoices.slice().reverse().slice(0, 8).map((i) => (
              <li key={i.id}><button type="button" onClick={() => open({ kind: "invoice", id: i.id })} className="flex min-h-12 w-full items-center justify-between gap-3 py-1.5 text-left"><span>{i.no} <span className="text-(--d-muted)">· {i.kind} · {shortDate(i.issued)}</span></span><span className="flex items-center gap-2 tabular-nums">{usd(i.amount)}<StatusChip status={i.status} /></span></button></li>
            ))}
            {!row.invoices.length ? <li className="py-1.5 text-(--d-muted)">No invoices in the last year.</li> : null}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Notes</h3>
          <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { setNotes((n) => [note.trim(), ...n]); setNote(""); message(); } }} className="mt-1.5 flex gap-2">
            <label htmlFor={noteId} className="sr-only">Add a note</label>
            <input id={noteId} className="demo-input" placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" disabled={!note.trim()}>Add</Button>
          </form>
          <ul className="mt-2 space-y-1.5">
            {notes.map((n, i) => <li key={i} className="rounded-[10px] bg-(--d-panel2) px-3 py-2">{n} <span className="text-[12px] text-(--d-muted)">· you, today</span></li>)}
            {c.note ? <li className="rounded-[10px] bg-(--d-panel2) px-3 py-2">{c.note}</li> : null}
          </ul>
        </section>
        <p className="text-[12.5px] text-(--d-muted)">{n(row.jobs.length, "job")} · {seed.jobTypes.filter((t) => row.jobs.some((j) => j.type === t.key)).map((t) => t.label).join(", ") || "—"}</p>
      </div>
    </Dialog>
  );
}

function Leads() {
  const { book, seed, setLeadStage, open } = useShop();
  const t = book.anchor;
  const leads = book.leads;
  const bySource = seed.sources.map((s) => {
    const xs = leads.filter((l) => l.source === s.name);
    const won = xs.filter((l) => l.stage === "Won");
    return { s: s.name, n: xs.length, won: won.length, value: sum(won, (l) => l.value) };
  });
  const label = (k: string) => seed.jobTypes.find((x) => x.key === k)?.label ?? k;
  return (
    <div className="space-y-5">
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => open({ kind: "quick", what: "lead" })}><Icon name="plus" size={18} />New lead</Button>
      <Kanban<Lead, LeadStage>
        items={leads}
        columns={STAGES}
        statusOf={(l) => l.stage}
        onMove={setLeadStage}
        columnLabel={(s) => <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${s === "Won" ? "bg-[color-mix(in_oklab,var(--d-good)_18%,transparent)] text-(--d-good)" : s === "Lost" ? "bg-(--d-panel) text-(--d-muted)" : "bg-[color-mix(in_oklab,var(--d-accent)_18%,transparent)] text-(--d-accent)"}`}>{s}</span>}
        renderCard={(l, grip) => {
          const due = l.followUp ? diffDays(l.followUp, t) : null;
          return (
            <div className="p-2.5">
              <div className="flex items-start gap-1">
                {grip}
                <div className="min-w-0 flex-1 pt-2">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="truncate text-[13px] text-(--d-muted)">{label(l.type)} · {l.town}</p>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-1">
                <Pill>{usd(l.value)}</Pill>
                <Pill tone="info">{l.source}</Pill>
                {due != null && l.stage !== "Won" && l.stage !== "Lost" ? <Pill tone={due <= 0 ? "warn" : "neutral"}>{due < 0 ? `Follow up ${-due}d late` : due === 0 ? "Follow up today" : `Follow up ${shortDate(l.followUp!)}`}</Pill> : null}
              </div>
              {l.estimate ? <button type="button" onClick={() => open({ kind: "estimate", id: l.estimate! })} className="mt-1 ml-1 inline-flex min-h-11 items-center text-[13px] font-semibold text-(--d-accent)">Open estimate</button> : <p className="mt-1 pl-1 text-[12.5px] text-(--d-muted)">{l.note}</p>}
            </div>
          );
        }}
      />
      <Card title="Where leads come from">
        <ul className="grid *:min-w-0 gap-3 sm:grid-cols-4">
          {bySource.map((x) => (
            <li key={x.s} className="rounded-[12px] border border-(--d-line) p-3.5">
              <p className="font-semibold">{x.s}</p>
              <p className="text-[13px] text-(--d-muted)">{n(x.n, "lead")} · {x.won} won</p>
              <p className="demo-display mt-1 text-[20px]">{usd(x.value)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] text-(--d-muted)">Last 45 days. Drag a lead&apos;s grip to move it along the pipeline.</p>
      </Card>
    </div>
  );
}
