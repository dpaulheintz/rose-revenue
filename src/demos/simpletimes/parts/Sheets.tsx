"use client";

import { useState } from "react";
import { addDays } from "@demos/kit/data/dates";
import { ContactButtons } from "@demos/kit/ui/ContactButtons";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { Button, Field } from "@demos/kit/ui/ui";
import { ACCOUNT_TYPES, BRANDS, INGREDIENTS, LINES, PRODUCTS, REPS, RUN_STATUSES, SKUS, STAGES, TOWNS, type AccountType, type BrandKey } from "@demos/simpletimes/catalog";
import { lineName, nextWorkday, type Run } from "@demos/simpletimes/data";
import { accountStats, isRunout, ownerName, productName, shortDay, shortages, skuOf, tastingRoi } from "@demos/simpletimes/derive";
import { BrandChip, BrandChips, Chip, money, RUN_TONE, STAGE_TONE, Stepper } from "./bits";
import { useSt } from "./StProvider";

export default function Sheets() {
  const { sheet, open } = useSt();
  if (!sheet) return null;
  const close = () => open(null);
  switch (sheet.kind) {
    case "account": return <AccountSheet id={sheet.id} onClose={close} />;
    case "run": return <RunSheet id={sheet.id} onClose={close} />;
    case "client": return <ClientSheet id={sheet.id} onClose={close} />;
    case "tasting": return <TastingSheet id={sheet.id} onClose={close} />;
    case "visit": return <VisitForm account={sheet.account} onClose={close} />;
    case "logTasting": return <TastingForm account={sheet.account} onClose={close} />;
    case "order": return <OrderForm account={sheet.account} onClose={close} />;
    case "addAccount": return <AccountForm onClose={close} />;
    case "scheduleRun": return <RunForm onClose={close} />;
    case "receive": return <ReceiveForm onClose={close} />;
    case "addClient": return <ClientForm onClose={close} />;
    case "po": return <PoForm item={sheet.item} onClose={close} />;
  }
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-5 first:mt-0"><h3 className="demo-display mb-2 text-[20px]">{title}</h3>{children}</section>
);
const Fact = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="min-w-0 rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-[13px] text-(--d-muted)">{k}</dt><dd className="text-[16px] font-semibold">{v}</dd></div>
);

