"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { Account, AccountStatus, Visit, VisitType } from "@/lib/demo/generate";
import { accountRevenue, lastVisitMap, nextFollowUp, placements } from "@/lib/demo/derive";
import { addDays, diffDays } from "@/lib/demo/dates";
import { moneyK, num, shortDate } from "@/lib/demo/format";
import { useDemo } from "../DemoProvider";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Avatar, Button, Chip, Field, PageHeader, Pill, Segmented, type Tone } from "../ui";

const STATUS_TONE: Record<AccountStatus, Tone> = { Active: "good", "At risk": "warn", Prospect: "info", Lost: "neutral" };
const VISIT_TYPES: VisitType[] = ["Tasting", "Placement", "Staff training", "Event activation", "Follow-up"];
const VISIT_TONE: Record<VisitType, Tone> = { Tasting: "accent", Placement: "good", "Staff training": "info", "Event activation": "warn", "Follow-up": "neutral" };

type Tab = "accounts" | "visits" | "contacts";

export default function Crm() {
  const { ds } = useDemo();
  const [tab, setTab] = useState<Tab>("accounts");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? ds.accounts.find((a) => a.id === openId) ?? null : null;

  return (
    <>
      <PageHeader
        title="CRM"
        meta={`${ds.accounts.length} accounts across TX, AR, LA & FL · ${ds.contacts.length} contacts`}
        actions={
          <Segmented<Tab>
            label="CRM view"
            value={tab}
            onChange={setTab}
            options={[{ value: "accounts", label: "Accounts" }, { value: "visits", label: "Visits" }, { value: "contacts", label: "Contacts" }]}
          />
        }
      />
      {tab === "accounts" ? <Accounts onOpen={setOpenId} /> : tab === "visits" ? <Visits onOpen={setOpenId} /> : <Contacts onOpen={setOpenId} />}
      <AccountDrawer account={open} onClose={() => setOpenId(null)} />
    </>
  );
}

/* ------------------------------ accounts ------------------------------ */

type Sort = "name" | "lastVisit" | "followUp" | "revenue";

