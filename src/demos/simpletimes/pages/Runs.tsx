"use client";

import { useState } from "react";
import { LINES, RUN_STATUSES, type RunStatus } from "@demos/simpletimes/catalog";
import { lineName } from "@demos/simpletimes/data";
import { ownerName, shortDay } from "@demos/simpletimes/derive";
import { Button } from "@demos/kit/ui/ui";
import { Chip, H, RowCard, RUN_TONE, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

export default function Runs() {
  const { d, w, open } = useSt();
  const [line, setLine] = useState("all");
  const [status, setStatus] = useState<RunStatus | "Active">("Active");
  const [limit, setLimit] = useState(15);
  const list = w.runs.filter((r) => (line === "all" || r.line === line) && (status === "Active" ? r.status !== "Shipped" : r.status === status));
  const ordered = status === "Shipped" ? [...list].reverse() : list;
  const count = (s: RunStatus) => w.runs.filter((r) => (line === "all" || r.line === line) && r.status === s).length;
  return (
    <div className="space-y-4">
      <Title sub="Every batch, by kettle. Tap one for its batch record.">Runs</Title>
      <div role="radiogroup" aria-label="Kettle" className="grid grid-cols-4 gap-1 rounded-[12px] bg-(--d-panel2) p-1">
        {[{ id: "all", name: "All" }, ...LINES].map((l) => <button key={l.id} type="button" role="radio" aria-checked={line === l.id} onClick={() => setLine(l.id)} className={`min-h-12 rounded-[9px] px-1 text-[14px] font-semibold ${line === l.id ? "bg-(--d-panel) text-(--d-text) shadow-sm" : "text-(--d-muted)"}`}>{l.name}</button>)}
      </div>
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1">
        {(["Active", ...RUN_STATUSES] as const).map((s) => { const on = status === s; return <button key={s} type="button" aria-pressed={on} onClick={() => { setStatus(s); setLimit(15); }} className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold ${on ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>{s}{s !== "Active" ? <span className={`rounded-full px-1.5 text-[12.5px] ${on ? "bg-black/15" : "bg-(--d-panel2) text-(--d-muted)"}`}>{count(s)}</span> : null}</button>; })}
      </div>
      <H>{list.length} {list.length === 1 ? "run" : "runs"}</H>
      <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
        {ordered.slice(0, limit).map((r) => (
          <li key={r.id}>
            <RowCard title={r.product} meta={`${r.id}, ${r.date === d.today ? "today" : shortDay(r.date)}, ${lineName(r.line)}. ${ownerName(w, r.owner)}`} right={<Chip tone={RUN_TONE[r.status]}>{r.status}</Chip>}
              foot={<span className="text-[14px] text-(--d-muted)">{r.gallons} gal, {r.bottles.toLocaleString("en-US")} bottles{r.ship ? `. Ships ${shortDay(r.ship)}` : ""}</span>} onClick={() => open({ kind: "run", id: r.id })} />
          </li>
        ))}
      </ul>
      {ordered.length > limit ? <div className="flex justify-center"><Button onClick={() => setLimit((l) => l + 15)}>Show more</Button></div> : null}
    </div>
  );
}