/* ---------------- Account ---------------- */
function AccountSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d, w, account, open, notify } = useSt();
  const a = account(id);
  const s = accountStats(d, w, a);
  const repName = REPS.find((r) => r.id === a.rep)?.name;
  return (
    <Dialog open sheet onClose={onClose} title={a.name} subtitle={<span className="flex flex-wrap items-center gap-2">{a.type}, {a.town}<BrandChips brands={a.brands} missing={s.crossSell} /></span>}
      footer={<><Button onClick={() => open({ kind: "visit", account: a.id })}><Icon name="pin" size={18} />Log visit</Button><Button variant="primary" onClick={() => open({ kind: "order", account: a.id })}><Icon name="receipt" size={18} />New order</Button></>}>
      {s.crossSell ? (
        <p className="mb-4 rounded-[12px] border border-dashed p-3 text-[15px]" style={{ borderColor: BRANDS[s.crossSell].color }}>
          <span className="font-semibold">Cross-sell:</span> they carry {BRANDS[a.brands[0]].name} but not {BRANDS[s.crossSell].name}. Bring samples next visit.
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-2">
        <Fact k="Last order" v={s.last ? `${shortDay(s.last.date)}, ${money(s.last.total)}` : "None yet"} />
        <Fact k={s.overdue ? "Reorder was due" : "Reorder due"} v={<span className={s.overdue ? "text-(--d-bad)" : ""}>{shortDay(s.due)}</span>} />
        <Fact k="Last 12 months" v={money(s.revenue12)} />
        <Fact k="Orders about every" v={`${a.cadence} days`} />
      </dl>
      <Section title="Contacts">
        <ul className="space-y-3">
          {a.contacts.map((c) => (
            <li key={c.email}>
              <p className="text-[16px] font-semibold">{c.name} <span className="font-normal text-(--d-muted)">{c.role}</span></p>
              <p className="mb-2 text-[14px] text-(--d-muted)">{c.phone}</p>
              <ContactButtons name={c.name.split(" ")[0]} phone={c.phone} email={c.email} onTap={(what) => notify(`${what}. (Demo: nothing is sent.)`)} />
            </li>
          ))}
        </ul>
      </Section>
      {s.last ? (
        <Section title="Last order">
          <ul className="space-y-1.5">
            {s.last.lines.map((l) => <li key={l.sku} className="flex justify-between gap-3 text-[15px]"><span className="min-w-0">{l.qty} × {skuOf(l.sku).name}, {skuOf(l.sku).format.toLowerCase()}</span><span className="shrink-0">{money(l.amount)}</span></li>)}
          </ul>
        </Section>
      ) : null}
      <Section title="Visits">
        <ol className="space-y-2.5">
          {a.visits.slice(0, 6).map((v) => <li key={v.id} className="flex gap-3 text-[15px]"><span className="w-14 shrink-0 text-(--d-muted)">{shortDay(v.date)}</span><span className="min-w-0">{v.note} <span className="text-(--d-muted)">({REPS.find((r) => r.id === v.rep)?.name})</span></span></li>)}
          {!a.visits.length ? <li className="text-(--d-muted)">No visits yet.</li> : null}
        </ol>
      </Section>
      <Section title="Notes"><p className="text-[15px]">{a.notes} Rep: {repName}.</p></Section>
    </Dialog>
  );
}

/* ---------------- Run: the batch record ---------------- */
function RunSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d, w, setRunStatus, notify } = useSt();
  const r = w.runs.find((x) => x.id === id)!;
  const short = shortages(d, w).find((s) => s.run.id === r.id);
  const i = RUN_STATUSES.indexOf(r.status);
  const next = RUN_STATUSES[i + 1];
  const client = !["mixers", "syrup"].includes(r.owner);
  return (
    <Dialog open sheet onClose={onClose} title={r.product} subtitle={<span className="flex flex-wrap items-center gap-2"><Chip tone={RUN_TONE[r.status]}>{r.status}</Chip>Run {r.id}, {ownerName(w, r.owner)}</span>}
      footer={<>
        {client ? <Button onClick={() => notify("Batch record sent to the client (demo).")}><Icon name="mail" size={18} />Send to client</Button> : null}
        {next ? <Button variant="primary" onClick={() => setRunStatus(r.id, r.status === "QA hold" ? "Released" : next)}>{r.status === "QA hold" ? "Release after re-test" : `Mark ${next.toLowerCase()}`}</Button> : null}
      </>}>
      {short ? <p className="mb-4 rounded-[12px] bg-[color-mix(in_oklab,var(--d-bad)_10%,white)] p-3 text-[15px] text-(--d-bad)"><span className="font-semibold">Short on {short.item.name.toLowerCase()}:</span> needs {Math.round((short.before + short.short) * 10) / 10} {short.item.unit}, {short.before} left after earlier runs.</p> : null}
      <ol className="mb-4 grid grid-cols-6 gap-1" aria-label="Run status">
        {RUN_STATUSES.map((s, n) => <li key={s} className="min-w-0"><span className={`block h-1.5 rounded-full ${n <= i ? (r.status === "QA hold" && n === i ? "bg-(--d-bad)" : "bg-(--d-accent)") : "bg-(--d-line)"}`} /><span className={`mt-1 block truncate text-[11.5px] ${n === i ? "font-semibold" : "text-(--d-muted)"}`}>{s}</span></li>)}
      </ol>
      <dl className="grid grid-cols-2 gap-2">
        <Fact k="Kettle" v={lineName(r.line)} />
        <Fact k="Date" v={shortDay(r.date)} />
        <Fact k="Batch" v={`${r.gallons} gal, ${r.bottles.toLocaleString("en-US")} × ${r.size}`} />
        <Fact k="Recipe" v={r.recipe} />
        <Fact k="Yield" v={r.yieldPct ? `${r.yieldPct}%` : "After bottling"} />
        <Fact k="Operator" v={r.operator} />
        <Fact k="Ship date" v={r.ship ? shortDay(r.ship) : "After QA"} />
        <Fact k={client ? "Run price" : "Batch cost"} v={money(client ? r.price : r.cost)} />
      </dl>
      <Section title="Ingredient lots">
        {r.lots.length ? (
          <ul className="divide-y divide-(--d-line)">
            {r.lots.map((l) => <li key={l.lot} className="flex justify-between gap-3 py-2 text-[15px]"><span className="min-w-0">{INGREDIENTS.find((x) => x.id === l.ing)?.name}</span><span className="shrink-0 text-(--d-muted)">{l.lot}, {l.qty} {INGREDIENTS.find((x) => x.id === l.ing)?.unit}</span></li>)}
          </ul>
        ) : <p className="text-[15px] text-(--d-muted)">Lots are recorded when batching starts.</p>}
      </Section>
      <Section title="QA checks">
        {r.checks.length && r.status !== "Scheduled" && r.status !== "Batching" ? (
          <ul className="space-y-1.5">
            {r.checks.map((c) => <li key={c.name} className="flex items-center justify-between gap-3 text-[15px]"><span>{c.name}</span>{c.pass ? <Chip tone="good">Pass</Chip> : <Chip tone="bad">Re-test</Chip>}</li>)}
          </ul>
        ) : <p className="text-[15px] text-(--d-muted)">Checks run after bottling.</p>}
      </Section>
    </Dialog>
  );
}