function Accounts({ onOpen }: { onOpen: (id: string) => void }) {
  const { cfg, ds, visits, anchor, person } = useDemo();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [market, setMarket] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [rep, setRep] = useState("");
  const [sort, setSort] = useState<Sort>("revenue");
  const [showFilters, setShowFilters] = useState(false);

  const lastVisit = useMemo(() => lastVisitMap(visits), [visits]);
  const revenue = useMemo(() => accountRevenue(ds), [ds]);
  const marketName = (id: string) => cfg.markets.find((m) => m.id === id)!.name;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = ds.accounts
      .filter((a) => (!needle || `${a.name} ${a.city}`.toLowerCase().includes(needle)) && (!st || a.state === st) && (!market || a.marketId === market) && (!type || a.type === type) && (!status || a.status === status) && (!rep || a.repId === rep))
      .map((a) => ({ a, last: lastVisit.get(a.id), next: nextFollowUp(a, lastVisit.get(a.id), anchor), rev: revenue.get(a.id)?.revenue ?? 0 }));
    const cmp: Record<Sort, (x: (typeof list)[number], y: (typeof list)[number]) => number> = {
      name: (x, y) => x.a.name.localeCompare(y.a.name),
      lastVisit: (x, y) => (y.last ?? "").localeCompare(x.last ?? ""),
      followUp: (x, y) => x.next.localeCompare(y.next),
      revenue: (x, y) => y.rev - x.rev,
    };
    return list.sort(cmp[sort]);
  }, [ds, q, st, market, type, status, rep, sort, lastVisit, revenue, anchor]);

  const activeFilters = [st, market, type, status, rep].filter(Boolean).length;
  const clear = () => { setSt(""); setMarket(""); setType(""); setStatus(""); setRep(""); setQ(""); };

  return (
    <div className="space-y-4">
      <div className="demo-card space-y-3 p-3 sm:p-4">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search accounts</span>
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--d-muted)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts or cities" className="demo-input pl-10" />
          </label>
          <Button onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} className="lg:hidden">
            <Icon name="filter" size={18} /> Filters{activeFilters ? ` (${activeFilters})` : ""}
          </Button>
        </div>
        <div className={`grid gap-2 sm:grid-cols-3 lg:grid-cols-6 ${showFilters ? "" : "hidden lg:grid"}`}>
          <Field label="State">
            <select className="demo-input" value={st} onChange={(e) => setSt(e.target.value)}>
              <option value="">All states</option>
              {["TX", "AR", "LA", "FL"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Market">
            <select className="demo-input" value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="">All markets</option>
              {cfg.markets.filter((m) => !st || m.state === st).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className="demo-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {cfg.accountTypes.map((t) => <option key={t.type}>{t.type}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="demo-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {(["Active", "At risk", "Prospect", "Lost"] as const).map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Rep">
            <select className="demo-input" value={rep} onChange={(e) => setRep(e.target.value)}>
              <option value="">All reps</option>
              {cfg.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Sort by">
            <select className="demo-input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="revenue">Revenue (12 mo)</option>
              <option value="name">Name</option>
              <option value="lastVisit">Last visit</option>
              <option value="followUp">Next follow-up</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between text-[13px] text-(--d-muted)">
          <span aria-live="polite">{rows.length} of {ds.accounts.length} accounts</span>
          {activeFilters || q ? <button type="button" onClick={clear} className="min-h-9 px-2 text-(--d-accent) hover:underline">Clear filters</button> : null}
        </div>
      </div>

      {/* Desktop table */}
      <div className="demo-card demo-scroll-x hidden md:block">
        <table className="w-full min-w-[980px] text-left text-[14px]">
          <thead className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              {["Account", "Type", "Market", "Status", "SKUs carried", "Last visit", "Next follow-up", "Rep"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-medium first:pl-5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, last, next }) => (
              <tr key={a.id} className="border-b border-(--d-line)/60 last:border-0 hover:bg-(--d-panel2)">
                <td className="py-2.5 pr-3 pl-5">
                  <button type="button" onClick={() => onOpen(a.id)} className="text-left font-medium hover:text-(--d-accent)">{a.name}</button>
                  <div className="text-[12.5px] text-(--d-muted)">{a.city}</div>
                </td>
                <td className="px-3 text-(--d-muted)">{a.type}</td>
                <td className="px-3"><span className="text-(--d-muted)">{marketName(a.marketId)}</span> <span className="text-[12px]">{a.state}</span></td>
                <td className="px-3"><Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill></td>
                <td className="px-3"><SkuChips skus={a.skus} /></td>
                <td className="px-3 whitespace-nowrap text-(--d-muted)">{last ? shortDate(last) : "—"}</td>
                <td className={`px-3 whitespace-nowrap ${next < anchor ? "text-(--d-bad)" : "text-(--d-muted)"}`}>{shortDate(next)}{next < anchor ? " · overdue" : ""}</td>
                <td className="px-3"><Avatar name={person(a.repId).name} size={28} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="space-y-2 md:hidden">
        {rows.slice(0, 60).map(({ a, last, next }) => (
          <li key={a.id}>
            <button type="button" onClick={() => onOpen(a.id)} className="demo-card w-full p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-[13px] text-(--d-muted)">{a.type} · {a.city}, {a.state}</p>
                </div>
                <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
              </div>
              <div className="mt-2"><SkuChips skus={a.skus} /></div>
              <div className="mt-2 flex flex-wrap gap-x-4 text-[13px] text-(--d-muted)">
                <span>Last visit {last ? shortDate(last) : "—"}</span>
                <span className={next < anchor ? "text-(--d-bad)" : ""}>Follow-up {shortDate(next)}</span>
              </div>
            </button>
          </li>
        ))}
        {rows.length > 60 ? <li className="py-2 text-center text-[13px] text-(--d-muted)">Showing 60 of {rows.length}. Use search or filters to narrow.</li> : null}
      </ul>
    </div>
  );
}

function SkuChips({ skus }: { skus: string[] }) {
  const { cfg } = useDemo();
  const names = skus.map((id) => cfg.skus.find((s) => s.id === id)!.name);
  return (
    <span className="flex flex-wrap gap-1">
      {names.slice(0, 3).map((n) => <Chip key={n}>{n}</Chip>)}
      {names.length > 3 ? <Chip>+{names.length - 3}</Chip> : null}
    </span>
  );
}

/* ------------------------------- visits ------------------------------- */

function Visits({ onOpen }: { onOpen: (id: string) => void }) {
  const { cfg, ds, visits, anchor, person } = useDemo();
  const [rep, setRep] = useState("");
  const [days, setDays] = useState(30);
  const [type, setType] = useState("");
  const [limit, setLimit] = useState(40);
  const acct = useMemo(() => new Map(ds.accounts.map((a) => [a.id, a])), [ds]);
  const from = addDays(anchor, -days);
  const rows = visits.filter((v) => v.date >= from && (!rep || v.repId === rep) && (!type || v.type === type));

  return (
    <div className="space-y-4">
      <div className="demo-card grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
        <Field label="Rep">
          <select className="demo-input" value={rep} onChange={(e) => setRep(e.target.value)}>
            <option value="">All reps</option>
            {cfg.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Date range">
          <select className="demo-input" value={days} onChange={(e) => setDays(+e.target.value)}>
            {[7, 30, 90, 182].map((d) => <option key={d} value={d}>{d === 182 ? "Last 6 months" : `Last ${d} days`}</option>)}
          </select>
        </Field>
        <Field label="Visit type">
          <select className="demo-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {VISIT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <p className="text-[13px] text-(--d-muted) sm:col-span-3" aria-live="polite">{rows.length} visits</p>
      </div>
      <ul className="demo-card divide-y divide-(--d-line)/70">
        {rows.slice(0, limit).map((v) => {
          const a = acct.get(v.accountId)!;
          return (
            <li key={v.id} className="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[92px_1fr_auto] sm:items-center sm:px-5">
              <span className="text-[13px] text-(--d-muted)">{shortDate(v.date)}{v.id.startsWith("new") ? <span className="ml-1 text-(--d-accent)">· new</span> : null}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => onOpen(a.id)} className="min-h-8 text-left font-medium hover:text-(--d-accent)">{a.name}</button>
                  <Pill tone={VISIT_TONE[v.type]}>{v.type}</Pill>
                </div>
                <p className="text-[13.5px] text-(--d-muted)">{v.outcome}{v.notes ? ` ${v.notes}` : ""}</p>
              </div>
              <span className="flex items-center gap-2 text-[13px] text-(--d-muted)"><Avatar name={person(v.repId).name} size={24} />{person(v.repId).name}</span>
            </li>
          );
        })}
        {!rows.length ? <li className="px-5 py-8 text-center text-(--d-muted)">No visits match these filters.</li> : null}
      </ul>
      {rows.length > limit ? <div className="text-center"><Button onClick={() => setLimit((l) => l + 40)}>Show more ({rows.length - limit} left)</Button></div> : null}
    </div>
  );
}

/* ------------------------------ contacts ------------------------------ */

function Contacts({ onOpen }: { onOpen: (id: string) => void }) {
  const { ds } = useDemo();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(60);
  const acct = useMemo(() => new Map(ds.accounts.map((a) => [a.id, a])), [ds]);
  const needle = q.trim().toLowerCase();
  const rows = ds.contacts.filter((c) => !needle || `${c.name} ${c.role} ${acct.get(c.accountId)!.name}`.toLowerCase().includes(needle));

  return (
    <div className="space-y-4">
      <div className="demo-card p-3 sm:p-4">
        <label className="relative block">
          <span className="sr-only">Search contacts</span>
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--d-muted)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, role or account" className="demo-input pl-10" />
        </label>
        <p className="mt-2 text-[13px] text-(--d-muted)" aria-live="polite">{rows.length} contacts</p>
      </div>
      <ul className="demo-card divide-y divide-(--d-line)/70">
        {rows.slice(0, limit).map((c) => {
          const a = acct.get(c.accountId)!;
          return (
            <li key={c.id} className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[1.2fr_1.4fr_1fr_1.3fr] sm:items-center sm:px-5">
              <span className="flex items-center gap-3"><Avatar name={c.name} size={30} /><span><span className="block font-medium">{c.name}</span><span className="block text-[12.5px] text-(--d-muted)">{c.role}</span></span></span>
              <button type="button" onClick={() => onOpen(a.id)} className="min-h-8 text-left text-[14px] text-(--d-muted) hover:text-(--d-accent) sm:text-(--d-text)">{a.name}</button>
              <span className="flex items-center gap-1.5 text-[13.5px] text-(--d-muted)"><Icon name="phone" size={15} />{c.phone}</span>
              <span className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-(--d-muted)"><Icon name="mail" size={15} /><span className="truncate">{c.email}</span></span>
            </li>
          );
        })}
      </ul>
      {rows.length > limit ? <div className="text-center"><Button onClick={() => setLimit((l) => l + 60)}>Show more ({rows.length - limit} left)</Button></div> : null}
    </div>
  );
}

/* ---------------------------- account drawer --------------------------- */

function AccountDrawer({ account, onClose }: { account: Account | null; onClose: () => void }) {
  const { cfg, ds, visits, anchor, person } = useDemo();
  const [logging, setLogging] = useState(false);
  const a = account;
  const mine = useMemo(() => (a ? visits.filter((v) => v.accountId === a.id) : []), [a, visits]);
  const rev = useMemo(() => (a ? accountRevenue(ds).get(a.id) : undefined), [a, ds]);
  const places = useMemo(() => (a ? placements(ds, a.id) : []), [a, ds]);
  const last = mine[0]?.date;
  const market = a ? cfg.markets.find((m) => m.id === a.marketId)! : null;

  return (
    <>
      <Dialog
        drawer
        open={!!a}
        onClose={onClose}
        title={a?.name ?? ""}
        subtitle={a ? `${a.type} · ${a.city}, ${a.state} · ${market!.name}` : null}
        footer={<><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={() => setLogging(true)}><Icon name="plus" size={18} />Log a visit</Button></>}
      >
        {a ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
              <span className="flex items-center gap-2 text-[14px] text-(--d-muted)"><Avatar name={person(a.repId).name} size={24} />{person(a.repId).name}</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Revenue, 12 mo", rev ? moneyK(rev.revenue) : "$0"],
                ["Cases, 12 mo", rev ? num(rev.cases) : "0"],
                ["Last order", rev?.lastOrder ? shortDate(rev.lastOrder) : "—"],
                ["Last visit", last ? `${shortDate(last)} (${diffDays(anchor, last)}d)` : "—"],
                ["Next follow-up", shortDate(nextFollowUp(a, last, anchor))],
                ["Customer since", a.openedOn ? shortDate(a.openedOn) : "Prospect"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-(--d-bg) p-3">
                  <dt className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <DrawerSection title="Contacts">
              <ul className="space-y-2">
                {ds.contacts.filter((c) => c.accountId === a.id).map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <Avatar name={c.name} size={32} />
                    <div className="min-w-0 text-[14px]">
                      <p className="font-medium">{c.name} <span className="font-normal text-(--d-muted)">· {c.role}</span></p>
                      <p className="text-(--d-muted)">{c.phone} · {c.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </DrawerSection>

            <DrawerSection title="Placements">
              {places.length ? (
                <ul className="flex flex-wrap gap-2">
                  {places.map((p) => (
                    <li key={p.skuId} className="rounded-lg border border-(--d-line) px-3 py-2 text-[13.5px]">
                      {cfg.skus.find((s) => s.id === p.skuId)!.name}
                      <span className="block text-[12px] text-(--d-muted)">since {shortDate(p.since)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[14px] text-(--d-muted)">No placements yet. Target: {a.skus.map((id) => cfg.skus.find((s) => s.id === id)!.name).slice(0, 3).join(", ")}.</p>}
            </DrawerSection>

            <DrawerSection title={`Visit timeline (${mine.length})`}>
              {mine.length ? (
                <ol className="relative space-y-4 border-l border-(--d-line) pl-5">
                  {mine.slice(0, 10).map((v) => (
                    <li key={v.id} className="relative">
                      <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-(--d-panel) bg-(--d-accent)" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-(--d-muted)">
                        {shortDate(v.date)} · {person(v.repId).name} <Pill tone={VISIT_TONE[v.type]}>{v.type}</Pill>
                      </div>
                      <p className="mt-1 text-[14px]">{v.outcome}</p>
                      {v.notes ? <p className="text-[13.5px] text-(--d-muted)">{v.notes}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : <p className="text-[14px] text-(--d-muted)">No visits in the last 6 months.</p>}
            </DrawerSection>

            <DrawerSection title="Notes">
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-(--d-muted)">{a.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </DrawerSection>
          </div>
        ) : null}
      </Dialog>
      {a ? <LogVisit account={a} open={logging} onClose={() => setLogging(false)} /> : null}
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="demo-display mb-3 text-[15px] text-(--d-muted)">{title}</h3>
      {children}
    </section>
  );
}

function LogVisit({ account, open, onClose }: { account: Account; open: boolean; onClose: () => void }) {
  const { anchor, logVisit, cfg } = useDemo();
  const [date, setDate] = useState(anchor);
  const [type, setType] = useState<VisitType>("Follow-up");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [rep, setRep] = useState(account.repId);
  const formId = useId();

  const save = () => {
    const v: Omit<Visit, "id"> = { date, repId: rep, accountId: account.id, type, outcome: outcome.trim() || "Logged from the demo.", notes: notes.trim() };
    logVisit(v);
    setOutcome("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log a visit"
      subtitle={account.name}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Save visit</Button></>}
    >
      <form id={formId} className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Date"><input type="date" className="demo-input" value={date} max={anchor} onChange={(e) => setDate(e.target.value || anchor)} /></Field>
        <Field label="Visit type">
          <select className="demo-input" value={type} onChange={(e) => setType(e.target.value as VisitType)}>
            {VISIT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Rep" className="sm:col-span-2">
          <select className="demo-input" value={rep} onChange={(e) => setRep(e.target.value)}>
            {cfg.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Outcome" className="sm:col-span-2"><input className="demo-input" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. Ordered 2 cases of Hotscotch" /></Field>
        <Field label="Notes" className="sm:col-span-2"><textarea className="demo-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the next rep should know" /></Field>
      </form>
    </Dialog>
  );
}
