"use client";

import { useId, useMemo, useState } from "react";
import { addDays, eachDay, weekday, type Ymd } from "@/lib/demo/dates";
import { dayDate } from "@/lib/demo/format";
import type { CrewId, LeadSource, PhotoTag } from "@/lib/demo/shop/types";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Button, Field } from "../ui";
import EstimateBuilder from "./EstimateBuilder";
import InvoiceSheet from "./InvoiceSheet";
import JobSheet from "./JobSheet";
import { useShop } from "./ShopProvider";

const workdays = (from: Ymd, n: number) => eachDay(from, addDays(from, n)).filter((d) => weekday(d) !== 0 && weekday(d) !== 6);

/** Everything that floats above the modules: the job page, builders, sheets, the + button. */
export default function ShopOverlays() {
  const { overlay, open } = useShop();
  const close = () => open(null);
  return (
    <>
      <QuickAddButton />
      {overlay?.kind === "job" ? <JobSheet id={overlay.id} onClose={close} /> : null}
      {overlay?.kind === "invoice" ? <InvoiceSheet id={overlay.id} onClose={close} /> : null}
      {overlay?.kind === "estimate" ? <EstimateBuilder key={overlay.id ?? "new"} id={overlay.id} customer={overlay.customer} onClose={close} /> : null}
      {overlay?.kind === "move" ? <MoveJob id={overlay.id} onClose={close} /> : null}
      {overlay?.kind === "quick" ? <QuickSheet what={overlay.what} job={overlay.job} onClose={close} /> : null}
    </>
  );
}

