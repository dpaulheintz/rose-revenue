// "Needs attention": the computed to-do list on the Overview. Every item is
// derived from the dataset (nothing hand-written), with a link to where it
// gets handled.

import { diffDays } from "../dates";
import { moneyK, num, shortDate } from "../format";
import { fmtDays, inventoryRows, nextRestock, type CustomerStats, type rotationState } from "./derive";
import type { FarmData, FarmSeed } from "./types";

export type Attention = { id: string; tone: "bad" | "warn" | "info"; text: string; detail: string; module: string; rank: number };

export function needsAttention(
  ds: FarmData,
  seed: FarmSeed,
  rotation: ReturnType<typeof rotationState>,
  stats: Map<string, CustomerStats>,
  serviced: Record<string, string> = {},
): Attention[] {
  const out: Attention[] = [];
  const t = ds.anchor;

  // Sold out with people waiting.
  const inv = inventoryRows(ds, seed);
  for (const r of inv.filter((x) => x.status === "Out" && x.waitlist > 0).sort((a, b) => b.waitlist - a.waitlist).slice(0, 3)) {
    const next = nextRestock(ds, r.s);
    out.push({
      id: `out-${r.s.id}`, tone: "bad", module: "inventory", rank: 90 + r.waitlist,
      text: `${r.s.name} sold out, ${r.waitlist} customer${r.waitlist === 1 ? "" : "s"} waiting`,
      detail: next ? `Restocks ${fmtDays(diffDays(next.date, t))}: ${next.from}${next.qty ? `, +${num(next.qty)}` : ""}.` : "No restock scheduled.",
    });
  }
  const low = inv.filter((x) => x.status === "Low");
  if (low.length) out.push({ id: "low", tone: "warn", module: "inventory", rank: 60, text: `${low.length} products running low`, detail: low.slice(0, 3).map((x) => x.s.name).join(", ") + (low.length > 3 ? "…" : "") });

  // Herd health + movement.
  for (const c of ds.cows.filter((x) => x.dip)) {
    const drop = c.avgPrev ? 1 - c.avg7 / c.avgPrev : 0;
    out.push({ id: `dip-${c.id}`, tone: "bad", module: "herd", rank: 95, text: `${c.name} (#${c.tag}) milk down ${Math.round(drop * 100)}% this week`, detail: `Check udder + temp; call ${seed.vet.name.split(",")[0]} if it holds.` });
  }
  const leaveIn = diffDays(rotation.leaving, t);
  out.push({ id: "move", tone: "info", module: "herd", rank: leaveIn <= 1 ? 70 : 30, text: `Herd moves to ${rotation.next.name} ${fmtDays(leaveIn)}`, detail: `${rotation.next.height.toFixed(1)}″ of forage after ${rotation.next.rest} days of rest.` });
  const due = ds.cows.filter((c) => diffDays(c.nextDue, t) >= 0 && diffDays(c.nextDue, t) <= 14);
  if (due.length) out.push({ id: "calving", tone: "warn", module: "herd", rank: 65, text: `${due.length} cow${due.length === 1 ? "" : "s"} due to calve in the next 2 weeks`, detail: due.map((c) => `${c.name} ${shortDate(c.nextDue)}`).join(", ") });
  const frost = ds.weather.find((w) => w.date >= t && w.lo <= 34);
  if (frost) out.push({ id: "frost", tone: "warn", module: "poultry", rank: 55, text: `Frost possible ${fmtDays(diffDays(frost.date, t))} (low ${frost.lo}°)`, detail: "Check waterers on the eggmobiles and broiler shelters." });

  // Processing + poultry.
  const beef = ds.batches.find((b) => b.kind === "beef" && b.kill >= t);
  if (beef && diffDays(beef.kill, t) <= 10) out.push({ id: "beef", tone: "info", module: "herd", rank: 50, text: `${beef.head} steers to ${seed.processor.name} ${fmtDays(diffDays(beef.kill, t))}`, detail: `Back in the freezer ${shortDate(beef.back)} as lot ${beef.lot}.` });
  const br = ds.broilers.find((b) => b.processing >= t && b.arrived <= t);
  if (br && diffDays(br.processing, t) <= 21) out.push({ id: "broiler", tone: "info", module: "poultry", rank: 45, text: `Broiler batch ${br.no} processes ${fmtDays(diffDays(br.processing, t))}`, detail: `${num(br.alive)} birds on pasture, ~${br.avgLb} lb each.` });
  const tk = ds.turkeys;
  if (tk.preorders.length && diffDays(tk.processing, t) > 0 && diffDays(tk.processing, t) < 75) {
    const left = tk.allocation - tk.preorders.length;
    out.push({ id: "turkeys", tone: left < 15 ? "warn" : "info", module: "poultry", rank: 40, text: `${tk.preorders.length} of ${tk.allocation} turkeys spoken for`, detail: `${left} left; pickup the weekend of ${shortDate(tk.processing)}.` });
  }

  // Equipment.
  for (const e of ds.equipment) {
    if (serviced[e.id]) continue;
    const late = diffDays(t, e.nextDue);
    if (late > 0) out.push({ id: `eq-${e.id}`, tone: "bad", module: "maintenance", rank: 75 + late, text: `${e.name} service ${late} day${late === 1 ? "" : "s"} overdue`, detail: e.task + "." });
  }

  // Herdshare paperwork + customers.
  const owners = ds.customers.filter((c) => c.herdshare && !c.stoppedOn);
  const missing = owners.filter((c) => !c.herdshare!.agreement).length;
  if (missing) out.push({ id: "agree", tone: "warn", module: "customers", rank: 68, text: `${missing} herdshare agreement${missing === 1 ? "" : "s"} not on file`, detail: "Owners can't pick up milk without one." });
  const pastDue = owners.filter((c) => c.herdshare!.fee === "Past due").length;
  if (pastDue) out.push({ id: "fees", tone: "warn", module: "customers", rank: 58, text: `${pastDue} boarding fee${pastDue === 1 ? "" : "s"} past due`, detail: "Invoices are in QuickBooks." });
  const renew = owners.filter((c) => diffDays(c.herdshare!.renews, t) >= -12 && diffDays(c.herdshare!.renews, t) <= 30).length;
  if (renew) out.push({ id: "renew", tone: "info", module: "customers", rank: 35, text: `${renew} herdshare renewals in the next 30 days`, detail: "Reminder emails go out through Drip." });
  const lapsed = [...stats.values()].filter((s) => s.segments.includes("Lapsed 30+") && s.ltv > 1500 && s.last && diffDays(t, s.last) <= 120);
  if (lapsed.length) out.push({ id: "lapsed", tone: "info", module: "customers", rank: 32, text: `${lapsed.length} good customers haven't ordered in 30+ days`, detail: `${moneyK(lapsed.reduce((s, x) => s + x.ltv, 0))} in lifetime spend between them.` });

  const test = ds.tests.at(-1);
  if (test && diffDays(t, test.week) >= 7) out.push({ id: "test", tone: "info", module: "production", rank: 20, text: "Weekly milk sample due", detail: `Last result ${shortDate(test.week)}: passed.` });
  return out.sort((a, b) => b.rank - a.rank);
}
