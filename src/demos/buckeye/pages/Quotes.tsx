"use client";

import { useMemo, useState } from "react";
import { price, type QuoteStatus } from "@demos/buckeye/data";
import { shortDay } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { DocumentPaper } from "@demos/kit/blocks/DocumentPaper";
import { PriceBreakdown } from "@demos/kit/blocks/PriceBreakdown";
import { ResponsiveTable, type Column } from "@demos/kit/blocks/ResponsiveTable";
import { usd } from "@demos/kit/data/format";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { Button, Card, ChipRow, Field, FilterChip, Note, PageHeader, Pill, type Tone } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { Num, v } from "@demos/buckeye/parts/bits";

const TONE: Record<QuoteStatus, Tone> = { "Needs approval": "warn", Sent: "info", Won: "good", Lost: "neutral" };
type Row = ReturnType<typeof useShop>["quotes"][number];

export default function Quotes() {
  const { shop, quotes, customer, material, addQuote, setQuoteStatus, convert, openJob, notify, k } = useShop();
  const first = shop.customers[0];
  const firstPart = shop.parts.find((p) => p.customerId === first.id)!;
  const [customerId, setCustomerId] = useState(first.id);
  const [partId, setPartId] = useState(firstPart.id);
  const [materialId, setMaterialId] = useState(firstPart.materialId);
  const [qty, setQty] = useState(100);
  const [cycleMin, setCycle] = useState(firstPart.cycleMin);
  const [setupHr, setSetup] = useState(firstPart.setupHr);
  const [margin, setMargin] = useState(ind.defaultMargin);
  const [draft, setDraft] = useState(false);
  const [paper, setPaper] = useState<Row | null>(null);
  const [filter, setFilter] = useState<QuoteStatus>("Needs approval");

  const partsHere = shop.parts.filter((p) => p.customerId === customerId);
  const part = shop.partOf(partId);
  const est = price(ind, { route: part.route, qty, cycleMin, setupHr, perPc: part.perPc, materialCost: material(materialId).cost, margin });
  const pickPart = (id: string) => {
    const p = shop.partOf(id);
    setPartId(id); setMaterialId(p.materialId); setCycle(p.cycleMin); setSetup(p.setupHr); setDraft(false);
  };
  const pickCustomer = (id: string) => { setCustomerId(id); pickPart(shop.parts.find((p) => p.customerId === id)!.id); };
  const form = { customerId, partId, materialId, qty, cycleMin, setupHr, margin };

  /** Canned on purpose: shows the idea, calls nothing. */
  const fillDraft = () => {
    const c = shop.customers[3];
    const p = shop.parts.find((x) => x.customerId === c.id)!;
    setCustomerId(c.id); setPartId(p.id); setMaterialId(p.materialId); setCycle(p.cycleMin); setSetup(p.setupHr);
    setQty(Math.max(p.qtyRange[0], Math.round((p.qtyRange[0] + p.qtyRange[1]) / 2 / 10) * 10 || p.qtyRange[0]));
    setMargin(ind.defaultMargin);
    setDraft(true);
  };

  const shown = useMemo(() => quotes.filter((q) => q.status === filter).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20), [quotes, filter]);
  const counts = Object.fromEntries((["Needs approval", "Sent", "Won", "Lost"] as QuoteStatus[]).map((s) => [s, quotes.filter((q) => q.status === s).length]));

  const actions = (q: Row) => (
    <span className="flex flex-wrap justify-end gap-1.5 md:flex-nowrap">
      {q.status === "Needs approval" ? <Button onClick={() => setQuoteStatus(q.id, "Sent")}>Approve + send</Button> : null}
      {q.status === "Sent" ? <Button onClick={() => convert(q)}>Convert to {v.job}</Button> : null}
      {q.status === "Won" && q.jobId ? <Button variant="ghost" onClick={() => openJob(q.jobId!)}><Num>{q.jobId}</Num></Button> : null}
      <Button variant="ghost" onClick={() => setPaper(q)}>View</Button>
    </span>
  );
  const columns: Column<Row>[] = [
    { key: "id", header: "Quote", primary: true, cell: (q) => <Num>{q.id}</Num> },
    { key: "c", header: "Customer", cell: (q) => customer(q.customerId).name },
    { key: "p", header: v.Part, cell: (q) => shop.partOf(q.partId).name },
    { key: "q", header: "Qty", align: "right", cell: (q) => q.qty.toLocaleString("en-US") },
    { key: "d", header: "Date", cell: (q) => <span className="whitespace-nowrap">{shortDay(q.date)}</span> },
    { key: "a", header: "Price", align: "right", cell: (q) => usd(q.price) },
    { key: "s", header: "", cell: actions },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quotes"
        meta={`${k.waiting.length} waiting for approval, ${usd(k.waitingValue)} in all.`}
        actions={<Button onClick={fillDraft}><Icon name="spark" size={16} />Draft quote</Button>}
      />

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-[3fr_2fr]">
        <Card title="New quote">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer"><select className="demo-input" value={customerId} onChange={(e) => pickCustomer(e.target.value)}>{shop.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label={v.Part}><select className="demo-input" value={partId} onChange={(e) => pickPart(e.target.value)}>{partsHere.map((p) => <option key={p.id} value={p.id}>{p.number} · {p.name}</option>)}</select></Field>
            <Field label="Material"><select className="demo-input" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>{shop.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
            <Field label={`Quantity (${v.unit})`}><input className="demo-input" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></Field>
            <Field label={`${v.Machine} time per piece (min)`}><input className="demo-input" type="number" inputMode="decimal" min={0} step={0.5} value={cycleMin} onChange={(e) => setCycle(Math.max(0, +e.target.value || 0))} /></Field>
            <Field label="Setup (hours)"><input className="demo-input" type="number" inputMode="decimal" min={0} step={0.5} value={setupHr} onChange={(e) => setSetup(Math.max(0, +e.target.value || 0))} /></Field>
            <Field label={`Margin: ${Math.round(margin * 100)}%`} className="sm:col-span-2"><input className="min-h-12 w-full accent-(--d-accent)" type="range" min={10} max={50} value={Math.round(margin * 100)} onChange={(e) => setMargin(+e.target.value / 100)} /></Field>
          </div>
        </Card>

        <Card title={`Price, from your ${v.shop} rates`}>
          <PriceBreakdown
            money={(n) => usd(n)}
            lines={[
              ...est.lines.map((l) => ({ key: l.op, label: l.label, sub: <>{l.hours.toFixed(1)} hr at {usd(l.rate)}/hr</>, amount: l.cost })),
              { key: "material", label: "Material", sub: <>{Math.round(est.matNeed)} {material(materialId).unit} of {material(materialId).name}</>, amount: est.material },
              ...(est.outside ? [{ key: "outside", label: "Outside processing", amount: est.outside }] : []),
            ]}
            cost={{ label: "Cost", amount: est.cost }}
            total={{ label: "Quote price", sub: <>{usd(est.perPiece, true)} per piece</>, amount: est.price }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => { addQuote(form, "Needs approval"); notify(); setFilter("Needs approval"); }}>Save for approval</Button>
            <Button variant="primary" onClick={() => convert(addQuote(form, "Won"))}>Convert to {v.job}</Button>
          </div>
        </Card>
      </div>

      {draft ? (
        <Card title={<span className="inline-flex flex-wrap items-center gap-2">Draft email to {customer(customerId).contacts[0].name} <Pill tone="accent">Concept: canned sample, nothing was sent</Pill></span>}>
          <div className="rounded-[4px] border border-(--d-line) bg-(--d-panel2) p-3.5 text-[14px] leading-relaxed">
            <p className="text-(--d-muted)">To: {customer(customerId).contacts[0].email}</p>
            <p className="mb-2 text-(--d-muted)">Subject: Quote for {part.name}, {qty.toLocaleString("en-US")} {v.unit}</p>
            <p>Hi {customer(customerId).contacts[0].name.split(" ")[0]},</p>
            <p className="mt-2">{ind.copy.emailOpen} We can make {qty.toLocaleString("en-US")} {v.unit} of {part.name} ({part.number}, rev {part.rev}) in {material(materialId).name} for {usd(est.price)}, about {usd(est.perPiece, true)} each. {ind.copy.emailIncludes}</p>
            <p className="mt-2">Say the word and we&apos;ll get it on the schedule.</p>
            <p className="mt-2">{ind.staff[2].name}, {ind.company.name}</p>
          </div>
          <div className="mt-3 flex justify-end"><Button variant="primary" onClick={() => notify()}>Send</Button></div>
        </Card>
      ) : null}

      <section className="space-y-3">
        <ChipRow>
          {(["Needs approval", "Sent", "Won", "Lost"] as QuoteStatus[]).map((s) => <FilterChip key={s} on={filter === s} onClick={() => setFilter(s)} count={counts[s]}>{s}</FilterChip>)}
        </ChipRow>
        <ResponsiveTable
          rows={shown} columns={columns} getKey={(q) => q.id} minWidth={860}
          card={(q) => (
            <>
              <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block font-semibold"><Num>{q.id}</Num> · {customer(q.customerId).name}</span><span className="block text-[13px] text-(--d-muted)">{shop.partOf(q.partId).name} · {q.qty.toLocaleString("en-US")} {v.unit} · {shortDay(q.date)}</span></span><span className="shrink-0 font-semibold">{usd(q.price)}</span></span>
              <span className="mt-2 flex items-center justify-between gap-2"><Pill tone={TONE[q.status]}>{q.status}</Pill>{actions(q)}</span>
            </>
          )}
        />
        <Note>Every shipped {v.job} started as one of these. {v.Part}, quantity, material and price carry through without being typed again.</Note>
      </section>

      {paper ? (
        <Dialog open drawer onClose={() => setPaper(null)} title={`Quote ${paper.id}`} subtitle={customer(paper.customerId).name} footer={<Button variant="primary" onClick={() => notify()}>Send to customer</Button>}>
          <QuotePaper q={paper} />
        </Dialog>
      ) : null}
    </div>
  );
}

