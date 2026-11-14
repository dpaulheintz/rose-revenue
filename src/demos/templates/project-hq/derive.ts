// Every number the Dashboard, Projects, Billing and Labor share comes from
// here, so the screens can't disagree.

import { addDays, diffDays, monthKey, type Ymd } from "@demos/kit/data/dates";
import { CATEGORIES, type ChangeOrder, type ProjData, type Project } from "./data";
import type { ProjectProspect } from "./types";

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (d: Ymd) => `${M[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;
export type Status = "On track" | "At risk" | "Over budget";
/** Pay apps are due in 45 days; older and unpaid is overdue. */
export const NET_DAYS = 45;

export type Live = { ball: Record<string, ChangeOrder["ball"]>; coStatus: Record<string, ChangeOrder["status"]>; sent: Record<string, true> };
export const emptyLive: Live = { ball: {}, coStatus: {}, sent: {} };

export function view(p: ProjectProspect, d: ProjData, st: Live) {
  const t = d.today;
  const changes = d.changes.map((c) => ({ ...c, status: st.coStatus[c.id] ?? c.status, ball: st.ball[c.id] ?? c.ball }));
  const approvedFor = (id: string) => changes.filter((c) => c.project === id && c.status === "Approved").reduce((s, c) => s + c.amount, 0);
  const hours = (id: string) => d.workers.filter((w) => w.project === id).reduce((s, w) => s + w.hours, 0);

  const projects = d.projects.map((pj) => {
    const revised = pj.contract + approvedFor(pj.id);
    const earned = revised * pj.pct;
    const cost = pj.budget * pj.pct * pj.costFactor;
    const projected = pj.budget * pj.costFactor;
    const status: Status = pj.costFactor > 1.08 ? "Over budget" : pj.costFactor > 1.03 ? "At risk" : "On track";
    const byCat = CATEGORIES.map((c) => ({ cat: c, budget: pj.budget * pj.split[c], actual: cost * pj.split[c] }));
    return {
      ...pj, revised, earned, cost, projected, status, retainage: pj.billed * pj.retainagePct, overUnder: pj.billed - earned, remaining: revised - pj.billed,
      margin: (revised - projected) / revised, hoursWeek: hours(pj.id), byCat, cos: changes.filter((c) => c.project === pj.id),
    };
  });
  const unpaid = d.payapps.filter((a) => !a.paid).map((a) => ({ ...a, age: diffDays(t, a.billed), project: projects.find((x) => x.id === a.project)! }));
  const overdue = unpaid.filter((a) => a.age > NET_DAYS);
  const month = monthKey(t);
  const collectedMonth = d.payapps.filter((a) => a.paid && monthKey(a.paid) === month);
  const nextPayDate = t.slice(8) <= "25" ? `${t.slice(0, 8)}25` : `${monthKey(addDays(t, 10))}-25`;
  const upcoming = projects.filter((x) => x.pct < 0.97).map((x) => ({ project: x, date: nextPayDate, amount: Math.round((x.revised * Math.min(0.12, Math.max(0.03, 1 / Math.max(1, diffDays(x.end, x.start) / 30)))) / 100) * 100 })).sort((a, b) => b.amount - a.amount);
  const pending = changes.filter((c) => c.status === "Pending").map((c) => ({ ...c, days: diffDays(t, c.submitted), project: projects.find((x) => x.id === c.project)! }));
  const laborHours = d.workers.reduce((s, w) => s + w.hours, 0);
  const shortWeeks = d.forecast.filter((w) => w.need > w.have);
  const renewing = d.agreements.filter((a) => diffDays(a.renews, t) <= 90).sort((a, b) => (a.renews < b.renews ? -1 : 1));

  const totals = {
    contract: projects.reduce((s, x) => s + x.revised, 0), billed: projects.reduce((s, x) => s + x.billed, 0), retainage: projects.reduce((s, x) => s + x.retainage, 0),
    collected: collectedMonth.reduce((s, a) => s + a.amount, 0), overdue: overdue.reduce((s, a) => s + a.amount, 0), pending: pending.reduce((s, c) => s + c.amount, 0),
    laborCost: laborHours * p.laborRate,
  };

  // One line per problem: the worst ones by name, the rest grouped with a count.
  const old = overdue.filter((a) => a.age > 60);
  const stuck = pending.filter((c) => c.days > 30 && c.ball !== "Us");
  const ours = pending.filter((c) => c.ball === "Us");
  const underBilled = projects.filter((x) => x.overUnder < -50000);
  const worstWeek = [...shortWeeks].sort((a, b) => b.need - b.have - (a.need - a.have))[0];
  const soon = renewing.filter((a) => diffDays(a.renews, t) <= 30);
  const sum = (xs: Array<{ amount: number }>) => xs.reduce((s, x) => s + x.amount, 0);
  const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
  const needs = [
    ...projects.filter((x) => x.status === "Over budget").map((x) => ({ key: `ob-${x.id}`, tone: "bad" as const, title: `${x.name} is over budget`, detail: `Projected cost ${pctText(x.costFactor - 1)} over. ${x.pm}`, kind: "project" as const, id: x.id })),
    ...(old.length ? [{ key: "od", tone: "bad" as const, count: old.length, title: `${old.length} ${old.length === 1 ? "pay app is" : "pay apps are"} more than 60 days old`, detail: `${moneyShort(sum(old))}, oldest ${Math.max(...old.map((a) => a.age))} days`, kind: "billing" as const, id: "od" }] : []),
    ...(stuck.length ? [{ key: "co", tone: "warn" as const, count: stuck.length, title: `${stuck.length} change orders waiting 30+ days on someone else`, detail: `${moneyShort(sum(stuck))} in limbo. Longest: ${Math.max(...stuck.map((c) => c.days))} days`, kind: "co" as const, id: "co" }] : []),
    ...(ours.length ? [{ key: "us", tone: "warn" as const, count: ours.length, title: `${ours.length} change ${ours.length === 1 ? "order needs" : "orders need"} our pricing`, detail: ours.map((c) => `${c.id}, ${c.project.name}`).join("; "), kind: "co" as const, id: "us" }] : []),
    ...(underBilled.length ? [{ key: "ub", tone: "warn" as const, count: underBilled.length, title: `${underBilled.length} jobs are under-billed`, detail: `About ${moneyShort(-underBilled.reduce((s, x) => s + x.overUnder, 0))} of finished work not billed yet`, kind: "billing" as const, id: "ub" }] : []),
    ...(worstWeek ? [{ key: "mw", tone: "warn" as const, title: `Short ${people(worstWeek.need - worstWeek.have)} the week of ${shortDay(worstWeek.week)}`, detail: shortWeeks.length > 1 ? `${shortWeeks.length} short weeks in the next six` : `Need ${worstWeek.need}, have ${worstWeek.have}`, kind: "labor" as const, id: "mw" }] : []),
    ...(soon.length ? [{ key: "sa", tone: "info" as const, count: soon.length, title: `${soon.length} service agreements renew in the next 30 days`, detail: `${moneyShort(soon.reduce((s, a) => s + a.annual, 0))} a year`, kind: "service" as const, id: "sa" }] : []),
  ];

  return { projects, changes, unpaid, overdue, collectedMonth, upcoming, nextPayDate, pending, laborHours, shortWeeks, renewing, totals, needs };
}
export type View = ReturnType<typeof view>;
export type VProject = View["projects"][number];
export const pctText = (n: number) => `${Math.round(n * 100)}%`;
export const moneyShort = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`);
export type { Project };
