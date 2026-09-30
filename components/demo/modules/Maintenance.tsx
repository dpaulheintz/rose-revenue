"use client";

import { useId, useMemo, useState } from "react";
import type { Priority } from "@/demos/types";
import type { MaintenanceItem, MaintenanceStatus } from "@/lib/demo/generate";
import { addDays, diffDays } from "@/lib/demo/dates";
import { money, shortDate } from "@/lib/demo/format";
import { overdueMaintenance } from "@/lib/demo/derive";
import { useDemo } from "../DemoProvider";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Avatar, Button, Field, PageHeader, Pill, Segmented, type Tone } from "../ui";

const PRIORITY_TONE: Record<Priority, Tone> = { Critical: "bad", High: "warn", Medium: "accent", Low: "neutral" };
const STATUS_TONE: Record<MaintenanceStatus, Tone> = { Open: "info", "In progress": "accent", "Waiting on parts": "warn", Done: "good" };
const STATUSES: MaintenanceStatus[] = ["Open", "In progress", "Waiting on parts", "Done"];
const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const DUE_IN: Record<Priority, number> = { Critical: 3, High: 7, Medium: 14, Low: 28 };

type View = "board" | "table";

export default function Maintenance() {
  const { cfg, maintenance, anchor } = useDemo();
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const item = openId ? maintenance.find((m) => m.id === openId) ?? null : null;

  const sorted = useMemo(
    () =>
      [...maintenance].sort((a, b) =>
        (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.dueOn.localeCompare(b.dueOn),
      ),
    [maintenance],
  );
  const counts = STATUSES.map((s) => [s, maintenance.filter((m) => m.status === s).length] as const);
  const overdue = overdueMaintenance(maintenance, anchor).length;

  return (
    <>
      <PageHeader
        title="Maintenance"
        meta={<span className="flex flex-wrap gap-x-3 gap-y-1">{counts.map(([s, n]) => <span key={s}>{n} {s.toLowerCase()}</span>)}<span className={overdue ? "text-(--d-bad)" : ""}>{overdue} overdue</span></span>}
        actions={
          <>
            <Segmented<View> label="Maintenance view" value={view} onChange={setView} options={[
              { value: "board", label: <><Icon name="columns" size={16} />Board</> },
              { value: "table", label: <><Icon name="table" size={16} />Table</> },
            ]} />
            <Button variant="primary" onClick={() => setReporting(true)}><Icon name="plus" size={18} />Report an issue</Button>
          </>
        }
      />

      {view === "board" ? (
        <>
        <p className="mb-2 flex items-center gap-1.5 text-[12.5px] text-(--d-muted)">{cfg.maintenance.locations.length} locations · scroll sideways <Icon name="arrow" size={14} /></p>
        <div className="demo-scroll-x demo-snap -mx-4 flex gap-3 px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {cfg.maintenance.locations.map((loc) => {
            const items = sorted.filter((m) => m.location === loc);
            const active = items.filter((m) => m.status !== "Done").length;
            return (
              <section key={loc} aria-label={loc} className="demo-card flex w-[82vw] max-w-[320px] shrink-0 flex-col sm:w-[300px]">
                <header className="flex items-center justify-between gap-2 border-b border-(--d-line) px-4 py-3">
                  <h2 className="demo-display text-[15px]">{loc}</h2>
                  <span className="text-[12.5px] text-(--d-muted)">{active} open</span>
                </header>
                <ul className="flex flex-col gap-2 p-2.5">
                  {items.map((m) => <li key={m.id}><IssueCard m={m} onOpen={() => setOpenId(m.id)} /></li>)}
                  {!items.length ? <li className="p-3 text-[13.5px] text-(--d-muted)">Nothing reported.</li> : null}
                </ul>
              </section>
            );
          })}
        </div>
        </>
      ) : (
        <IssueTable items={sorted} onOpen={setOpenId} />
      )}

      <IssueDrawer item={item} onClose={() => setOpenId(null)} />
      <ReportIssue open={reporting} onClose={() => setReporting(false)} />
    </>
  );
}

function DueLabel({ m }: { m: MaintenanceItem }) {
  const { anchor } = useDemo();
  if (m.status === "Done") return <span className="text-(--d-muted)">Done {m.closedOn ? shortDate(m.closedOn) : ""}</span>;
  const late = diffDays(anchor, m.dueOn);
  return late > 0 ? <span className="text-(--d-bad)">{late}d overdue</span> : <span className="text-(--d-muted)">Due {shortDate(m.dueOn)}</span>;
}

