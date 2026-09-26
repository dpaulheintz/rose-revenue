"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { animateCover, prefersReducedMotion, setCover } from "@/lib/dither";

// Everything in here is an illustration with obviously generic, made-up data.

const MODULES = [
  {
    id: "revenue",
    name: "Revenue",
    line: "Your money, your way. I pull it out of the payment processor you hate and show you what matters.",
  },
  {
    id: "customers",
    name: "Customers",
    line: "Every customer and every conversation in one place, set up the way you actually sell.",
  },
  {
    id: "logs",
    name: "Logs",
    line: "What happened, when, and who did it. No more digging through texts.",
  },
  {
    id: "projects",
    name: "Projects",
    line: "Every job from start to done, where the whole team can see it.",
  },
  {
    id: "scorecard",
    name: "Scorecard",
    line: "The handful of numbers that matter each week, and meetings that stick to them.",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    line: "Everything your company knows, in one place your team can use.",
  },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

/* ---------------------------- small UI atoms ---------------------------- */

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg bg-paper/[0.05] p-3 ${className}`}>{children}</div>
);

const Label = ({ children }: { children: ReactNode }) => (
  <span className="block font-mono text-[11px] text-muted">{children}</span>
);

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-paper/20 px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-muted">
    {children}
  </span>
);

/* ------------------------------- panels -------------------------------- */

const BARS = [40, 52, 47, 61, 57, 70, 64, 74, 69, 81, 76, 90];

function Revenue() {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Card>
          <Label>This week</Label>
          <span className="mt-1 block font-display text-[28px] leading-none text-paper">$18,420</span>
          <span className="mt-1 block font-mono text-[11px] text-(--app-accent-text)">▲ 12% vs last week</span>
        </Card>
        <Card>
          <Label>Paid this month</Label>
          <span className="mt-1 block font-display text-[28px] leading-none text-paper">$61,380</span>
        </Card>
        <Card>
          <Label>Open invoices</Label>
          <span className="mt-1 block font-display text-[28px] leading-none text-paper">7</span>
        </Card>
        <Card>
          <Label>Average job</Label>
          <span className="mt-1 block font-display text-[28px] leading-none text-paper">$1,240</span>
        </Card>
      </div>
      <Card className="flex h-28 items-end gap-1.5 sm:h-32">
        {BARS.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: i === BARS.length - 1 ? "var(--app-accent)" : "rgb(242 228 221 / 0.16)",
            }}
          />
        ))}
      </Card>
      <p className="font-mono text-[11px] text-muted">Pulled from your payment processor · 6:00 am</p>
    </div>
  );
}

function Customers() {
  const rows = [
    ["Dana R.", "Last job Tue · $2,400", "Paid"],
    ["Luis M.", "Quote sent Friday", "Follow up"],
    ["Priya S.", "New this week", "New"],
    ["Walt K.", "Last job 3 weeks ago", "Check in"],
    ["June A.", "Repeat customer · 6 jobs", "Paid"],
  ];
  return (
    <ul className="divide-y divide-paper/10 rounded-lg bg-paper/[0.05]">
      {rows.map(([who, detail, tag]) => (
        <li key={who} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-[14px] text-paper">{who}</span>
            <span className="block truncate font-mono text-[11px] text-muted">{detail}</span>
          </span>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </ul>
  );
}

function Logs() {
  const rows = [
    ["8:02", "Truck 2 checked out", "Luis"],
    ["9:15", "Job #2141 marked done", "Dana"],
    ["10:40", "Invoice sent to Walt K.", "Automatic"],
    ["11:05", "Note: gate code changed at the Oak St. job", "Priya"],
    ["1:30", "Supplies ordered for Thursday", "June"],
  ];
  return (
    <ol className="space-y-1.5">
      {rows.map(([time, what, who]) => (
        <li key={time} className="grid grid-cols-[3.25rem_1fr] gap-3 rounded-lg bg-paper/[0.05] px-3 py-2.5">
          <span className="font-mono text-[12px] text-(--app-accent-text)">{time}</span>
          <span className="min-w-0">
            <span className="block text-[14px] text-paper">{what}</span>
            <span className="block font-mono text-[11px] text-muted">{who}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Projects() {
  const cols: Array<[string, string[]]> = [
    ["Quoted", ["Spring cleanup · Walt K.", "Office refresh · June A."]],
    ["In progress", ["Kitchen job · Dana R.", "Deck repair · Luis M."]],
    ["Done", ["Fence install · Priya S."]],
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map(([title, cards]) => (
        <div key={title} className="rounded-lg bg-paper/[0.05] p-2">
          <Label>
            {title} · {cards.length}
          </Label>
          <ul className="mt-2 space-y-1.5">
            {cards.map((c) => (
              <li key={c} className="rounded-md border border-paper/12 bg-ink/40 px-2 py-2 text-[12px] leading-snug text-paper">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Scorecard() {
  const rows: Array<[string, string, boolean]> = [
    ["Calls returned same day", "18 of 20", true],
    ["Jobs closed", "11 · goal 10", true],
    ["Estimates sent", "6 · goal 8", false],
    ["Reviews asked for", "9 · goal 10", true],
  ];
  return (
    <div className="rounded-lg bg-paper/[0.05]">
      <p className="border-b border-paper/10 px-3 py-2 font-mono text-[11px] text-muted">This week · Monday meeting</p>
      <ul className="divide-y divide-paper/10">
        {rows.map(([what, value, ok]) => (
          <li key={what} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-[14px] text-paper">{what}</span>
              <span className="block font-mono text-[11px] text-muted">{value}</span>
            </span>
            <span className={`font-mono text-[11px] whitespace-nowrap ${ok ? "text-paper" : "text-(--app-accent-text)"}`}>
              {ok ? "● On track" : "▼ Behind"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Knowledge() {
  const docs = [
    ["How we quote a job", "Updated Mon"],
    ["Opening checklist", "Updated last week"],
    ["Vendor contacts", "Updated today"],
    ["New hire: first week", "Updated in March"],
  ];
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-paper/15 px-3 py-2 font-mono text-[12px] text-muted">Search everything your team knows…</div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {docs.map(([title, meta]) => (
          <li key={title} className="rounded-lg bg-paper/[0.05] px-3 py-2.5">
            <span className="block text-[14px] text-paper">{title}</span>
            <span className="block font-mono text-[11px] text-muted">{meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PANELS: Record<ModuleId, () => ReactNode> = {
  revenue: Revenue,
  customers: Customers,
  logs: Logs,
  projects: Projects,
  scorecard: Scorecard,
  knowledge: Knowledge,
};

/* -------------------------------- app ---------------------------------- */

export default function OnePlaceApp() {
  const [active, setActive] = useState<ModuleId>("revenue");
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);

  const coverColor = () =>
    stage.current ? getComputedStyle(stage.current.closest(".mock-app")!).backgroundColor : "#1d1936";

  // First time the app scrolls into view, its panel assembles from grain.
  useEffect(() => {
    const el = canvas.current;
    const root = stage.current;
    if (!el || !root || prefersReducedMotion()) return;
    const rect = root.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already visible: don't flash
    setCover(el, { color: coverColor(), coverage: 1, pattern: "grain", cell: 6 });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        animateCover(el, { color: coverColor(), from: 1, to: 0, duration: 450, pattern: "grain", cell: 6 });
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  async function select(id: ModuleId) {
    if (id === active) return;
    const el = canvas.current;
    if (!el || busy.current || prefersReducedMotion()) {
      setActive(id);
      return;
    }
    busy.current = true;
    await animateCover(el, { color: coverColor(), from: 0, to: 1, duration: 90, pattern: "grain", cell: 6 });
    setActive(id);
    await animateCover(el, { color: coverColor(), from: 1, to: 0, duration: 260, pattern: "grain", cell: 6 });
    busy.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = MODULES.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? index === last ? 0 : index + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? index === 0 ? last : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    tabs.current[next]?.focus();
    select(MODULES[next].id);
  }

  return (
    <div
      role="group"
      aria-label="Illustration: one custom app for your business, shown with example data"
      className="mock-app overflow-hidden rounded-2xl border border-paper/15"
    >
      <div className="flex items-center gap-3 border-b border-paper/10 px-4 py-3">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-paper/20" />
          <span className="size-2.5 rounded-full bg-paper/20" />
          <span className="size-2.5 rounded-full bg-paper/20" />
        </span>
        <span className="font-mono text-[12px] text-muted">Your Business</span>
      </div>

      <div className="lg:grid lg:grid-cols-[210px_1fr]">
        <div
          role="tablist"
          aria-label="Modules"
          className="flex flex-wrap gap-2 p-3 lg:flex-col lg:gap-1 lg:border-r lg:border-paper/10 lg:p-4"
        >
          {MODULES.map((m, i) => {
            const selected = m.id === active;
            return (
              <button
                key={m.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`tab-${m.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${m.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(m.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`min-h-11 rounded-full border px-4 text-[14px] font-medium transition-colors lg:rounded-lg lg:text-left ${
                  selected
                    ? "border-paper bg-paper text-ink"
                    : "border-paper/20 text-muted hover:border-paper/40 hover:text-paper lg:border-transparent"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Panels share one grid cell so switching never changes the height. */}
        <div ref={stage} className="relative grid p-4 lg:p-6">
          {MODULES.map((m) => {
            const Panel = PANELS[m.id];
            const selected = m.id === active;
            return (
              <div
                key={m.id}
                id={`panel-${m.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${m.id}`}
                inert={!selected}
                aria-hidden={!selected}
                className={`col-start-1 row-start-1 ${selected ? "" : "invisible"}`}
              >
                <p className="font-display text-[26px] leading-tight text-paper">{m.name}</p>
                <p className="mt-1 mb-4 max-w-[46ch] text-[15px] leading-snug text-muted">{m.line}</p>
                <Panel />
              </div>
            );
          })}
          <canvas ref={canvas} className="dither-canvas" aria-hidden="true" />
        </div>
      </div>

      <p className="border-t border-paper/10 px-4 py-2.5 font-mono text-[11px] text-muted/80">
        Illustration · example data
      </p>
    </div>
  );
}
