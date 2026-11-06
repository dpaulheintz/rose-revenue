"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { QuickAdd } from "@demos/kit/blocks/QuickAdd";
import { BookCall } from "@demos/kit/shell/BookCall";
import { Wordmark } from "@demos/kit/shell/Brand";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";
import { useAt } from "./AtProvider";

/**
 * One-truck shell: slim ribbon, wordmark header, bottom tabs (Today, Jobs,
 * Customers, Money, More) and a floating + on phones and tablets; a sidebar
 * from 1024px. Book-a-call lives in More, on Today and in the desktop header.
 */
export default function AtShell({ children }: { children: ReactNode }) {
  const { cfg, base } = useDemo();
  const { open } = useAt();
  const pathname = usePathname();
  const [ribbon, setRibbon] = useState(false);
  const [more, setMore] = useState(false);
  const href = (p: string) => `${base}/${p}`;
  const current = cfg.modules.find((m) => pathname === href(m.path)) ?? cfg.modules[0];
  const tabs = cfg.modules.filter((m) => m.phone);
  const rest = cfg.modules.filter((m) => !m.phone);
  const moreOn = rest.includes(current);
  const fab = current.key !== "view";

  return (
    <div className="flex min-h-dvh flex-col bg-(--d-bg) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-(--d-text)">
      <button type="button" onClick={() => setRibbon((r) => !r)} aria-expanded={ribbon} className="flex min-h-12 w-full items-center justify-center bg-(--d-header) px-4 pt-[env(safe-area-inset-top)] text-center text-[13px] leading-snug font-medium text-(--d-on-header) sm:cursor-default">
        <span className={`block min-w-0 py-1.5 ${ribbon ? "" : "truncate"} sm:whitespace-normal`}>{cfg.copy.ribbon}</span>
      </button>

      <div className="flex min-w-0 flex-1">
        <nav aria-label="Screens" className="sticky top-0 hidden h-dvh w-[250px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-(--d-line) bg-(--d-panel) px-3 py-5 lg:flex">
          <Link href={href(cfg.modules[0].path)} className="mb-5 flex min-h-12 items-center px-2" aria-label={`${cfg.company.name}, home`}><Wordmark cfg={cfg} /></Link>
          {cfg.modules.map((m) => {
            const on = m === current;
            return (
              <Link key={m.key} href={href(m.path)} aria-current={on ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-[15.5px] ${on ? "bg-(--d-accent) font-bold text-white" : "hover:bg-(--d-panel2)"}`}>
                <Icon name={m.icon} size={20} />{m.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-(--d-line) bg-[color-mix(in_oklab,var(--d-bg)_94%,transparent)] px-4 backdrop-blur-md lg:px-8">
            <Link href={href(cfg.modules[0].path)} className="flex min-h-12 min-w-0 items-center lg:hidden" aria-label={`${cfg.company.name}, home`}><Wordmark cfg={cfg} compact /></Link>
            <p className="hidden text-[15px] text-(--d-muted) lg:block">{current.label}</p>
            <span className="ml-auto hidden md:block"><BookCall /></span>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 pt-4 pb-[calc(170px+env(safe-area-inset-bottom))] lg:px-8 lg:pt-6 lg:pb-12">
            <div className="mx-auto max-w-[1120px]">{children}</div>
            <footer className="mx-auto mt-10 max-w-[1120px] border-t border-(--d-line) pt-4 text-[13px] text-(--d-muted)">{cfg.copy.footer}</footer>
          </main>
        </div>
      </div>

      {fab ? (
        <QuickAdd
          title="Quick add"
          position="right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] lg:right-8 lg:bottom-8"
          size="size-16"
          items={[
            { label: "New job", icon: "calendar", go: () => open({ kind: "newJob" }) },
            { label: "New estimate", icon: "receipt", go: () => open({ kind: "newEstimate" }) },
            { label: "Log expense", icon: "dollar", go: () => open({ kind: "expense" }) },
            { label: "Send review request", icon: "spark", go: () => open({ kind: "review" }) },
          ]}
        />
      ) : null}

      <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-50 border-t border-(--d-line) bg-[color-mix(in_oklab,var(--d-panel)_96%,transparent)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map((m) => {
            const on = m === current;
            return (
              <li key={m.key}>
                <Link href={href(m.path)} aria-current={on ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12.5px] font-bold ${on ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
                  <Icon name={m.icon} size={24} />{m.short ?? m.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-[12.5px] font-bold ${moreOn ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
              <Icon name="more" size={24} />More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More" sheet>
        <ul className="space-y-2 pb-2">
          {rest.map((m) => (
            <li key={m.key}>
              <Link href={href(m.path)} onClick={() => setMore(false)} aria-current={m === current ? "page" : undefined} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16.5px] font-bold">
                <Icon name={m.icon} size={22} className="text-(--d-accent)" />{m.label}<Icon name="arrow" size={18} className="ml-auto text-(--d-muted)" />
              </Link>
            </li>
          ))}
        </ul>
        <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-[12px] bg-(--d-accent) px-4 text-[16.5px] font-bold text-white">
          <Icon name="calendar" size={20} />Book a free 15-min call<span className="sr-only"> (opens Cal.com in a new tab)</span>
        </a>
        <p className="mt-4 text-[14px] text-(--d-muted)">{cfg.copy.ribbon}</p>
      </Dialog>
    </div>
  );
}