/* ---------------- Co-pack client ---------------- */
function ClientSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { w, client, moveClient, notify, open } = useSt();
  const c = client(id);
  const runs = w.runs.filter((r) => r.owner === c.id);
  const quotes = w.quotes.filter((q) => q.client === c.id);
  const i = STAGES.indexOf(c.stage);
  return (
    <Dialog open sheet onClose={onClose} title={c.name} subtitle={<span className="flex flex-wrap items-center gap-2"><Chip tone={STAGE_TONE[c.stage]}>{c.stage}</Chip>{c.products.join(", ")}</span>}
      footer={i < STAGES.length - 1 ? <Button variant="primary" onClick={() => { moveClient(c.id, STAGES[i + 1]); notify(`${c.name} moved to ${STAGES[i + 1]}.`); }}>Move to {STAGES[i + 1]}</Button> : null}>
      <dl className="grid grid-cols-2 gap-2">
        <Fact k="Minimum run" v={`${c.minRun} gal`} />
        <Fact k="Yearly value" v={money(c.value)} />
        <Fact k="Next step" v={c.next} />
        <Fact k="By" v={shortDay(c.nextDate)} />
      </dl>
      <Section title="Contact">
        <p className="text-[16px] font-semibold">{c.contact.name} <span className="font-normal text-(--d-muted)">{c.contact.role}</span></p>
        <p className="mb-2 text-[14px] text-(--d-muted)">{c.contact.phone}</p>
        <ContactButtons name={c.contact.name.split(" ")[0]} phone={c.contact.phone} email={c.contact.email} onTap={(what) => notify(`${what}. (Demo: nothing is sent.)`)} />
      </Section>
      {quotes.length ? <Section title="Quotes"><ul className="space-y-1.5">{quotes.map((q) => <li key={q.id} className="flex justify-between gap-3 text-[15px]"><span>{q.id}, {q.gallons} gal {q.product.toLowerCase()}</span><Chip tone={q.status === "Accepted" ? "good" : q.status === "Sent" ? "info" : "neutral"}>{q.status}</Chip></li>)}</ul></Section> : null}
      <Section title="Runs">
        {runs.length ? <ul className="space-y-1.5">{runs.slice(-6).reverse().map((r) => <li key={r.id}><button type="button" onClick={() => open({ kind: "run", id: r.id })} className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[15px]"><span className="min-w-0">{shortDay(r.date)}, {r.product}</span><Chip tone={RUN_TONE[r.status]}>{r.status}</Chip></button></li>)}</ul> : <p className="text-[15px] text-(--d-muted)">No runs yet.</p>}
      </Section>
    </Dialog>
  );
}

/* ---------------- Tasting ---------------- */
function TastingSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { w, account, open } = useSt();
  const t = w.tastings.find((x) => x.id === id)!;
  const a = account(t.account);
  const r = tastingRoi(w, t);
  return (
    <Dialog open sheet onClose={onClose} title={`Tasting at ${a.name}`} subtitle={`${shortDay(t.date)}, ${t.time}. ${REPS.find((x) => x.id === t.rep)?.name}`}
      footer={<Button variant="primary" onClick={() => open({ kind: "account", id: a.id })}>Open {a.name}</Button>}>
      <p className="mb-3"><BrandChip brand={t.brand} /></p>
      <dl className="grid grid-cols-2 gap-2">
        <Fact k="Bottles sold that day" v={t.upcoming ? "Upcoming" : t.sold} />
        <Fact k="Sample bottles used" v={t.upcoming ? "Upcoming" : t.samples} />
        <Fact k="Reorders, next 30 days" v={t.upcoming ? "Upcoming" : money(r.reorders)} />
        <Fact k="Return on cost" v={t.upcoming ? "Upcoming" : `${r.roi.toFixed(1)}×`} />
      </dl>
      <Section title="Poured"><ul className="space-y-1">{t.poured.map((p) => <li key={p} className="text-[15px]">{productName(p)}</li>)}</ul></Section>
      <p className="mt-4 text-[14px] text-(--d-muted)">Cost counts the sample bottles, three rep hours and mileage ({money(t.cost)}).</p>
    </Dialog>
  );
}

/* ---------------- Quick forms ---------------- */
function AccountPicker({ value, onChange, types }: { value: string; onChange: (v: string) => void; types?: AccountType[] }) {
  const { w } = useSt();
  const list = w.accounts.filter((a) => !types || types.includes(a.type)).sort((x, y) => x.name.localeCompare(y.name));
  return (
    <Field label="Account">
      <select className="demo-input" value={value} onChange={(e) => onChange(e.target.value)}>{list.map((a) => <option key={a.id} value={a.id}>{a.name}, {a.town}</option>)}</select>
    </Field>
  );
}

function VisitForm({ account, onClose }: { account?: string; onClose: () => void }) {
  const { d, logVisit, open } = useSt();
  const todays = d.route.filter((r) => r.date === d.today);
  const [id, setId] = useState(account ?? todays[0]?.account ?? d.accounts[0].id);
  const [note, setNote] = useState("");
  const quick = ["Dropped samples", "Took an order", "Shelf reset", "Staff training", "Left pricing"];
  return (
    <Dialog open sheet onClose={onClose} title="Log visit" footer={<Button variant="primary" onClick={() => { logVisit(id, note || "Visited."); open({ kind: "account", id }); }}>Save visit</Button>}>
      <div className="space-y-4">
        <AccountPicker value={id} onChange={setId} />
        <div className="flex flex-wrap gap-2">{quick.map((q) => <button key={q} type="button" onClick={() => setNote((n) => (n ? `${n} ${q}.` : `${q}.`))} className="min-h-12 rounded-full border border-(--d-line) px-4 text-[15px]">{q}</button>)}</div>
        <Field label="Notes"><textarea className="demo-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, what's next" /></Field>
      </div>
    </Dialog>
  );
}

/** Built for one hand in a store aisle: big targets, steppers, product chips. */
function TastingForm({ account, onClose }: { account?: string; onClose: () => void }) {
  const { d, w, logTasting } = useSt();
  const stores = w.accounts.filter((a) => a.type === "Grocery" || a.type === "Liquor store");
  const [id, setId] = useState(account ?? w.tastings.find((t) => t.date === d.today)?.account ?? stores[0].id);
  const [brand, setBrand] = useState<BrandKey>("mixers");
  const [poured, setPoured] = useState<string[]>([]);
  const [samples, setSamples] = useState(2);
  const [sold, setSold] = useState(0);
  return (
    <Dialog open sheet onClose={onClose} title="Log tasting" footer={<Button variant="primary" className="w-full" onClick={() => { logTasting({ account: id, date: d.today, time: "Now", rep: "you", brand, poured, samples, sold }); onClose(); }}>Save tasting</Button>}>
      <div className="space-y-4">
        <AccountPicker value={id} onChange={setId} types={["Grocery", "Liquor store"]} />
        <div role="radiogroup" aria-label="Brand" className="grid grid-cols-2 gap-2">
          {(["mixers", "syrup"] as const).map((b) => <button key={b} type="button" role="radio" aria-checked={brand === b} onClick={() => { setBrand(b); setPoured([]); }} className={`min-h-14 rounded-[12px] border-2 text-[16px] font-semibold ${brand === b ? "" : "border-(--d-line)"}`} style={brand === b ? { borderColor: BRANDS[b].color, background: BRANDS[b].tint, color: BRANDS[b].ink } : undefined}>{BRANDS[b].name}</button>)}
        </div>
        <div>
          <p className="mb-2 text-[15px] font-semibold">Poured</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.filter((p) => p.brand === brand).map((p) => {
              const on = poured.includes(p.id);
              return <button key={p.id} type="button" aria-pressed={on} onClick={() => setPoured((x) => (on ? x.filter((y) => y !== p.id) : [...x, p.id]))} className={`min-h-12 rounded-full border px-4 text-[15px] ${on ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line)"}`}>{p.name}</button>;
            })}
          </div>
        </div>
        <Stepper label="Sample bottles" value={samples} onChange={setSamples} />
        <Stepper label="Bottles sold" value={sold} onChange={setSold} />
      </div>
    </Dialog>
  );
}