function IssueCard({ m, onOpen }: { m: MaintenanceItem; onOpen: () => void }) {
  const { person } = useDemo();
  return (
    <button type="button" onClick={onOpen} className={`w-full rounded-xl border border-(--d-line) bg-(--d-bg) p-3 text-left hover:border-(--d-muted) ${m.status === "Done" ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <Pill tone={PRIORITY_TONE[m.priority]}>{m.priority}</Pill>
        {m.photos ? <span className="flex items-center gap-1 text-[12px] text-(--d-muted)"><Icon name="camera" size={14} />{m.photos}</span> : null}
      </div>
      <p className="mt-2 text-[14.5px] font-medium leading-snug">{m.title}</p>
      <p className="text-[12.5px] text-(--d-muted)">{m.equipment}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[12.5px]">
        <Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill>
        <span className="flex items-center gap-2"><DueLabel m={m} /><Avatar name={person(m.assignee).name} size={22} /></span>
      </div>
    </button>
  );
}

function IssueTable({ items, onOpen }: { items: MaintenanceItem[]; onOpen: (id: string) => void }) {
  const { person } = useDemo();
  return (
    <>
      <div className="demo-card demo-scroll-x hidden md:block">
        <table className="w-full min-w-[960px] text-left text-[14px]">
          <thead className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">
            <tr className="border-b border-(--d-line)">
              {["Issue", "Location", "Priority", "Status", "Assignee", "Reported", "Due", "Cost"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-medium first:pl-5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className={`border-b border-(--d-line)/60 last:border-0 hover:bg-(--d-panel2) ${m.status === "Done" ? "opacity-65" : ""}`}>
                <td className="py-2.5 pr-3 pl-5">
                  <button type="button" onClick={() => onOpen(m.id)} className="text-left font-medium hover:text-(--d-accent)">{m.title}</button>
                  <div className="text-[12.5px] text-(--d-muted)">{m.equipment}</div>
                </td>
                <td className="px-3 text-(--d-muted)">{m.location}</td>
                <td className="px-3"><Pill tone={PRIORITY_TONE[m.priority]}>{m.priority}</Pill></td>
                <td className="px-3"><Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill></td>
                <td className="px-3"><span className="flex items-center gap-2 text-(--d-muted)"><Avatar name={person(m.assignee).name} size={24} />{person(m.assignee).name.split(" ")[0]}</span></td>
                <td className="px-3 whitespace-nowrap text-(--d-muted)">{shortDate(m.reportedOn)}</td>
                <td className="px-3 whitespace-nowrap"><DueLabel m={m} /></td>
                <td className="px-3 text-(--d-muted)">{m.cost != null ? money(m.cost) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {items.map((m) => <li key={m.id}><IssueCard m={m} onOpen={() => onOpen(m.id)} /></li>)}
      </ul>
    </>
  );
}

function IssueDrawer({ item, onClose }: { item: MaintenanceItem | null; onClose: () => void }) {
  const { person, setIssueStatus } = useDemo();
  const m = item;
  return (
    <Dialog drawer open={!!m} onClose={onClose} title={m?.title ?? ""} subtitle={m ? `${m.location} · ${m.equipment}` : null} footer={<Button onClick={onClose}>Close</Button>}>
      {m ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2"><Pill tone={PRIORITY_TONE[m.priority]}>{m.priority} priority</Pill><Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill></div>
          <Field label="Status">
            <select className="demo-input" value={m.status} onChange={(e) => setIssueStatus(m.id, e.target.value as MaintenanceStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <dl className="grid grid-cols-2 gap-3 text-[14px]">
            {[
              ["Reported by", person(m.reporter).name],
              ["Assigned to", person(m.assignee).name],
              ["Reported", shortDate(m.reportedOn)],
              ["Due", shortDate(m.dueOn)],
              ["Closed", m.closedOn ? shortDate(m.closedOn) : "—"],
              ["Cost", m.cost != null ? money(m.cost) : "Not yet"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-(--d-bg) p-3"><dt className="text-[12px] uppercase tracking-[0.08em] text-(--d-muted)">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
            ))}
          </dl>
          <section>
            <h3 className="demo-display mb-3 text-[15px] text-(--d-muted)">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: Math.max(1, m.photos) }, (_, i) => (
                <div key={i} className="grid aspect-square place-items-center rounded-xl border border-dashed border-(--d-line) bg-(--d-bg) text-(--d-muted)">
                  <span className="flex flex-col items-center gap-1 text-[11.5px]"><Icon name="camera" size={20} />{m.photos ? "Photo" : "No photos yet"}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}

function ReportIssue({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cfg, anchor, addIssue, notify } = useDemo();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(cfg.maintenance.locations[0]);
  const [equipment, setEquipment] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const formId = useId();

  const save = () => {
    addIssue({
      title: title.trim() || "New issue",
      equipment: equipment.trim() || "Not specified",
      location,
      priority,
      status: "Open",
      reporter: "you",
      assignee: "maint",
      reportedOn: anchor,
      dueOn: addDays(anchor, DUE_IN[priority]),
      closedOn: null,
      cost: null,
      photos: 0,
    });
    setTitle("");
    setEquipment("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Report an issue" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Add to board</Button></>}>
      <form id={formId} className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="What's wrong?" className="sm:col-span-2"><input className="demo-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ice machine leaking" /></Field>
        <Field label="Where">
          <select className="demo-input" value={location} onChange={(e) => setLocation(e.target.value)}>{cfg.maintenance.locations.map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <Field label="Priority">
          <select className="demo-input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>{(["Low", "Medium", "High", "Critical"] as const).map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field label="Equipment" className="sm:col-span-2"><input className="demo-input" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g. Ice machine" /></Field>
        <div className="sm:col-span-2">
          <Button onClick={() => notify()}><Icon name="camera" size={18} />Add photos</Button>
        </div>
      </form>
    </Dialog>
  );
}
