"use client";

import { useMemo, useState } from "react";
import { addDays } from "@demos/kit/data/dates";
import { dayDate } from "@demos/kit/data/format";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button } from "@demos/kit/ui/ui";
import { ACCOUNT_TYPES, BRANDS, type AccountType } from "@demos/simpletimes/catalog";
import { accountStats, inBrand, shortDay } from "@demos/simpletimes/derive";
import { BrandChips, Chip, H, RowCard, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

type Filters = { types: AccountType[]; cross: boolean; due: boolean; mine: boolean };
const NONE: Filters = { types: [], cross: false, due: false, mine: false };

export default function Accounts() {
  const { d, w, brand, open, account } = useSt();
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filters>(NONE);
  const [sheet, setSheet] = useState(false);
  const [routeOpen, setRouteOpen] = useState(true);
  const [limit, setLimit] = useState(25);
  const rows = useMemo(() => w.accounts.map((a) => ({ a, s: accountStats(d, w, a) })), [d, w]);
  const needle = q.trim().toLowerCase();
  const shown = rows
    .filter(({ a, s }) => inBrand(brand, a.brands) && (!needle || `${a.name} ${a.town} ${a.type} ${a.contacts.map((c) => c.name).join(" ")}`.toLowerCase().includes(needle))
      && (!f.types.length || f.types.includes(a.type)) && (!f.cross || s.crossSell) && (!f.due || s.dueSoon) && (!f.mine || a.rep === "you"))
    .sort((x, y) => Number(y.s.dueSoon) - Number(x.s.dueSoon) || y.s.revenue12 - x.s.revenue12);
  const active = f.types.length + Number(f.cross) + Number(f.due) + Number(f.mine);
  const days = [...new Set(d.route.map((r) => r.date))];

  return (
    <div className="space-y-5">
      <Title sub={`${w.accounts.length} accounts. ${rows.filter((r) => r.s.crossSell).length} could carry both brands.`}>Accounts</Title>

      <section className="rounded-[12px] border border-(--d-line) bg-(--d-panel)">
        <button type="button" onClick={() => setRouteOpen((o) => !o)} aria-expanded={routeOpen} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left">
          <span className="demo-display text-[22px]">My route this week</span>
          <span className="flex items-center gap-2 text-[14px] text-(--d-muted)">{d.route.length} stops<Icon name="arrow" size={16} className={routeOpen ? "rotate-90" : ""} /></span>
        </button>
        {routeOpen ? (
          <ol className="space-y-3 px-4 pb-4">
            {days.map((day) => (
              <li key={day}>
                <p className={`mb-1 text-[14px] font-semibold ${day === d.today ? "text-(--d-accent)" : day < d.today ? "text-(--d-muted)" : ""}`}>{day === d.today ? "Today" : dayDate(day)}</p>
                <ul className="divide-y divide-(--d-line) rounded-[10px] border border-(--d-line)">
                  {d.route.filter((r) => r.date === day).map((r) => (
                    <li key={r.account + r.time}>
                      <button type="button" onClick={() => open({ kind: "account", id: r.account })} className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left ${day < d.today ? "opacity-60" : ""}`}>
                        <span className="w-11 shrink-0 text-[14px] text-(--d-muted)">{r.time}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold">{account(r.account).name}</span><span className="block text-[13.5px] text-(--d-muted)">{r.why}</span></span>
                        {day < d.today ? <Icon name="check" size={18} className="text-(--d-good)" /> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <div className="flex items-end gap-2">
        <SearchBar className="min-w-0 flex-1" label="Search accounts" placeholder="Name, town or contact" value={q} onChange={(v) => { setQ(v); setLimit(25); }} />
        <Button onClick={() => setSheet(true)} aria-label={`Filters${active ? `, ${active} on` : ""}`}><Icon name="filter" size={18} /><span>Filters</span>{active ? <span className="rounded-full bg-(--d-accent) px-1.5 text-[12.5px] text-white">{active}</span> : null}</Button>
      </div>

      <section>
        <H>{shown.length} {shown.length === 1 ? "account" : "accounts"}</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {shown.slice(0, limit).map(({ a, s }) => (
            <li key={a.id}>
              <RowCard
                title={a.name}
                meta={`${a.type}, ${a.town}. Last order ${s.last ? shortDay(s.last.date) : "none"}`}
                right={s.overdue ? <Chip tone="bad">Reorder late</Chip> : s.dueSoon ? <Chip tone="warn">Due {shortDay(s.due)}</Chip> : null}
                foot={<BrandChips brands={a.brands} missing={s.crossSell} />}
                onClick={() => open({ kind: "account", id: a.id })}
              />
            </li>
          ))}
        </ul>
        {shown.length > limit ? <div className="mt-3 flex justify-center"><Button onClick={() => setLimit((l) => l + 25)}>Show more</Button></div> : null}
        {!shown.length ? <p className="rounded-[12px] border border-dashed border-(--d-line) p-6 text-center text-(--d-muted)">No accounts match. Clear a filter or shorten the search.</p> : null}
      </section>

      <Dialog open={sheet} sheet onClose={() => setSheet(false)} title="Filter accounts" footer={<><Button variant="ghost" onClick={() => setF(NONE)}>Clear</Button><Button variant="primary" onClick={() => setSheet(false)}>Show {shown.length}</Button></>}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[15px] font-semibold">Type</p>
            <div className="flex flex-wrap gap-2">{ACCOUNT_TYPES.map(({ type }) => { const on = f.types.includes(type); return <button key={type} type="button" aria-pressed={on} onClick={() => setF((x) => ({ ...x, types: on ? x.types.filter((t) => t !== type) : [...x.types, type] }))} className={`min-h-12 rounded-full border px-4 text-[15px] ${on ? "border-(--d-accent) bg-(--d-accent) font-semibold text-white" : "border-(--d-line)"}`}>{type}</button>; })}</div>
          </div>
          {([["cross", `Cross-sell openings (missing ${BRANDS.mixers.name} or ${BRANDS.syrup.name})`], ["due", "Reorder due in the next week"], ["mine", "My accounts only"]] as const).map(([k, label]) => (
            <label key={k} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px]"><input type="checkbox" className="size-6 accent-(--d-accent)" checked={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.checked }))} />{label}</label>
          ))}
          <p className="text-[14px] text-(--d-muted)">The brand chips at the top filter too. Last order data covers {dayDate(addDays(d.today, -364))} to today.</p>
        </div>
      </Dialog>
    </div>
  );
}