function OrderForm({ account, onClose }: { account?: string; onClose: () => void }) {
  const { w, addOrder } = useSt();
  const [id, setId] = useState(account ?? w.accounts[0].id);
  const a = w.accounts.find((x) => x.id === id)!;
  const [brand, setBrand] = useState<BrandKey>(a.brands[0]);
  const [cases, setCases] = useState<Record<string, number>>({});
  const skus = SKUS.filter((s) => s.brand === brand && s.format === "Case of 6");
  const total = Object.entries(cases).reduce((s, [k, q]) => s + q * skuOf(k).wholesale, 0);
  return (
    <Dialog open sheet onClose={onClose} title="New order" footer={<><span className="mr-auto self-center text-[16px] font-semibold">{money(total)}</span><Button variant="primary" disabled={!total} onClick={() => { addOrder(id, brand, cases); onClose(); }}>Save order</Button></>}>
      <div className="space-y-4">
        <AccountPicker value={id} onChange={(v) => { setId(v); setBrand(w.accounts.find((x) => x.id === v)!.brands[0]); setCases({}); }} />
        <div role="radiogroup" aria-label="Brand" className="grid grid-cols-2 gap-2">
          {(["mixers", "syrup"] as const).map((b) => <button key={b} type="button" role="radio" aria-checked={brand === b} onClick={() => { setBrand(b); setCases({}); }} className={`min-h-12 rounded-[12px] border-2 text-[15px] font-semibold ${brand === b ? "" : "border-(--d-line)"}`} style={brand === b ? { borderColor: BRANDS[b].color, background: BRANDS[b].tint, color: BRANDS[b].ink } : undefined}>{BRANDS[b].name}{a.brands.includes(b) ? "" : " (new)"}</button>)}
        </div>
        <p className="text-[14px] text-(--d-muted)">Cases of 6, wholesale {money(skus[0].wholesale)} a case.</p>
        <div className="space-y-2">{skus.map((s) => <Stepper key={s.id} label={s.name} value={cases[s.id] ?? 0} onChange={(n) => setCases((c) => ({ ...c, [s.id]: n }))} />)}</div>
      </div>
    </Dialog>
  );
}

