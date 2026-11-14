"use client";

import { ColumnChart } from "@demos/kit/ui/charts";
import Dialog from "@demos/kit/ui/Dialog";
import { Button } from "@demos/kit/ui/ui";
import { pctText, shortDay } from "../derive";
import { Chip, money, moneyM, Progress, STATUS_TONE } from "./bits";
import { useProjects } from "./Provider";

const Fact = ({ k, v, tone }: { k: string; v: React.ReactNode; tone?: "bad" | "good" }) => (
  <div className="min-w-0 rounded-[10px] bg-(--d-panel2) p-2.5"><dt className="text-[13.5px] text-(--d-muted)">{k}</dt><dd className={`text-[17px] font-bold tabular-nums ${tone === "bad" ? "text-(--d-bad)" : tone === "good" ? "text-(--d-good)" : ""}`}>{v}</dd></div>
);

/** One project: contract, cost, billing, job cost by category, change orders, crews. */
export default function ProjectSheet({ id }: { id: string }) {
  const { p, d, v, openProject, notify } = useProjects();
  const x = v.projects.find((y) => y.id === id)!;
  const crews = x.crews.map((c) => ({ name: p.crews[c].name, n: d.workers.filter((w) => w.crew === c && w.project === x.id).length }));
  return (
    <Dialog open sheet onClose={() => openProject(null)} title={x.name} subtitle={<span className="flex flex-wrap items-center gap-2"><Chip tone={STATUS_TONE[x.status]}>{x.status}</Chip>{x.type}. {x.pm}, PM. GC: {x.gc}</span>}
      footer={<><Button onClick={() => notify("Cost report exported for the job meeting (demo).")}>Export cost report</Button><Button variant="primary" onClick={() => notify(`Note sent to ${x.pm} (demo).`)}>Message the PM</Button></>}>
      <div className="mb-4"><Progress pct={x.pct} /><p className="mt-1 text-[14px] text-(--d-muted)">Started {shortDay(x.start)}, finishes about {shortDay(x.end)}</p></div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Fact k="Contract, with approved COs" v={moneyM(x.revised)} />
        <Fact k="Budget" v={moneyM(x.budget)} />
        <Fact k="Cost to date" v={moneyM(x.cost)} />
        <Fact k="Projected cost" v={moneyM(x.projected)} tone={x.projected > x.budget * 1.03 ? "bad" : undefined} />
        <Fact k="Projected margin" v={pctText(x.margin)} tone={x.margin < 0.05 ? "bad" : "good"} />
        <Fact k="Billed to date" v={moneyM(x.billed)} />
        <Fact k={x.overUnder >= 0 ? "Over-billed" : "Under-billed"} v={moneyM(Math.abs(x.overUnder))} tone={x.overUnder < -50000 ? "bad" : undefined} />
        <Fact k="Retainage held" v={moneyM(x.retainage)} />
        <Fact k="Labor hours this week" v={x.hoursWeek.toLocaleString("en-US")} />
      </dl>
      <section className="mt-5">
        <h3 className="demo-display mb-2 text-[18px]">Job cost: budget vs. actual to date</h3>
        <ColumnChart title="Job cost by category" height={150} mode="group" format={moneyM} series={[{ name: "Budget to date", color: "#9aa5ad" }, { name: "Actual", color: "var(--d-accent)" }]} columns={x.byCat.map((c) => ({ label: c.cat, values: [Math.round(c.budget * x.pct), Math.round(c.actual)] }))} />
        <ul className="mt-3 divide-y divide-(--d-line) text-[15px]">
          {x.byCat.map((c) => { const over = c.actual - c.budget * x.pct; return <li key={c.cat} className="flex justify-between gap-3 py-1.5"><span>{c.cat}</span><span className="tabular-nums"><span className="font-semibold">{money(c.actual)}</span> <span className={over > 0 ? "text-(--d-bad)" : "text-(--d-muted)"}>({over > 0 ? "+" : ""}{moneyM(over)})</span></span></li>; })}
        </ul>
      </section>
      <section className="mt-5">
        <h3 className="demo-display mb-2 text-[18px]">Change orders ({x.cos.length})</h3>
        <ul className="divide-y divide-(--d-line) text-[15px]">
          {x.cos.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0"><span className="block font-semibold">{c.id}: {c.scope}</span><span className="text-[14px] text-(--d-muted)">Submitted {shortDay(c.submitted)}{c.status === "Pending" ? `, waiting on ${c.ball === "Us" ? "us" : c.ball === "GC" ? "the GC" : `the ${c.ball.toLowerCase()}`}` : ""}</span></span><span className="shrink-0 text-right"><span className="block font-semibold tabular-nums">{money(c.amount)}</span><Chip tone={c.status === "Approved" ? "good" : c.status === "Rejected" ? "bad" : "warn"}>{c.status}</Chip></span></li>)}
          {!x.cos.length ? <li className="py-2 text-(--d-muted)">None yet.</li> : null}
        </ul>
      </section>
      <section className="mt-5">
        <h3 className="demo-display mb-2 text-[18px]">Crews on site this week</h3>
        <p className="text-[15px]">{crews.length ? crews.map((c) => `${c.name} (${c.n})`).join(", ") : "None this week."}</p>
      </section>
    </Dialog>
  );
}
