"use client";

import { useState } from "react";
import { PipelineBoard } from "@demos/kit/blocks/PipelineBoard";
import { StagePager } from "@demos/kit/blocks/StagePager";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { STAGES, type Stage } from "@demos/simpletimes/catalog";
import type { Client } from "@demos/simpletimes/data";
import { shortDay } from "@demos/simpletimes/derive";
import { Chip, moneyK, NUM, STAGE_TONE, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function Pipeline() {
  const { w, d, open, moveClient, notify } = useSt();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = w.clients.filter((c) => !needle || `${c.name} ${c.products.join(" ")} ${c.contact.name}`.toLowerCase().includes(needle));
  const move = (id: string, to: Stage) => { moveClient(id, to); notify(`Moved to ${to}.`); };
  const facts = (c: Client) => `${c.products.join(", ")}. Min run ${c.minRun} gal`;
  const next = (c: Client) => <span className={`text-[14px] ${c.nextDate < d.today ? "font-semibold text-(--d-bad)" : "text-(--d-muted)"}`}>Next: {c.next}, {shortDay(c.nextDate)}</span>;
  const yearly = list.filter((c) => c.stage === "Production" || c.stage === "Repeat").reduce((s, c) => s + c.value, 0);
  return (
    <div className="space-y-4">
      <Title sub={`${list.length} clients and prospects. ${moneyK(yearly)} a year in production now.`}>Pipeline</Title>
      <SearchBar label="Search clients" placeholder="Brand, product or contact" value={q} onChange={setQ} />
      <div className="md:hidden">
        <StagePager<Client, Stage>
          label="Pipeline stages" stages={[...STAGES]} items={list} stageOf={(c) => c.stage} getKey={(c) => c.id} getName={(c) => c.name} onMove={move} initial="Sample"
          renderCard={(c, moveBtn) => (
            <div className="rounded-[12px] border border-(--d-line) bg-(--d-panel) p-4">
              <button type="button" onClick={() => open({ kind: "client", id: c.id })} className="block min-h-12 w-full text-left">
                <span className="flex items-start justify-between gap-3"><span className="text-[16.5px] font-semibold">{c.name}</span><span className={`${NUM} text-[17px]`}>{moneyK(c.value)}</span></span>
                <span className="mt-0.5 block text-[14px] text-(--d-muted)">{facts(c)}</span>
                <span className="mt-1 block">{next(c)}</span>
              </button>
              <div className="mt-2 flex justify-end">{moveBtn}</div>
            </div>
          )}
        />
      </div>
      <div className="hidden md:block">
        <p className="mb-2 text-[15px] text-(--d-muted)">Drag a card by its handle to move it along.</p>
        <PipelineBoard<Client, Stage>
          scrollOnly items={list} stages={[...STAGES]} stageOf={(c) => c.stage} onMove={move}
          stageClass={(s) => ({ good: "bg-[color-mix(in_oklab,var(--d-good)_14%,white)] text-(--d-good)", warn: "bg-[color-mix(in_oklab,#cecb00_40%,white)] text-[#5a4a00]", info: "bg-[color-mix(in_oklab,var(--d-info)_12%,white)] text-(--d-info)", neutral: "bg-(--d-panel) text-(--d-muted)", bad: "", accent: "" })[STAGE_TONE[s]]}
          total={(xs) => moneyK(xs.reduce((s, c) => s + c.value, 0))}
          renderCard={(c, grip) => (
            <div className="flex items-start gap-1 p-1.5">
              {grip}
              <button type="button" onClick={() => open({ kind: "client", id: c.id })} className="min-h-12 min-w-0 flex-1 py-1 pr-1 text-left">
                <span className="block text-[15px] leading-snug font-semibold">{c.name}</span>
                <span className="block text-[13.5px] text-(--d-muted)">{facts(c)}</span>
                <span className="mt-1 block">{next(c)}</span>
              </button>
            </div>
          )}
        />
      </div>
      <p className="text-[14px] text-(--d-muted)">Stages: {STAGES.join(", ")}. <Chip>{list.length} total</Chip></p>
    </div>
  );
}