function QuickAddButton() {
  const { open } = useShop();
  const [menu, setMenu] = useState(false);
  const items = [
    { label: "New estimate", icon: "receipt" as const, go: () => open({ kind: "estimate", id: null }) },
    { label: "New job", icon: "hammer" as const, go: () => open({ kind: "quick", what: "job" }) },
    { label: "Log time", icon: "clock" as const, go: () => open({ kind: "quick", what: "time" }) },
    { label: "Add photo", icon: "camera" as const, go: () => open({ kind: "quick", what: "photo" }) },
    { label: "New lead", icon: "users" as const, go: () => open({ kind: "quick", what: "lead" }) },
  ];
  return (
    <>
      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label="Quick add"
        aria-haspopup="dialog"
        className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[45] grid size-16 place-items-center rounded-full bg-(--d-accent) text-(--d-on-accent) shadow-[0_12px_30px_-10px_rgb(0_0_0_/_0.6)] hover:brightness-110 md:right-6 md:bottom-6"
      >
        <Icon name="plus" size={30} />
      </button>
      <Dialog open={menu} onClose={() => setMenu(false)} title="Quick add">
        <ul className="grid *:min-w-0 grid-cols-1 gap-2 pb-2 min-[420px]:grid-cols-2">
          {items.map((it) => (
            <li key={it.label}>
              <button type="button" onClick={() => { setMenu(false); it.go(); }} className="flex min-h-16 w-full items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-left text-[16px] font-semibold hover:border-(--d-accent)">
                <span className="grid size-10 place-items-center rounded-[10px] bg-(--d-panel2) text-(--d-accent)"><Icon name={it.icon} size={22} /></span>
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}

function MoveJob({ id, onClose }: { id: string; onClose: () => void }) {
  const { book, seed, job, moveJob } = useShop();
  const j = job(id);
  const first = j.days.find((d) => d >= book.anchor) ?? j.start;
  const [date, setDate] = useState<Ymd>(first);
  const [crew, setCrew] = useState<CrewId>(j.crew);
  const options = useMemo(() => workdays(book.anchor, 34), [book.anchor]);
  const formId = useId();
  return (
    <Dialog
      open
      onClose={onClose}
      title="Move job"
      subtitle={`${j.no} · ${j.title}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Move to {dayDate(date)}</Button></>}
    >
      <form id={formId} onSubmit={(e) => { e.preventDefault(); moveJob(id, date, crew); onClose(); }} className="space-y-4">
        <fieldset>
          <legend className="text-[13px] font-semibold text-(--d-muted)">New start day</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {options.slice(0, 15).map((d) => (
              <label key={d} className={`grid min-h-14 cursor-pointer place-items-center rounded-[10px] border text-center text-[13px] leading-tight font-semibold ${date === d ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line)"}`}>
                <input type="radio" name="day" className="sr-only" checked={date === d} onChange={() => setDate(d)} />
                {dayDate(d).replace(" ", "\n")}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Crew">
          <select className="demo-input" value={crew} onChange={(e) => setCrew(e.target.value as CrewId)}>
            {seed.crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <p className="text-[13px] text-(--d-muted)">Days already worked stay put; the rest of the schedule slides with it. The customer gets a text in the real version.</p>
      </form>
    </Dialog>
  );
}

function QuickSheet({ what, job: preset, onClose }: { what: "job" | "time" | "photo" | "lead"; job?: string; onClose: () => void }) {
  const { book, seed, addJob, addTime, addPhoto, addLead, job } = useShop();
  const formId = useId();
  const active = useMemo(() => book.jobs.filter((j) => j.status === "In progress" || (j.status === "Scheduled" && j.start <= addDays(book.anchor, 14))).sort((a, b) => (a.start < b.start ? -1 : 1)), [book]);
  const [jobId, setJobId] = useState(preset ?? active[0]?.id ?? book.jobs.at(-1)!.id);
  const [worker, setWorker] = useState(seed.workers[0].id);
  const [hours, setHours] = useState("8");
  const [tag, setTag] = useState<PhotoTag>("During");
  const [cust, setCust] = useState(book.customers[0].id);
  const [type, setType] = useState(seed.jobTypes[0].key);
  const [date, setDate] = useState<Ymd>(workdays(addDays(book.anchor, 1), 7)[0]);
  const [name, setName] = useState("");
  const [source, setSource] = useState<LeadSource>("Referral");
  const titles = { job: "New job", time: "Log time", photo: "Add photo", lead: "New lead" };
  const submit = () => {
    if (what === "job") { const t = seed.jobTypes.find((x) => x.key === type)!; addJob({ customer: cust, type, date, crew: t.crew, title: t.titles[0] }); }
    if (what === "time") addTime({ worker, date: book.anchor, job: jobId, hours: Math.min(14, Number(hours) || 0) });
    if (what === "photo") addPhoto(jobId, tag);
    if (what === "lead") { const t = seed.jobTypes.find((x) => x.key === type)!; addLead({ name: name.trim() || "New lead", customer: null, town: seed.towns[0], type, value: Math.round((t.price[0] + t.price[1]) / 2), source, stage: "New", created: book.anchor, followUp: addDays(book.anchor, 1), estimate: null, note: "Added from the quick-add button." }); }
    onClose();
  };
  const jobPicker = (
    <Field label="Job">
      <select className="demo-input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
        {active.map((j) => <option key={j.id} value={j.id}>{j.no} · {j.title}</option>)}
        {preset && !active.some((j) => j.id === preset) ? <option value={preset}>{job(preset).no} · {job(preset).title}</option> : null}
      </select>
    </Field>
  );
  return (
    <Dialog open onClose={onClose} title={titles[what]} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>{what === "photo" ? "Add photo" : what === "time" ? "Log hours" : "Save"}</Button></>}>
      <form id={formId} onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-3">
        {what === "job" ? (
          <>
            <Field label="Customer"><select className="demo-input" value={cust} onChange={(e) => setCust(e.target.value)}>{book.customers.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Type of work"><select className="demo-input" value={type} onChange={(e) => setType(e.target.value)}>{seed.jobTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></Field>
            <Field label="Start"><select className="demo-input" value={date} onChange={(e) => setDate(e.target.value)}>{workdays(addDays(book.anchor, 1), 20).map((d) => <option key={d} value={d}>{dayDate(d)}</option>)}</select></Field>
          </>
        ) : null}
        {what === "time" ? (
          <>
            <Field label="Who"><select className="demo-input" value={worker} onChange={(e) => setWorker(e.target.value)}>{seed.workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
            {jobPicker}
            <Field label="Hours today"><input className="demo-input" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))} /></Field>
          </>
        ) : null}
        {what === "photo" ? (
          <>
            {jobPicker}
            <fieldset>
              <legend className="text-[13px] font-semibold text-(--d-muted)">Tag</legend>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(["Before", "During", "After"] as const).map((x) => (
                  <label key={x} className={`grid min-h-12 cursor-pointer place-items-center rounded-[10px] border font-semibold ${tag === x ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line)"}`}>
                    <input type="radio" name="tag" className="sr-only" checked={tag === x} onChange={() => setTag(x)} />{x}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-[13px] text-(--d-muted)">On a phone this opens the camera. In the demo it adds a placeholder tile.</p>
          </>
        ) : null}
        {what === "lead" ? (
          <>
            <Field label="Name"><input className="demo-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Who called?" /></Field>
            <Field label="Looking for"><select className="demo-input" value={type} onChange={(e) => setType(e.target.value)}>{seed.jobTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></Field>
            <Field label="Heard about us"><select className="demo-input" value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>{seed.sources.map((s) => <option key={s.name}>{s.name}</option>)}</select></Field>
          </>
        ) : null}
      </form>
    </Dialog>
  );
}
