// Every number two Shop HQ screens share comes from here, so they agree.

import { addDays, addMonths, diffDays, monthKey, monthIndex, weekday, type Ymd } from "@demos/kit/data/dates";
import type { ShopData, Job } from "./data";
import type { ShopProspect } from "./types";

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: Ymd) => `${M[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;
export const monthName = (ym: string) => M[+ym.slice(5, 7) - 1];
export const DUE_DAYS = 15;
export const nextWorkday = (d: Ymd) => { let x = addDays(d, 1); while (weekday(x) === 0) x = addDays(x, 1); return x; };
const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return (h < 7 ? h + 12 : h) * 60 + m; };

export type Live = { called: Record<string, true>; invoiced: Record<string, true>; booked: Record<string, true>; nudged: Record<string, true>; reminded: boolean };
export const emptyLive: Live = { called: {}, invoiced: {}, booked: {}, nudged: {}, reminded: false };

export function shop(p: ShopProspect, d: ShopData, st: Live) {
  const t = d.today;
  const jobs = d.jobs.map((j) => {
    let x = j;
    if (st.invoiced[j.id] && !j.invoice) x = { ...x, invoice: { id: `INV-${j.id.slice(2)}`, sent: t, amount: j.amount } };
    if (st.booked[j.id] && j.callback) x = { ...x, callback: { ...j.callback, scheduled: true } };
    return x;
  });
  const done = jobs.filter((j) => j.done);
  const svc = (j: Job) => p.services[j.service];

  /* today */
  const todays = jobs.filter((j) => j.date === t).sort((a, b) => clock(a.time) - clock(b.time));
  const crews = p.crew.map((c, i) => ({ c, i, jobs: todays.filter((j) => j.crew === i) })).filter((x) => x.jobs.length);
  const tomorrow = nextWorkday(t);
  const tomorrowJobs = jobs.filter((j) => j.date === tomorrow);
  const weekJobs = jobs.filter((j) => j.date >= d.monday && j.date < addDays(d.monday, 7));

  /* calls and leads */
  const leadsToday = d.leads.filter((l) => l.date === t);
  const afterHours = leadsToday.filter((l) => l.afterHours);
  const waiting = d.leads.filter((l) => l.status === "Waiting" && !st.called[l.id]).sort((a, b) => (a.date < b.date ? 1 : -1));
  const last30 = d.leads.filter((l) => diffDays(t, l.date) <= 30);
  const sources = p.leadSources.map((s) => ({ name: s.name, leads: last30.filter((l) => l.source === s.name) }));
  const daytime = d.leads.filter((l) => !l.afterHours && diffDays(t, l.date) <= 7);
  const speed = daytime.length ? Math.round(daytime.reduce((s, l) => s + l.responseMin, 0) / daytime.length) : 0;

  /* money */
  const unpaid = done.filter((j) => j.invoice && !j.invoice.paid);
  const age = (j: Job) => diffDays(t, j.invoice!.sent);
  const overdue = unpaid.filter((j) => age(j) > DUE_DAYS);
  const collected7 = done.filter((j) => j.invoice?.paid && diffDays(t, j.invoice.paid) < 7);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(monthKey(t), i - 11)).map((m) => {
    const js = done.filter((j) => monthKey(j.date) === m);
    return { month: m, jobs: js, hvac: js.filter((j) => svc(j).trade === "HVAC").reduce((s, j) => s + j.amount, 0), plumbing: js.filter((j) => svc(j).trade === "Plumbing").reduce((s, j) => s + j.amount, 0) };
  });

  /* needs you */
  const notInvoiced = done.filter((j) => !j.invoice);
  const staleEstimates = d.estimates.filter((e) => e.status === "Open" && diffDays(t, e.date) > 7 && !st.nudged[e.id]);
  const permits = d.permits.filter((x) => x.date >= t && diffDays(x.date, t) <= 14).sort((a, b) => (a.date < b.date ? -1 : 1));
  const callbacks = done.filter((j) => j.callback && !j.callback.scheduled);

  /* plans */
  const fall = monthIndex(t) >= 7; // furnace tune-ups from August, AC tune-ups from February
  const seasonStart = fall ? `${t.slice(0, 4)}-08-15` : `${t.slice(0, 4)}-02-15`;
  const tuneDue = d.members.filter((m) => { const last = fall ? m.lastFurnace : m.lastAc; return !last || last < seasonStart; });
  const renewals = d.members.filter((m) => monthKey(m.renews) === monthKey(t));
  const planRevenue = d.members.reduce((s, m) => s + p.plans[m.plan].price, 0);

  /* techs: revenue and tickets over 30 days, estimates over 90, jobs done this week */
  const techs = p.crew.map((c, i) => {
    const mine = done.filter((j) => j.crew === i && diffDays(t, j.date) <= 30);
    const est = d.estimates.filter((e) => e.crew === i && diffDays(t, e.date) <= 90 && e.status !== "Open");
    const won = est.filter((e) => e.status === "Won").length;
    return {
      c, i, jobs30: mine, revenue: mine.reduce((s, j) => s + j.amount, 0), avg: mine.length ? mine.reduce((s, j) => s + j.amount, 0) / mine.length : 0,
      estimates: est, close: est.length ? won / est.length : null, callbacks: done.filter((j) => j.crew === i && j.callback && diffDays(t, j.date) <= 90),
      week: weekJobs.filter((j) => j.crew === i && j.done),
    };
  });

  return { jobs, done, todays, crews, tomorrow, tomorrowJobs, weekJobs, leadsToday, afterHours, waiting, sources, speed, unpaid, overdue, age, collected7, months, notInvoiced, staleEstimates, permits, callbacks, fall, tuneDue, renewals, planRevenue, techs, svc };
}
export type Shop = ReturnType<typeof shop>;
