"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { QuickAdd, type QuickAddItem } from "@demos/kit/blocks/QuickAdd";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { BookCall } from "@demos/kit/shell/BookCall";
import { Wordmark } from "@demos/kit/shell/Brand";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import type { DemoModule } from "@demos/kit/types";

/**
 * Phone-first shell for a demo split into lanes (cfg.lanes; each module has a
 * `lane`). Phones and tablets: a sticky lane switcher (plus an optional
 * sub-bar, e.g. filter chips) at the top, the lane's own bottom tab bar (its
 * `phone: true` modules, up to five), a "More" sheet in the header and a
 * floating + for the lane's quick actions. From 1024px a sidebar replaces the
 * tab bar. Each lane can bring its own accent color.
 */
export default function LaneShell({
  children, subbar, quick, moreExtras,
}: {
  children: ReactNode;
  subbar?: (lane: string, module: string) => ReactNode;
  quick?: (lane: string, module: string) => QuickAddItem[];
  moreExtras?: ReactNode; // extra rows at the top of the More sheet
}) {
  const { cfg, base } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [ribbon, setRibbon] = useState(false);
  const [more, setMore] = useState(false);
  const lanes = cfg.lanes ?? [];
  const href = (m: DemoModule) => `${base}/${m.path}`;
  const current = cfg.modules.find((m) => pathname === href(m)) ?? cfg.modules[0];
  const lane = lanes.find((l) => l.key === current.lane) ?? lanes[0];
  const inLane = (key: string) => cfg.modules.filter((m) => m.lane === key);
  const tabs = inLane(lane.key).filter((m) => m.phone).slice(0, 5);
  const moreItems = cfg.modules.filter((m) => m.lane === lane.key && !tabs.includes(m));
  // Switching lanes returns you to where you were in that lane.
  const lastIn = useRef<Record<string, string>>({});
  useEffect(() => { lastIn.current[lane.key] = current.key; }, [lane.key, current.key]);
  const goLane = (key: string) => {
    if (key === lane.key) return;
    const target = cfg.modules.find((m) => m.key === lastIn.current[key]) ?? inLane(key)[0];
    router.push(href(target));
  };
  const actions = quick?.(lane.key, current.key) ?? [];
  const laneVars = (lane.color ? { "--d-accent": lane.color, "--d-on-accent": lane.onColor ?? "#ffffff" } : {}) as CSSProperties;
  const extra = subbar?.(lane.key, current.key);

  const switcher = (
    <div role="radiogroup" aria-label="Part of the business" className="grid w-full grid-flow-col auto-cols-fr gap-1 rounded-[12px] bg-(--d-panel2) p-1">
      {lanes.map((l) => {
        const on = l.key === lane.key;
        return (
          <button
            key={l.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => goLane(l.key)}
            className={`min-h-12 rounded-[9px] px-2 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 ${on ? "text-white" : "text-(--d-muted) hover:text-(--d-text)"}`}
            style={on ? { background: l.color ?? "var(--d-accent)", color: l.onColor ?? "#ffffff" } : undefined}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-(--d-bg) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-(--d-text)" style={laneVars}>
      {/* Ribbon: one line on phones; tap to read it all. */}
      <button type="button" onClick={() => setRibbon((r) => !r)} aria-expanded={ribbon} className="flex min-h-12 w-full items-center justify-center bg-(--d-header) px-4 pt-[env(safe-area-inset-top)] text-center text-[13px] leading-snug font-medium text-(--d-on-header) sm:cursor-default">
        <span className={`block min-w-0 py-1.5 ${ribbon ? "" : "truncate"} sm:whitespace-normal`}>{cfg.copy.ribbon}</span>
      </button>

      <div className="flex min-w-0 flex-1">
        {/* Desktop sidebar */}
        <nav aria-label="Modules" className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col overflow-y-auto border-r border-(--d-line) bg-(--d-panel) px-3 py-4 lg:flex">
          <Link href={href(cfg.modules[0])} className="mb-5 flex min-h-12 items-center px-2" aria-label={`${cfg.company.name}, home`}><Wordmark cfg={cfg} /></Link>
          {lanes.map((l) => (
            <div key={l.key} className="mb-4">
              <p className="mb-1 flex items-center gap-2 px-3 text-[13px] font-semibold text-(--d-muted)"><span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />{l.label}</p>
              {inLane(l.key).map((m) => {
                const on = m.key === current.key;
                return (
                  <Link key={m.key} href={href(m)} aria-current={on ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-[15px] ${on ? "font-semibold text-white" : "text-(--d-text) hover:bg-(--d-panel2)"}`} style={on ? { background: l.color } : undefined}>
                    <Icon name={m.icon} size={20} />{m.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Phone / tablet header: scrolls away; the lane bar below stays. */}
          <header className="flex h-14 items-center gap-3 px-4 lg:hidden">
            <Link href={href(cfg.modules[0])} className="flex min-h-12 min-w-0 items-center" aria-label={`${cfg.company.name}, home`}><Wordmark cfg={cfg} compact /></Link>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden md:block"><BookCall /></span>
              <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-(--d-line) bg-(--d-panel) px-4 text-[15px] font-semibold">
                <Icon name="more" size={20} />More
              </button>
            </div>
          </header>

          <div className="sticky top-0 z-40 border-b border-(--d-line) bg-[color-mix(in_oklab,var(--d-bg)_92%,transparent)] px-4 pt-2 pb-2 backdrop-blur-md lg:px-8 lg:pt-3">
            <div className="mx-auto flex max-w-[1180px] items-center gap-4">
              <div className="min-w-0 flex-1 lg:max-w-[460px]">{switcher}</div>
              <span className="ml-auto hidden lg:block"><BookCall /></span>
            </div>
            {extra ? <div className="mx-auto mt-2 max-w-[1180px]">{extra}</div> : null}
          </div>

          <main id="main" className="min-w-0 flex-1 px-4 pt-4 pb-[calc(160px+env(safe-area-inset-bottom))] lg:px-8 lg:pt-6 lg:pb-12">
            <div className="mx-auto max-w-[1180px]">{children}</div>
            <footer className="mx-auto mt-10 max-w-[1180px] border-t border-(--d-line) pt-4 text-[13px] text-(--d-muted)">{cfg.copy.footer}</footer>
          </main>
        </div>
      </div>

      {actions.length ? <QuickAdd items={actions} title={`Quick add: ${lane.label}`} position="right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] lg:right-8 lg:bottom-8" size="size-14" /> : null}

      {/* Phone / tablet: this lane's tab bar. */}
      <nav aria-label={`${lane.label} screens`} className="fixed inset-x-0 bottom-0 z-50 border-t border-(--d-line) bg-[color-mix(in_oklab,var(--d-panel)_96%,transparent)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-flow-col auto-cols-fr">
          {tabs.map((m) => {
            const on = m.key === current.key;
            return (
              <li key={m.key}>
                <Link href={href(m)} aria-current={on ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold ${on ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
                  <Icon name={m.icon} size={23} />
                  {m.short ?? m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More" sheet>
        <div className="space-y-5 pb-2">
          {moreExtras}
          {moreItems.length ? (
            <ul className="space-y-2">
              {moreItems.map((m) => (
                <li key={m.key}>
                  <Link href={href(m)} onClick={() => setMore(false)} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px] font-semibold">
                    <Icon name={m.icon} size={22} className="text-(--d-accent)" />{m.label}<Icon name="arrow" size={18} className="ml-auto text-(--d-muted)" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div>
            <p className="mb-2 text-[14px] text-(--d-muted)">Switch to another part of the business</p>
            <ul className="space-y-2">
              {lanes.filter((l) => l.key !== lane.key).map((l) => (
                <li key={l.key}>
                  <button type="button" onClick={() => { setMore(false); goLane(l.key); }} className="flex min-h-14 w-full items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-left text-[16px] font-semibold">
                    <span className="size-3 rounded-full" style={{ background: l.color }} aria-hidden="true" />{l.label}<Icon name="arrow" size={18} className="ml-auto text-(--d-muted)" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="flex min-h-14 items-center justify-center gap-2 rounded-[12px] bg-(--d-accent) px-4 text-[16px] font-semibold text-(--d-on-accent)">
            <Icon name="calendar" size={20} />Book a free 15-min call<span className="sr-only"> (opens Cal.com in a new tab)</span>
          </a>
          <p className="text-[13.5px] text-(--d-muted)">{cfg.copy.ribbon}</p>
        </div>
      </Dialog>
    </div>
  );
}
