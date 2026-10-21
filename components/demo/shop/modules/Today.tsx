"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { addDays, weekday } from "@/lib/demo/dates";
import { dayDate } from "@/lib/demo/format";
import { aging, sum } from "@/lib/demo/shop/derive";
import { dayPlan, hhmm, needsAttention, type Attention, type Visit } from "@/lib/demo/shop/insights";
import { useDemo } from "../../DemoProvider";
import { PreparedBy } from "../../Brand";
import Icon from "../../Icon";
import { Card } from "../../ui";
import { CrewDot, usd } from "../bits";
import { useShop } from "../ShopProvider";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY0 = 7 * 60;
const DAY1 = 18 * 60;

/** Minutes since midnight, client-only (the server doesn't know the visitor's clock). */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export default function Today() {
  const { cfg, base } = useDemo();
  const { book, seed, rows, customer, open } = useShop();
  const t = book.anchor;
  const now = useNow();
  const greeting = now == null ? "Here's today" : now < 12 * 60 ? "Good morning" : now < 17 * 60 ? "Good afternoon" : "Good evening";

  const plan = useMemo(() => dayPlan(book, seed, t), [book, seed, t]);
  const tomorrow = useMemo(() => { let d = addDays(t, 1); while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1); return d; }, [t]);
  const planTomorrow = useMemo(() => dayPlan(book, seed, tomorrow), [book, seed, tomorrow]);
  const attention = useMemo(() => needsAttention(book, seed, rows, (id) => customer(id).name), [book, seed, rows, customer]);
  const weekAgo = addDays(t, -7);
  const collected = sum(book.payments.filter((p) => p.date > weekAgo && p.date <= t), (p) => p.amount);
  const open_ = rows.filter((r) => r.balance > 0 && r.status !== "Draft");
  const outstanding = sum(open_, (r) => r.balance);
  const overdue = sum(open_.filter((r) => r.status === "Overdue"), (r) => r.balance);
  const ages = aging(rows);
  const goTo = (a: Attention) => (a.go.kind === "module" ? undefined : () => open(a.go.kind === "invoice" ? { kind: "invoice", id: a.go.id } : a.go.kind === "job" ? { kind: "job", id: a.go.id } : { kind: "estimate", id: a.go.id }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold tracking-[0.14em] text-(--d-accent) uppercase">{DAYS[weekday(t)]}, {dayDate(t).slice(4)} · All jobs for all people</p>
          <h1 className="demo-display mt-1.5 text-[34px] leading-none sm:text-[44px]">{greeting}.</h1>
        </div>
        <ul className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Sample forecast">
          {book.weather.map((w) => (
            <li key={w.date} className="flex min-w-[70px] shrink-0 flex-col items-center rounded-[12px] border border-(--d-line) bg-(--d-panel) px-2.5 py-2 text-center">
              <span className="text-[12px] font-semibold text-(--d-muted)">{w.date === t ? "Today" : DAYS[weekday(w.date)].slice(0, 3)}</span>
              <Icon name={w.sky === "Sunny" || w.sky === "Partly cloudy" ? "sun" : w.sky === "Cloudy" ? "cloud" : "rain"} size={20} label={w.sky} className={w.rain >= 50 ? "text-(--d-info)" : "text-(--d-muted)"} />
              <span className="text-[13.5px] font-semibold">{w.hi}° <span className="font-normal text-(--d-muted)">{w.lo}°</span></span>
              <span className={`text-[11.5px] ${w.rain >= 50 ? "font-semibold text-(--d-info)" : "text-(--d-muted)"}`}>{w.rain}% rain</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Money first: it's what the owner checks in the truck. */}
      <Link href={`${base}/money`} className="demo-card grid grid-cols-3 gap-px overflow-hidden !p-0 hover:border-(--d-accent)" aria-label="Money snapshot, open Money">
        {[
          { label: "Collected, last 7 days", value: collected, tone: "text-(--d-good)" },
          { label: "Outstanding", value: outstanding, tone: "" },
          { label: "Overdue", value: overdue, tone: overdue > 0 ? "text-(--d-bad)" : "" },
        ].map((m) => (
          <div key={m.label} className="bg-(--d-panel) p-3.5 sm:p-5">
            <p className="text-[12px] font-semibold text-(--d-muted) sm:text-[13px]">{m.label}</p>
            <p className={`demo-display mt-1 text-[clamp(17px,5.2vw,32px)] leading-tight ${m.tone}`}>{usd(m.value)}</p>
          </div>
        ))}
        <div className="col-span-3 bg-(--d-panel) px-3.5 pb-3.5 sm:px-5 sm:pb-5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-(--d-panel2)" role="img" aria-label={ages.map((a) => `${a.label} days ${usd(a.amount)}`).join(", ")}>
            {ages.map((a, i) => <span key={a.label} style={{ width: `${(a.amount / Math.max(1, outstanding)) * 100}%`, background: ["var(--d-good)", "var(--d-warn)", "var(--d-c1)", "var(--d-bad)"][i] }} />)}
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-[12px] text-(--d-muted)">{ages.map((a) => <span key={a.label}>{a.label}d {usd(a.amount)}</span>)}</p>
        </div>
      </Link>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8" title="On site today" action={<Link href={`${base}/jobs`} className="inline-flex min-h-12 items-center gap-1 text-[14px] font-semibold text-(--d-accent)">Calendar <Icon name="arrow" size={16} /></Link>}>
          <DispatchBoard plan={plan} now={now} onOpen={(id) => open({ kind: "job", id })} />
          <AgendaList plan={plan} onOpen={(id) => open({ kind: "job", id })} />
          <p className="mt-4 text-[13px] text-(--d-muted)">
            Tomorrow ({dayDate(tomorrow)}): {seed.crews.map((c) => `${c.name.split(" ")[0]} ${planTomorrow.filter((v) => v.crew === c.id).length}`).join(" · ")} jobs
          </p>
        </Card>

        <Card className="xl:col-span-4" title="Needs you" action={<span className="text-[12.5px] text-(--d-muted)">{attention.length} items</span>}>
          <ul className="space-y-1">
            {attention.slice(0, 9).map((a) => {
              const inner = (
                <>
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${a.tone === "bad" ? "bg-(--d-bad)" : a.tone === "warn" ? "bg-(--d-warn)" : "bg-(--d-info)"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-semibold">{a.text}</span>
                    <span className="block text-[13px] text-(--d-muted)">{a.detail}</span>
                  </span>
                  <Icon name="arrow" size={16} className="mt-1 text-(--d-muted)" />
                </>
              );
              const cls = "-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-start gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-(--d-panel2)";
              return (
                <li key={a.id}>
                  {a.go.kind === "module" ? <Link href={`${base}/${a.go.id}`} className={cls}>{inner}</Link> : <button type="button" onClick={goTo(a)} className={cls}>{inner}</button>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <section aria-labelledby="close-h" className="overflow-hidden rounded-[14px] border border-(--d-line) bg-(--d-header) text-(--d-on-header)">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <PreparedBy className="opacity-80" />
            <h2 id="close-h" className="demo-display mt-3 text-[26px] leading-tight sm:text-[32px]">This is sample data. Yours would be the real thing.</h2>
            <div className="mt-4 max-w-[62ch] space-y-3 text-[15px] leading-relaxed opacity-90">
              <p>I built this so you could see what running {cfg.company.name} from one place could feel like: jobs, crews, estimates, invoices and the money, on the phone in your truck. Every name and number here is made up.</p>
              <p>The real version would connect to the tools you already use, built around how you actually work. You own the code and the data. It starts with a short look at how the business runs today, and we build only what saves you time.</p>
              <p className="font-semibold">— Paul Heintzman, Rose Revenue</p>
            </div>
          </div>
          <div className="rounded-[12px] bg-white/[0.06] p-5">
            <p className="text-[14px] opacity-90">Fifteen minutes, free. I&apos;ll tell you straight whether it&apos;s worth it for you.</p>
            <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ea8a45] px-5 text-[15px] font-bold text-[#17110b] hover:brightness-110">
              <Icon name="calendar" size={18} />
              Book a free 15-min call
              <span className="sr-only"> (opens Cal.com in a new tab)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Desktop: crews as lanes on a 7a–6p timeline, with a "now" line. */
function DispatchBoard({ plan, now, onOpen }: { plan: Visit[]; now: number | null; onOpen: (id: string) => void }) {
  const { seed, customer, place } = useShop();
  const pct = (m: number) => `${((Math.min(DAY1, Math.max(DAY0, m)) - DAY0) / (DAY1 - DAY0)) * 100}%`;
  const hours = Array.from({ length: (DAY1 - DAY0) / 60 + 1 }, (_, i) => DAY0 + i * 60);
  return (
    <div className="hidden md:block">
      <div className="relative ml-[150px] h-6 text-[11.5px] text-(--d-muted)" aria-hidden="true">
        {hours.map((h) => <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h) }}>{hhmm(h).replace(":00", "")}</span>)}
      </div>
      <div className="space-y-2">
        {seed.crews.map((c) => {
          const vs = plan.filter((v) => v.crew === c.id);
          const rowsN = c.id === "service" ? 1 : Math.max(1, vs.length);
          return (
            <section key={c.id} aria-label={`${c.name}: ${vs.length} jobs`} className="flex items-stretch gap-0 rounded-[12px] bg-(--d-panel2)">
              <div className="w-[150px] shrink-0 px-3 py-3">
                <p className="flex items-center gap-2 text-[14px] font-semibold"><CrewDot crew={c.id} />{c.name}</p>
                <p className="text-[12px] text-(--d-muted)">{seed.workers.filter((w) => w.crew === c.id).map((w) => w.name.split(" ")[0]).join(", ")}</p>
              </div>
              <div className="relative flex-1 border-l border-(--d-line)" style={{ minHeight: rowsN * 62 + 12 }}>
                {hours.slice(1, -1).map((h) => <span key={h} className="absolute inset-y-0 w-px bg-(--d-line)/60" style={{ left: pct(h) }} aria-hidden="true" />)}
                {vs.map((v, i) => {
                  const cu = customer(v.job.customer);
                  const where = place(v.job);
                  const who = cu.kind === "Homeowner" ? cu.name.split(" ").at(-1) : cu.name;
                  const narrow = v.hours <= 2;
                  return (
                    <button
                      key={v.job.id}
                      type="button"
                      title={`${hhmm(v.start)} · ${v.job.title} · ${cu.name}, ${where.town}`}
                      onClick={() => onOpen(v.job.id)}
                      className="absolute overflow-hidden rounded-[8px] border-l-4 bg-(--d-panel) px-2.5 py-1.5 text-left text-[12.5px] leading-tight shadow-sm hover:brightness-110"
                      style={{ left: pct(v.start), width: `calc(${pct(v.start + v.hours * 60)} - ${pct(v.start)} - 4px)`, top: 6 + (c.id === "service" ? 0 : i) * 62, height: 56, borderColor: c.color }}
                    >
                      <span className="block truncate font-semibold">{narrow ? hhmm(v.start) : `${hhmm(v.start)} · ${v.job.title}`}</span>
                      <span className="block truncate text-(--d-muted)">{narrow ? who : `${who} · ${where.town}`}</span>
                    </button>
                  );
                })}
                {!vs.length ? <p className="absolute inset-0 grid place-items-center text-[13px] text-(--d-muted)">Shop day: estimates + maintenance</p> : null}
                {now != null && now > DAY0 && now < DAY1 ? <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-(--d-accent)" style={{ left: pct(now) }} aria-hidden="true" /> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Phone: the same day as a time-railed agenda, grouped by crew. */
function AgendaList({ plan, onOpen }: { plan: Visit[]; onOpen: (id: string) => void }) {
  const { seed, customer, place } = useShop();
  return (
    <div className="space-y-4 md:hidden">
      {seed.crews.map((c) => {
        const vs = plan.filter((v) => v.crew === c.id);
        return (
          <section key={c.id} aria-label={c.name}>
            <h3 className="mb-1.5 flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-(--d-muted) uppercase"><CrewDot crew={c.id} />{c.name}</h3>
            <ol className="relative space-y-2 border-l-2 pl-4" style={{ borderColor: c.color }}>
              {vs.map((v) => {
                const cu = customer(v.job.customer);
                const where = place(v.job);
                return (
                  <li key={v.job.id}>
                    <button type="button" onClick={() => onOpen(v.job.id)} className="flex min-h-16 w-full items-start gap-3 rounded-[12px] bg-(--d-panel2) px-3 py-2.5 text-left">
                      <span className="w-12 shrink-0 text-[13px] font-bold tabular-nums">{hhmm(v.start)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug">{v.job.title}</span>
                        <span className="block truncate text-[13px] text-(--d-muted)">{cu.name} · {where.address}, {where.town}</span>
                      </span>
                      <Icon name="arrow" size={16} className="mt-1 text-(--d-muted)" />
                    </button>
                  </li>
                );
              })}
              {!vs.length ? <li className="text-[13.5px] text-(--d-muted)">Shop day: estimates + maintenance.</li> : null}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
