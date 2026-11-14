"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { BarList } from "@demos/kit/ui/charts";
import { shortDay } from "../derive";
import { Grid, H, moneyM, Panel, Title } from "../parts/bits";
import { useProjects } from "../parts/Provider";

export default function Labor() {
  const { p, d, v, openProject } = useProjects();
  const busy = v.projects.filter((x) => x.hoursWeek).sort((a, b) => b.hoursWeek - a.hoursWeek);
  const max = Math.max(...d.forecast.map((w) => Math.max(w.need, w.have)));
  const workersOf = (pid: string) => d.workers.filter((w) => w.project === pid);
  return (
    <div className="space-y-5">
      <Title sub={`${d.workers.length} people on ${p.crews.length} crews. Hours this week, who's where, and the next six weeks.`}>Labor &amp; Manpower</Title>
      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Hours this week" value={v.laborHours.toLocaleString("en-US")} sub={moneyM(v.totals.laborCost)} list={() => <DrillList>{busy.map((x) => <DrillRow key={x.id} title={x.name} detail={`${workersOf(x.id).length} people`} right={`${x.hoursWeek} hr`} onClick={() => openProject(x.id)} />)}</DrillList>} />
        <DrillStat label="People in the field" value={d.workers.filter((w) => w.project).length} sub={`${d.workers.length} total`} list={() => <DrillList>{d.workers.map((w) => <DrillRow key={w.id} title={w.name} detail={`${p.crews[w.crew].name}${w.project ? `, ${v.projects.find((x) => x.id === w.project)!.name}` : ", service calls"}`} right={`${w.hours} hr`} />)}</DrillList>} />
        <DrillStat label="Short weeks ahead" value={v.shortWeeks.length} tone={v.shortWeeks.length ? "bad" : "good"} sub="Next 6 weeks" list={() => <DrillList>{v.shortWeeks.map((w) => <DrillRow key={w.week} title={`Week of ${shortDay(w.week)}`} detail={`Need ${w.need}, have ${w.have}`} right={`Short ${w.need - w.have}`} />)}</DrillList>} />
        <DrillStat label="Crews" value={p.crews.length} list={() => <DrillList>{p.crews.map((c, i) => <DrillRow key={c.name} title={c.name} detail={`${d.workers.filter((w) => w.crew === i && w.project).length} on projects`} right={`${c.size} people`} />)}</DrillList>} />
      </Grid>

      <Panel title="6-week manpower forecast" note="Need comes from each job's schedule. Have is your crew minus time off.">
        <ul className="space-y-3">
          {d.forecast.map((w) => {
            const short = w.need > w.have;
            return (
              <li key={w.week} className={`rounded-[10px] p-2.5 ${short ? "bg-[color-mix(in_oklab,var(--d-bad)_8%,white)]" : ""}`}>
                <p className="mb-1.5 flex justify-between gap-3 text-[15px]"><span className="font-semibold">Week of {shortDay(w.week)}</span><span className={short ? "font-bold text-(--d-bad)" : "text-(--d-muted)"}>{short ? `Short ${w.need - w.have}` : `${w.have - w.need} spare`}</span></p>
                <p className="flex items-center gap-2 text-[13.5px]"><span className="w-10 text-(--d-muted)">Need</span><span className="h-3 rounded-full" style={{ width: `${(w.need / max) * 80}%`, background: short ? "var(--d-bad)" : "var(--d-accent)" }} /><span className="tabular-nums">{w.need}</span></p>
                <p className="mt-1 flex items-center gap-2 text-[13.5px]"><span className="w-10 text-(--d-muted)">Have</span><span className="h-3 rounded-full bg-[#9aa5ad]" style={{ width: `${(w.have / max) * 80}%` }} /><span className="tabular-nums">{w.have}</span></p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <Panel title="Hours by job, this week">
          <BarList rows={busy.map((x) => ({ key: x.id, label: x.name, value: x.hoursWeek, sub: `${workersOf(x.id).length} people` }))} format={(n) => `${n} hr`} />
        </Panel>
        <section>
          <H>Crews by project</H>
          <ul className="space-y-2.5">
            {busy.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => openProject(x.id)} className="block min-h-12 w-full rounded-[12px] border border-(--d-line) bg-(--d-panel) p-3.5 text-left hover:border-(--d-accent)">
                  <span className="block text-[16px] font-bold">{x.name}</span>
                  <span className="block text-[14.5px] text-(--d-muted)">{x.crews.map((c) => `${p.crews[c].name} (${workersOf(x.id).filter((w) => w.crew === c).length})`).join(", ")}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
