"use client";

import { useMemo, useState } from "react";
import { diffDays } from "@demos/kit/data/dates";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button } from "@demos/kit/ui/ui";
import { shortDay, tuneups } from "@demos/atwood/derive";
import { Card, Chip, DoorArt, H, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

type Kind = "all" | "residential" | "commercial" | "tuneup";

export default function Customers() {
  const { d, w, open } = useAt();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [sheet, setSheet] = useState(false);
  const [limit, setLimit] = useState(25);
  const { last } = useMemo(() => tuneups(d, w, d.customers), [d, w]);
  const isDue = (id: string, commercial: boolean) => !commercial && diffDays(d.today, last.get(id)!) > 365;
  const needle = q.trim().toLowerCase();
  const list = d.customers
    .filter((c) => (kind === "all" || (kind === "residential" && !c.commercial) || (kind === "commercial" && c.commercial) || (kind === "tuneup" && isDue(c.id, c.commercial))) && (!needle || `${c.name} ${c.street} ${c.town} ${c.phone} ${c.contact}`.toLowerCase().includes(needle)))
    .sort((a, b) => (last.get(b.id)! < last.get(a.id)! ? -1 : 1));
  const labels: Record<Kind, string> = { all: "Everyone", residential: "Residential", commercial: "Commercial", tuneup: "Due for a tune-up" };
  return (
    <div className="space-y-4">
      <Title sub={`${d.customers.length} customers, ${d.customers.filter((c) => c.commercial).length} commercial. Every door on file.`}>Customers</Title>
      <div className="flex items-end gap-2">
        <SearchBar className="min-w-0 flex-1" label="Search customers" placeholder="Name, street, town or phone" value={q} onChange={(v) => { setQ(v); setLimit(25); }} />
        <Button onClick={() => setSheet(true)} aria-label={`Filter: ${labels[kind]}`}><Icon name="filter" size={18} />Filter{kind !== "all" ? <span className="rounded-full bg-(--d-accent) px-1.5 text-[12.5px] text-white">1</span> : null}</Button>
      </div>
      <H>{list.length} {labels[kind].toLowerCase()}</H>
      <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
        {list.slice(0, limit).map((c) => (
          <li key={c.id}>
            <Card title={c.name} meta={<>{c.street}, {c.town}<br />Last visit {shortDay(last.get(c.id)!)}, {last.get(c.id)!.slice(0, 4)}</>}
              right={<DoorArt door={c.door} className="w-16" />}
              foot={<span className="flex flex-wrap gap-1.5">{c.commercial ? <Chip tone="info">Commercial</Chip> : null}{isDue(c.id, c.commercial) ? <Chip tone="warn">Due for tune-up</Chip> : null}<Chip>{c.door.size} ft door</Chip></span>}
              onClick={() => open({ kind: "customer", id: c.id })} />
          </li>
        ))}
      </ul>
      {list.length > limit ? <div className="flex justify-center"><Button onClick={() => setLimit((l) => l + 25)}>Show more</Button></div> : null}
      {!list.length ? <p className="rounded-[14px] border border-dashed border-(--d-line) p-6 text-center text-(--d-muted)">Nobody matches. Try a shorter search.</p> : null}
      <Dialog open={sheet} sheet onClose={() => setSheet(false)} title="Show" footer={<Button variant="primary" onClick={() => setSheet(false)}>Show {list.length}</Button>}>
        <div role="radiogroup" aria-label="Customer filter" className="space-y-2">
          {(Object.keys(labels) as Kind[]).map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => { setKind(k); setLimit(25); }} className={`flex min-h-14 w-full items-center justify-between rounded-[12px] border-2 px-4 text-left text-[16.5px] font-bold ${kind === k ? "border-(--d-accent)" : "border-(--d-line)"}`}>{labels[k]}{kind === k ? <Icon name="check" size={20} className="text-(--d-accent)" /> : null}</button>)}
        </div>
      </Dialog>
    </div>
  );
}
