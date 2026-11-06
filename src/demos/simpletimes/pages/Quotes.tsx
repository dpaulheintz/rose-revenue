"use client";

import { useState } from "react";
import { PriceBreakdown } from "@demos/kit/blocks/PriceBreakdown";
import { StepWizard } from "@demos/kit/blocks/StepWizard";
import Icon from "@demos/kit/ui/Icon";
import { Button, Field } from "@demos/kit/ui/ui";
import { quotePrice, RATES, type Quote } from "@demos/simpletimes/data";
import { clientName, shortDay } from "@demos/simpletimes/derive";
import { Chip, H, money, NUM, RowCard, Stepper, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

type Draft = Omit<Quote, "id" | "date" | "status">;
const usd2 = (n: number) => `$${n.toFixed(2)}`;

export default function Quotes() {
  const { w, saveQuote, setQuoteStatus, convertQuote, notify, open } = useSt();
  const prospects = w.clients.filter((c) => c.stage !== "Repeat");
  const first = prospects.find((c) => c.stage === "Quote") ?? prospects[0];
  const [q, setQ] = useState<Draft>({ client: first.id, product: first.products[0], gallons: Math.max(first.minRun, 200), size: "375 ml", labels: "We print", margin: 0.3 });
  const [step, setStep] = useState(0);
  const set = (p: Partial<Draft>) => setQ((x) => ({ ...x, ...p }));
  const c = w.clients.find((x) => x.id === q.client)!;
  const p = quotePrice({ ...q, base: "client" });
  const send = () => { const saved = saveQuote({ ...q, status: "Sent" }); notify(`Quote ${saved.id} sent to ${c.contact.name} at ${c.name} (demo).`); setStep(0); };
  const convert = () => convertQuote(saveQuote({ ...q, status: "Sent" }));
  const pick = (on: boolean) => `flex min-h-14 w-full items-center justify-between gap-3 rounded-[12px] border-2 px-4 text-left text-[16px] ${on ? "border-(--d-accent) font-semibold" : "border-(--d-line) bg-(--d-panel)"}`;

  const clientStep = (
    <div className="space-y-2.5">
      {prospects.map((x) => <button key={x.id} type="button" aria-pressed={q.client === x.id} onClick={() => set({ client: x.id, product: x.products[0], gallons: Math.max(x.minRun, q.gallons) })} className={pick(q.client === x.id)}><span className="min-w-0">{x.name}</span><span className="shrink-0 text-[14px] text-(--d-muted)">{x.stage}</span></button>)}
    </div>
  );
  const productStep = (
    <div className="space-y-2.5">
      {c.products.map((x) => <button key={x} type="button" aria-pressed={q.product === x} onClick={() => set({ product: x })} className={pick(q.product === x)}>{x}</button>)}
      <p className="text-[14px] text-(--d-muted)">Ingredient cost uses their approved formula, about {usd2(p.ingredients / q.gallons)} a gallon.</p>
    </div>
  );
  const sizes = [...new Set([c.minRun, 200, 300, 500])];
  const qtyStep = (
    <div className="space-y-3">
      <Stepper label="Gallons" value={q.gallons} onChange={(n) => set({ gallons: Math.max(10, n) })} />
      <div className="flex flex-wrap gap-2">{sizes.map((g) => <button key={g} type="button" onClick={() => set({ gallons: g })} className={`min-h-12 rounded-full border px-4 text-[15px] ${q.gallons === g ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{g} gal{g === c.minRun ? " (min)" : ""}</button>)}</div>
      {q.gallons < c.minRun ? <p className="font-semibold text-(--d-bad)">Below their {c.minRun}-gallon minimum.</p> : null}
      <p className="text-[14px] text-(--d-muted)">About {p.bottles.toLocaleString("en-US")} bottles. Kettle time {p.kettleHours.toFixed(1)} hr, line time {p.lineHours.toFixed(1)} hr.</p>
    </div>
  );
  const packStep = (
    <div className="space-y-4">
      <div><p className="mb-2 text-[15px] font-semibold">Bottle</p><div className="grid grid-cols-2 gap-2">{(["375 ml", "750 ml"] as const).map((s) => <button key={s} type="button" aria-pressed={q.size === s} onClick={() => set({ size: s })} className={pick(q.size === s)}>{s} glass</button>)}</div></div>
      <div><p className="mb-2 text-[15px] font-semibold">Labels</p><div className="grid grid-cols-2 gap-2">{(["We print", "Client supplied"] as const).map((s) => <button key={s} type="button" aria-pressed={q.labels === s} onClick={() => set({ labels: s })} className={pick(q.labels === s)}>{s}</button>)}</div></div>
      <p className="text-[14px] text-(--d-muted)">Caps and 6-pack cartons included.</p>
    </div>
  );
  const breakdown = (
    <PriceBreakdown money={money} numClass={`${NUM} text-[30px]`}
      lines={[
        { key: "ing", label: "Ingredients", sub: <>{q.gallons} gal at {usd2(p.ingredients / q.gallons)}</>, amount: p.ingredients },
        { key: "lab", label: "Labor and line time", sub: <>{p.kettleHours.toFixed(1)} kettle hr at ${RATES.kettleHr}, {p.lineHours.toFixed(1)} line hr at ${RATES.lineHr}</>, amount: p.labor },
        { key: "pack", label: "Packaging", sub: <>{p.bottles.toLocaleString("en-US")} × {q.size}, caps{q.labels === "We print" ? ", labels" : ""}, cartons</>, amount: p.packaging },
      ]}
      cost={{ label: "Our cost", amount: p.cost }}
      total={{ label: "Quote price", sub: <>{usd2(p.perBottle)} a bottle at {Math.round(q.margin * 100)}% margin</>, amount: p.price }}
    />
  );
  const margin = <Field label={`Margin: ${Math.round(q.margin * 100)}%`}><input type="range" min={15} max={45} value={Math.round(q.margin * 100)} onChange={(e) => set({ margin: +e.target.value / 100 })} className="min-h-12 w-full accent-(--d-accent)" /></Field>;
  const reviewStep = (
    <div className="space-y-4">
      <p className="text-[16px]">{c.name}: {q.gallons} gal of {q.product.toLowerCase()}, {q.size}, {q.labels === "We print" ? "we print labels" : "their labels"}.</p>
      {margin}
      {breakdown}
      <Button className="w-full" onClick={convert}>Convert to run</Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <Title sub="Priced from ingredient cost, kettle and line time, packaging and margin.">Quotes</Title>

      <div className="lg:hidden">
        <StepWizard step={step} onStep={setStep} finish={<Button variant="primary" onClick={send}>Send quote</Button>}
          summary={<span className="block min-w-0"><span className={`${NUM} block text-[24px] leading-none`}>{money(p.price)}</span><span className="block truncate text-[13.5px] text-(--d-muted)">{usd2(p.perBottle)} a bottle</span></span>}
          steps={[{ key: "c", label: "Client", content: clientStep }, { key: "p", label: "Product", content: productStep }, { key: "q", label: "Quantity", content: qtyStep }, { key: "k", label: "Packaging", content: packStep }, { key: "r", label: "Review", content: reviewStep }]} />
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[1fr_400px]">
        <section className="space-y-5 rounded-[12px] border border-(--d-line) bg-(--d-panel) p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client"><select className="demo-input" value={q.client} onChange={(e) => { const x = w.clients.find((y) => y.id === e.target.value)!; set({ client: x.id, product: x.products[0] }); }}>{prospects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Field label="Product"><select className="demo-input" value={q.product} onChange={(e) => set({ product: e.target.value })}>{c.products.map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          {qtyStep}
          {packStep}
          {margin}
        </section>
        <section className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-5">
          <H>Price</H>
          {breakdown}
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={send}><Icon name="mail" size={18} />Send quote</Button><Button variant="primary" onClick={convert}>Convert to run</Button></div>
        </section>
      </div>

      <section>
        <H>Recent quotes</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {w.quotes.map((x) => {
            const pr = quotePrice({ ...x, base: "client" });
            return (
              <li key={x.id}>
                <RowCard title={clientName(w, x.client)} meta={`${x.id}, ${shortDay(x.date)}. ${x.gallons} gal ${x.product.toLowerCase()}, ${money(pr.price)}`} right={<Chip tone={x.status === "Accepted" ? "good" : x.status === "Sent" ? "info" : "neutral"}>{x.status}</Chip>}
                  foot={x.status !== "Accepted" ? (
                    <span className="flex flex-wrap gap-2">
                      {x.status === "Draft" ? <Button onClick={() => { setQuoteStatus(x.id, "Sent"); notify(`Quote ${x.id} sent (demo).`); }}>Send</Button> : null}
                      <Button onClick={() => convertQuote(x)}>Convert to run</Button>
                      <Button variant="ghost" onClick={() => open({ kind: "client", id: x.client })}>Client</Button>
                    </span>
                  ) : undefined} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