function QuotePaper({ q }: { q: Row }) {
  const { shop, customer, material } = useShop();
  const c = customer(q.customerId);
  const part = shop.partOf(q.partId);
  const m = material(q.materialId);
  const est = price(ind, { route: part.route, qty: q.qty, cycleMin: q.cycleMin, setupHr: q.setupHr, perPc: part.perPc, materialCost: m.cost, margin: q.margin });
  return (
    <DocumentPaper
      ariaLabel={`Quote ${q.id}`} accent={ind.brand.accent} accentText={ind.brand.accent} company={ind.company.name} contact={ind.company.contact} title="Quote" number={q.id} meta={[`Date ${shortDay(q.date)}`, "Good for 30 days"]}
      parties={[{ label: "For", lines: [{ text: c.name, tone: "strong" }, { text: c.contacts[0].name }, { text: c.contacts[0].email, tone: "muted" }] }, { label: "Prepared by", lines: [{ text: q.by, tone: "strong" }, { text: ind.staff[2].role, tone: "muted" }] }]}
      lines={[{ desc: `${part.name}, ${part.number} rev ${part.rev}`, sub: `${q.qty.toLocaleString("en-US")} ${v.unit} in ${m.name}. ${ind.copy.emailIncludes}`, amount: q.price }]}
      totals={[{ label: "Total", amount: q.price, kind: "due" }]}
      footer={`About ${usd(est.perPiece, true)} per piece.`}
    />
  );
}
