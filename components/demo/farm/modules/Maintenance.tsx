"use client";

import { useId, useMemo, useState } from "react";
import { addDays, diffDays } from "@/lib/demo/dates";
import { money, moneyK, num, shortDate } from "@/lib/demo/format";
import { fmtDays, sum } from "@/lib/demo/farm/derive";
import type { EquipmentItem } from "@/lib/demo/farm/types";
import { BarList } from "../../charts";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import { Button, Card, Field, FilterChip, PageHeader, Pill, Stat } from "../../ui";
import { useFarm } from "../FarmProvider";

export default function Maintenance() {
  const { ds, serviced, logService, repairs, person } = useFarm();
  const t = ds.anchor;
  const [group, setGroup] = useState("All");
  const [reporting, setReporting] = useState(false);

  const items = useMemo(
    () => ds.equipment.map((e) => {
      const last = serviced[e.id] ?? e.lastService;
      const next = addDays(last, e.every);
      const left = diffDays(next, t);
      return { e, last, next, left, state: left < 0 ? ("Overdue" as const) : left <= 14 ? ("Due soon" as const) : ("OK" as const) };
    }),
    [ds, serviced, t],
  );
  const groups = [...new Set(ds.equipment.map((e) => e.group))];
  const shown = items.filter((x) => group === "All" || x.e.group === group).sort((a, b) => a.left - b.left);

  const log = useMemo(() => {
    const base = ds.equipment.flatMap((e) => e.log.map((l) => ({ ...l, equipment: e.id })));
    const added = repairs.map((r) => ({ ...r }));
    const svc = Object.entries(serviced).map(([id, date]) => {
      const e = ds.equipment.find((x) => x.id === id)!;
      return { equipment: id, date, title: `Routine: ${e.task.toLowerCase()}`, cost: e.cost, by: "you" };
    });
    return [...added, ...svc, ...base].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [ds, repairs, serviced]);
  const yearLog = log.filter((l) => l.date >= ds.windowStart);
  const repairsOnly = yearLog.filter((l) => !l.title.startsWith("Routine"));
  const spendByGroup = groups.map((g) => ({ key: g, label: g, value: sum(yearLog.filter((l) => ds.equipment.find((e) => e.id === l.equipment)!.group === g), (l) => l.cost) })).sort((a, b) => b.value - a.value);
  const name = (id: string) => ds.equipment.find((e) => e.id === id)!.name;
  const by = (id: string) => (id === "you" ? "You" : id === "Outside shop" ? "Outside shop" : person(id).name);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        meta={`${ds.equipment.length} pieces of equipment · service intervals by days`}
        actions={<Button variant="primary" onClick={() => setReporting(true)}><Icon name="plus" size={18} />Log a repair</Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Overdue" value={num(items.filter((x) => x.state === "Overdue").length)} sub="Past their service date" tone="bad" />
        <Stat label="Due in 2 weeks" value={num(items.filter((x) => x.state === "Due soon").length)} sub="Plan them into chores" tone="warn" />
        <Stat label="Repairs, 12 months" value={moneyK(sum(repairsOnly, (l) => l.cost))} sub={`${repairsOnly.length} repairs`} />
        <Stat label="Routine service, 12 months" value={moneyK(sum(yearLog.filter((l) => l.title.startsWith("Routine")), (l) => l.cost))} sub="Parts + outside shop" />
      </div>

      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {["All", ...groups].map((g) => (
          <FilterChip key={g} on={group === g} onClick={() => setGroup(g)} count={g === "All" ? items.length : items.filter((x) => x.e.group === g).length}>{g}</FilterChip>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((x) => (
          <EquipmentCard key={x.e.id} x={x} onService={() => logService(x.e.id)} />
        ))}
      </ul>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8" title="Repair + service log">
          <div className="demo-scroll-x -mx-4 sm:-mx-5">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="text-[12.5px] text-(--d-muted)">
                <tr className="border-b border-(--d-line)"><th className="px-4 py-2.5 font-semibold sm:px-5">Date</th><th className="px-2 py-2.5 font-semibold">Equipment</th><th className="px-2 py-2.5 font-semibold">Work</th><th className="px-2 py-2.5 font-semibold">By</th><th className="px-4 py-2.5 text-right font-semibold sm:px-5">Cost</th></tr>
              </thead>
              <tbody>
                {log.slice(0, 18).map((l, i) => (
                  <tr key={i} className="border-b border-(--d-line) last:border-0">
                    <td className="px-4 py-2.5 whitespace-nowrap sm:px-5">{shortDate(l.date)}</td>
                    <td className="px-2 py-2.5">{name(l.equipment)}</td>
                    <td className="px-2 py-2.5">{l.title.startsWith("Routine") ? <span className="text-(--d-muted)">{l.title}</span> : <span className="font-semibold">{l.title}</span>}</td>
                    <td className="px-2 py-2.5 text-(--d-muted)">{by(l.by)}</td>
                    <td className="px-4 py-2.5 text-right sm:px-5">{l.cost ? money(l.cost) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="lg:col-span-4" title="Spend by area, 12 months">
          <BarList rows={spendByGroup} format={money} />
        </Card>
      </div>

      <RepairDialog open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}

function EquipmentCard({ x, onService }: { x: { e: EquipmentItem; last: string; next: string; left: number; state: "Overdue" | "Due soon" | "OK" }; onService: () => void }) {
  const { ds } = useFarm();
  const done = x.last === ds.anchor;
  return (
    <li className={`demo-card flex flex-col p-4 ${x.state === "Overdue" ? "border-(--d-bad)/50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{x.e.name}</span>
          <span className="block text-[12.5px] text-(--d-muted)">{x.e.group} · every {x.e.every} days</span>
        </span>
        <Pill tone={x.state === "Overdue" ? "bad" : x.state === "Due soon" ? "warn" : "good"}>{x.state === "Overdue" ? `${-x.left}d overdue` : x.state === "Due soon" ? `Due ${fmtDays(x.left)}` : "OK"}</Pill>
      </div>
      <p className="mt-2 text-[13.5px]">{x.e.task}</p>
      <p className="mt-1 text-[12.5px] text-(--d-muted)">Last {done ? "today" : shortDate(x.last)} · next {shortDate(x.next)}</p>
      <div className="mt-auto pt-3">
        <Button className="w-full" variant={x.state === "Overdue" ? "primary" : "secondary"} onClick={onService} disabled={done}>
          <Icon name="check" size={18} />{done ? "Serviced today" : "Log service"}
        </Button>
      </div>
    </li>
  );
}

function RepairDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ds, seed, logRepair } = useFarm();
  const [equipment, setEquipment] = useState(ds.equipment[0].id);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [by, setBy] = useState(seed.people[0].id);
  const formId = useId();
  const reset = () => { setTitle(""); setCost(""); onClose(); };
  return (
    <Dialog
      open={open}
      onClose={reset}
      title="Log a repair"
      footer={<><Button onClick={reset}>Cancel</Button><Button variant="primary" type="submit" form={formId} disabled={!title.trim()}>Save repair</Button></>}
    >
      <form id={formId} className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; logRepair({ equipment, title: title.trim(), cost: Number(cost) || 0, by }); reset(); }}>
        <Field label="Equipment">
          <select className="demo-input" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {ds.equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
        <Field label="What was fixed">
          <input className="demo-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Replaced float valve at Pond Field tank" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost ($)">
            <input className="demo-input" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          </Field>
          <Field label="Who">
            <select className="demo-input" value={by} onChange={(e) => setBy(e.target.value)}>
              {seed.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
