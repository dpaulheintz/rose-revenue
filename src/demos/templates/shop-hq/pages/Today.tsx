"use client";

import { DrillList, DrillRow, DrillStat } from "@demos/kit/blocks/DrillStat";
import { dayDate } from "@demos/kit/data/format";
import { RoseNote } from "@demos/kit/shell/ProspectShell";
import type { Job } from "../data";
import { shortDay } from "../derive";
import { Chip, Grid, H, money, Title } from "../parts/bits";
import { useShop } from "../parts/Provider";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function JobRows({ jobs }: { jobs: Job[] }) {
  const { p } = useShop();
  return (
    <DrillList>
      {jobs.map((j) => <DrillRow key={j.id} title={`${p.services[j.service].name}, ${j.customer.name}`} detail={`${shortDay(j.date)} ${j.time}, ${j.customer.town}. ${p.crew[j.crew].name}`} right={money(j.amount)} />)}
    </DrillList>
  );
}

export default function Today() {
  const { p, d, s } = useShop();
  const revenueToday = s.todays.reduce((t, j) => t + j.amount, 0);
  return (
    <div className="space-y-6">
      <Title sub={`${dayDate(d.today)}. ${s.todays.length} jobs on the board today.`}>Today</Title>

      <ul className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0" aria-label="Weather, next five days">
        {d.weather.map((w, i) => (
          <li key={w.date} className="min-w-[96px] shrink-0 rounded-[14px] border border-(--d-line) bg-(--d-panel) p-3 text-center">
            <p className="text-[14px] font-semibold">{i ? DAYS[new Date(w.date).getUTCDay()] : "Today"}</p>
            <p className="demo-display text-[24px] leading-tight">{w.hi}°<span className="text-[16px] text-(--d-muted)"> {w.lo}°</span></p>
            <p className="text-[13.5px] text-(--d-muted)">{w.sky}</p>
          </li>
        ))}
      </ul>

      <Grid cols="lg:grid-cols-4">
        <DrillStat label="Jobs today" value={s.todays.length} sub={`${money(revenueToday)} booked`} list={() => <JobRows jobs={s.todays} />} />
        <DrillStat label="Tomorrow" value={s.tomorrowJobs.length} sub={`${dayDate(s.tomorrow)}`} title={`Tomorrow, ${dayDate(s.tomorrow)}`} list={() => <JobRows jobs={s.tomorrowJobs} />} />
        <DrillStat label="This week" value={s.weekJobs.length} sub={`${s.weekJobs.filter((j) => j.done).length} done so far`} list={() => <JobRows jobs={s.weekJobs} />} />
        <DrillStat label="Crews out" value={s.crews.length} sub={`of ${p.crew.length}`} list={() => <DrillList>{s.crews.map((c) => <DrillRow key={c.i} title={c.c.name} detail={c.c.role} right={`${c.jobs.length} jobs`} />)}</DrillList>} />
      </Grid>

      <section>
        <H>Crews today</H>
        <ul className="grid gap-3 *:min-w-0 md:grid-cols-2">
          {s.crews.map(({ c, i, jobs }) => (
            <li key={i} className="rounded-[14px] border border-(--d-line) bg-(--d-panel) p-4">
              <p className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-[17px] font-bold">{c.name}</span><span className="text-[14.5px] text-(--d-muted)">{c.role}</span></span><Chip tone={c.install ? "info" : "neutral"}>{c.install ? "Install" : c.trade}</Chip></p>
              <ol className="mt-2 divide-y divide-(--d-line)">
                {jobs.map((j) => (
                  <li key={j.id} className="flex gap-3 py-2 text-[15.5px]">
                    <span className="w-12 shrink-0 font-semibold">{j.time}</span>
                    <span className="min-w-0"><span className="block font-semibold">{p.services[j.service].name}</span><span className="block text-[14.5px] text-(--d-muted)">{j.customer.name}, {j.customer.town}</span></span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
          {!s.crews.length ? <li className="rounded-[14px] border border-dashed border-(--d-line) p-5 text-center text-(--d-muted)">No crews out today. {s.tomorrowJobs.length} jobs {dayDate(s.tomorrow)}.</li> : null}
        </ul>
      </section>

      <RoseNote connects={p.connects} />
    </div>
  );
}