function AccountForm({ onClose }: { onClose: () => void }) {
  const { addAccount, open } = useSt();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Bar");
  const [town, setTown] = useState(TOWNS[0]);
  const [brands, setBrands] = useState<BrandKey[]>(["mixers"]);
  const [contact, setContact] = useState("");
  return (
    <Dialog open sheet onClose={onClose} title="Add account" footer={<Button variant="primary" disabled={!name.trim()} onClick={() => { const id = addAccount({ name: name.trim(), type, town, brands, rep: "you", contacts: contact ? [{ name: contact, role: "Buyer", phone: "(614) 555-0142", email: "buyer@example.com" }] : [] }); open({ kind: "account", id }); }}>Save account</Button>}>
      <div className="space-y-4">
        <Field label="Business name"><input className="demo-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Harvest Moon Kitchen" autoComplete="off" /></Field>
        <Field label="Type"><select className="demo-input" value={type} onChange={(e) => setType(e.target.value as AccountType)}>{ACCOUNT_TYPES.map((t) => <option key={t.type}>{t.type}</option>)}</select></Field>
        <Field label="Town"><select className="demo-input" value={town} onChange={(e) => setTown(e.target.value)}>{TOWNS.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-2">{(["mixers", "syrup"] as const).map((b) => { const on = brands.includes(b); return <button key={b} type="button" aria-pressed={on} onClick={() => setBrands((x) => (on ? x.filter((y) => y !== b) : [...x, b]))} className={`min-h-12 rounded-[12px] border-2 text-[15px] font-semibold ${on ? "" : "border-(--d-line)"}`} style={on ? { borderColor: BRANDS[b].color, background: BRANDS[b].tint, color: BRANDS[b].ink } : undefined}>{BRANDS[b].name}</button>; })}</div>
        <Field label="Contact name"><input className="demo-input" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" /></Field>
      </div>
    </Dialog>
  );
}

function RunForm({ onClose }: { onClose: () => void }) {
  const { d, w, scheduleRun, open, notify } = useSt();
  const owners = [{ id: "mixers", name: "Simple Times Mixers" }, { id: "syrup", name: "The Syrup Project" }, ...w.clients.filter((c) => c.stage === "Production" || c.stage === "Repeat").map((c) => ({ id: c.id, name: c.name }))];
  const [owner, setOwner] = useState("mixers");
  const productsFor = (o: string) => (o === "mixers" || o === "syrup" ? PRODUCTS.filter((p) => p.brand === o).map((p) => p.name) : w.clients.find((c) => c.id === o)!.products);
  const [product, setProduct] = useState(productsFor("mixers")[0]);
  const [line, setLine] = useState("k2");
  const [gallons, setGallons] = useState(200);
  const [date, setDate] = useState(nextWorkday(addDays(d.today, 3)));
  return (
    <Dialog open sheet onClose={onClose} title="Schedule run" footer={<Button variant="primary" onClick={() => {
      const p = PRODUCTS.find((x) => x.name === product);
      const id = scheduleRun({ owner, product, base: p?.base ?? "client", date, line, gallons, size: p?.brand === "mixers" ? "750 ml" : "375 ml", price: 0 });
      notify(`Run ${id} scheduled. Inventory checks it against stock now.`);
      open({ kind: "run", id });
    }}>Schedule</Button>}>
      <div className="space-y-4">
        <Field label="For"><select className="demo-input" value={owner} onChange={(e) => { setOwner(e.target.value); setProduct(productsFor(e.target.value)[0]); }}>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>
        <Field label="Product"><select className="demo-input" value={product} onChange={(e) => setProduct(e.target.value)}>{productsFor(owner).map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Kettle"><select className="demo-input" value={line} onChange={(e) => setLine(e.target.value)}>{LINES.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.note})</option>)}</select></Field>
        <Field label="Gallons"><input className="demo-input" type="number" inputMode="numeric" value={gallons} onChange={(e) => setGallons(Math.max(10, +e.target.value || 10))} /></Field>
        <Field label="Date"><input className="demo-input" type="date" value={date} onChange={(e) => setDate(e.target.value || date)} /></Field>
      </div>
    </Dialog>
  );
}

function ReceiveForm({ onClose }: { onClose: () => void }) {
  const { w, receive } = useSt();
  const items = w.stock.filter((s) => s.owner === "Simple Times");
  const po = w.pos[0];
  const [id, setId] = useState(po?.item ?? items[0].id);
  const item = items.find((s) => s.id === id)!;
  const [qty, setQty] = useState(po?.qty ?? 10);
  return (
    <Dialog open sheet onClose={onClose} title="Receive inventory" footer={<Button variant="primary" onClick={() => { receive(id, qty); onClose(); }}>Receive {qty} {item.unit}</Button>}>
      <div className="space-y-4">
        <Field label="Item"><select className="demo-input" value={id} onChange={(e) => setId(e.target.value)}>{items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Stepper label={`Quantity (${item.unit})`} value={qty} onChange={setQty} />
        <p className="text-[14px] text-(--d-muted)">On hand now: {Math.round(item.onHand * 10) / 10} {item.unit}. Scan the lot label and it fills in (concept).</p>
      </div>
    </Dialog>
  );
}

function ClientForm({ onClose }: { onClose: () => void }) {
  const { addClient } = useSt();
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [minRun, setMinRun] = useState(150);
  return (
    <Dialog open sheet onClose={onClose} title="Add co-pack client" footer={<Button variant="primary" disabled={!name.trim()} onClick={() => { addClient({ name: name.trim(), products: [product || "New product"], minRun, contact: { name: "New contact", role: "Founder", phone: "(614) 555-0177", email: "hello@example.com" } }); onClose(); }}>Save to pipeline</Button>}>
      <div className="space-y-4">
        <Field label="Brand name"><input className="demo-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></Field>
        <Field label="Product"><input className="demo-input" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Ginger syrup" autoComplete="off" /></Field>
        <Field label="Minimum run (gallons)"><input className="demo-input" type="number" inputMode="numeric" value={minRun} onChange={(e) => setMinRun(Math.max(10, +e.target.value || 10))} /></Field>
        <p className="text-[14px] text-(--d-muted)">New clients start at Inquiry.</p>
      </div>
    </Dialog>
  );
}

function PoForm({ item, onClose }: { item: string; onClose: () => void }) {
  const { d, w, createPo } = useSt();
  const s = w.stock.find((x) => x.id === item)!;
  const short = shortages(d, w).find((x) => x.item.id === item);
  const [qty, setQty] = useState(Math.max(10, Math.ceil(short ? short.short * 3 : s.reorderAt)));
  const [expedite, setExpedite] = useState(!!short && isRunout(item));
  const eta = nextWorkday(addDays(d.today, expedite ? 2 : s.lead));
  return (
    <Dialog open sheet onClose={onClose} title="Create purchase order" subtitle={`${s.name} from ${s.supplier}`} footer={<Button variant="primary" onClick={() => { createPo(item, qty, expedite, s.lead, s.cost); onClose(); }}>Send PO</Button>}>
      <div className="space-y-4">
        <Stepper label={`Quantity (${s.unit})`} value={qty} onChange={setQty} />
        <label className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px]"><input type="checkbox" className="size-6 accent-(--d-accent)" checked={expedite} onChange={(e) => setExpedite(e.target.checked)} />Rush it: arrives in 2 days (+15%)</label>
        <p className="text-[15px]">Arrives {shortDay(eta)}. About {money(qty * s.cost * (expedite ? 1.15 : 1))}.</p>
        {short ? <p className="text-[15px] font-semibold" style={{ color: eta <= short.run.date ? "var(--d-good)" : "var(--d-bad)" }}>{eta <= short.run.date ? `In time for ${short.run.id} on ${shortDay(short.run.date)}.` : `Still late for ${short.run.id} on ${shortDay(short.run.date)}.`}</p> : null}
      </div>
    </Dialog>
  );
}

export type { Run };
