"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, weekStart } from "@/lib/demo/dates";
import { shortDate } from "@/lib/demo/format";
import { sum, weekHours } from "@/lib/demo/shop/derive";
import { useDemo } from "../../DemoProvider";
import { ColumnChart } from "../../charts";
import Dialog from "../../Dialog";
import Icon from "../../Icon";
import { Avatar, Button, Card, Field, PageHeader, Segmented } from "../../ui";
import { CrewDot } from "../bits";
import { useShop } from "../ShopProvider";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Wall-clock milliseconds, ticking every second while someone is on the clock. */
function useClock(on: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!on) return;
    const tick = () => setNow(Date.now());
    tick();
    const i = window.setInterval(tick, 1000);
    return () => window.clearInterval(i);
  }, [on]);
  return now;
}

export default function Crew() {
  const { notify } = useDemo();
  const { book, seed, clocked, clockIn, clockOut, job } = useShop();
  const [week, setWeek] = useState<"this" | "last" | "prev">("this");
  const [detail, setDetail] = useState<string | null>(null);
  const [who, setWho] = useState(seed.workers[0].id);
  const today = book.jobs.filter((j) => j.days.includes(book.anchor));
  const [jobFor, setJobFor] = useState<string>("");
  const now = useClock(Object.keys(clocked).length > 0);

  const monday = week === "this" ? weekStart(book.anchor) : addDays(weekStart(book.anchor), week === "last" ? -7 : -14);
  const sheet = useMemo(() => weekHours(book, seed, monday), [book, seed, monday]);
  const weekly = useMemo(
    () => book.weeks.map((w) => {
      const es = book.time.filter((e) => e.date >= w && e.date <= addDays(w, 6));
      return { label: shortDate(w), values: [sum(es.filter((e) => e.job), (e) => e.hours), sum(es.filter((e) => !e.job), (e) => e.hours)] };
    }),
    [book],
  );
  const w = seed.workers.find((x) => x.id === who)!;
  const crewJobs = today.filter((j) => j.crew === w.crew);
  const c = clocked[who];
  const elapsed = c && now ? Math.max(0, Math.floor((now - c.since) / 1000)) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Crew & time" meta={`${seed.workers.length} people on ${seed.crews.length} crews · hours flow into job costing and payroll`} actions={<Button onClick={() => notify()}><Icon name="table" size={18} />Export payroll</Button>} />

      <Card title="Clock in / out">
        <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-2 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Who's clocking">
          {seed.workers.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={who === x.id} onClick={() => { setWho(x.id); setJobFor(""); }} className={`flex min-h-14 shrink-0 items-center gap-2 rounded-full border px-3 pr-4 ${who === x.id ? "border-(--d-accent) bg-[color-mix(in_oklab,var(--d-accent)_14%,transparent)]" : "border-(--d-line)"}`}>
              <Avatar name={x.name} size={32} />
              <span className="text-left text-[13.5px] leading-tight"><span className="block font-semibold">{x.name.split(" ")[0]}</span><span className="block text-(--d-muted)">{clocked[x.id] ? "On the clock" : x.role}</span></span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          {c ? (
            <div>
              <p className="text-[13px] font-semibold text-(--d-muted)">{w.name} · on the clock</p>
              <p className="demo-display mt-1 text-[40px] tabular-nums leading-none">{String(Math.floor(elapsed / 3600)).padStart(2, "0")}:{String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p>
              <p className="mt-1 text-[13.5px] text-(--d-muted)">{c.job ? `${job(c.job).no} · ${job(c.job).title}` : "Shop / drive time"}</p>
            </div>
          ) : (
            <Field label={`${w.name.split(" ")[0]}'s job today`}>
              <select className="demo-input" value={jobFor} onChange={(e) => setJobFor(e.target.value)}>
                <option value="">Shop / drive time</option>
                {crewJobs.map((j) => <option key={j.id} value={j.id}>{j.no} · {j.title}</option>)}
              </select>
            </Field>
          )}
          {c ? (
            <button type="button" onClick={() => clockOut(who)} className="flex min-h-20 items-center justify-center gap-3 rounded-[14px] bg-(--d-bad) px-8 text-[20px] font-bold text-white hover:brightness-110"><Icon name="stop" size={24} />Clock out</button>
          ) : (
            <button type="button" onClick={() => clockIn(who, jobFor || null)} className="flex min-h-20 items-center justify-center gap-3 rounded-[14px] bg-(--d-accent) px-8 text-[20px] font-bold text-(--d-on-accent) hover:brightness-110"><Icon name="play" size={24} />Clock in</button>
          )}
        </div>
      </Card>

      <Card title="Timesheet" action={<Segmented label="Week" value={week} onChange={setWeek} options={[{ value: "this", label: "This week" }, { value: "last", label: "Last week" }, { value: "prev", label: "2 weeks ago" }]} />}>
        <div className="demo-scroll-x -mx-4 sm:-mx-5">
          <table className="w-full min-w-[680px] text-left text-[14px]">
            <thead className="text-[12.5px] text-(--d-muted)">
              <tr className="border-b border-(--d-line)">
                <th className="px-4 py-2 font-semibold sm:px-5">Week of {shortDate(monday)}</th>
                {DOW.map((d, i) => <th key={d} className={`px-1.5 py-2 text-right font-semibold ${addDays(monday, i) === book.anchor ? "text-(--d-accent)" : ""}`}>{d}</th>)}
                <th className="px-2 py-2 text-right font-semibold">On jobs</th>
                <th className="px-4 py-2 text-right font-semibold sm:px-5">Total</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((r) => (
                <tr key={r.w.id} className="border-b border-(--d-line) last:border-0">
                  <td className="px-4 py-1 sm:px-5"><button type="button" onClick={() => setDetail(r.w.id)} className="flex min-h-12 items-center gap-2 text-left"><CrewDot crew={r.w.crew} /><span className="font-semibold underline-offset-2 hover:underline">{r.w.name}</span></button></td>
                  {r.days.map((h, i) => <td key={i} className={`px-1.5 py-1 text-right tabular-nums ${h ? "" : "text-(--d-muted)"}`}>{h ? h.toFixed(h % 1 ? 1 : 0) : "—"}</td>)}
                  <td className="px-2 py-1 text-right tabular-nums">{r.job.toFixed(1)}</td>
                  <td className="px-4 py-1 text-right font-semibold tabular-nums sm:px-5">{r.total.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12.5px] text-(--d-muted)">Today&apos;s hours appear as people clock out. Tap a name for the job-by-job breakdown.</p>
      </Card>

      <Card title="Crew hours, last 13 weeks">
        <ColumnChart title="Weekly crew hours" columns={weekly} series={[{ name: "On jobs", color: "var(--d-c1)" }, { name: "Shop, drive + estimates", color: "var(--d-c2)" }]} format={(n) => `${Math.round(n)} hr`} height={180} labelEvery={3} />
      </Card>

      {detail ? <WorkerWeek id={detail} monday={monday} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function WorkerWeek({ id, monday, onClose }: { id: string; monday: string; onClose: () => void }) {
  const { book, seed, job, open } = useShop();
  const w = seed.workers.find((x) => x.id === id)!;
  const r = weekHours(book, seed, monday).find((x) => x.w.id === id)!;
  const byJob = new Map<string, number>();
  for (const e of r.entries) byJob.set(e.job ?? "", (byJob.get(e.job ?? "") ?? 0) + e.hours);
  return (
    <Dialog open onClose={onClose} title={w.name} subtitle={`${w.role} · week of ${shortDate(monday)} · ${r.total.toFixed(1)} hr`}>
      <ul className="divide-y divide-(--d-line) text-[14px]">
        {[...byJob].sort((a, b) => b[1] - a[1]).map(([jid, h]) => (
          <li key={jid || "shop"} className="flex min-h-12 items-center justify-between gap-3 py-1.5">
            {jid ? <button type="button" onClick={() => open({ kind: "job", id: jid })} className="text-left font-semibold underline-offset-2 hover:underline">{job(jid).no} · {job(jid).title}</button> : <span className="text-(--d-muted)">Shop, drive + estimates</span>}
            <span className="tabular-nums">{h.toFixed(1)} hr</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12.5px] text-(--d-muted)">Cost rate ${w.cost}/hr · billed at ${w.rate}/hr on time-and-materials work.</p>
    </Dialog>
  );
}
