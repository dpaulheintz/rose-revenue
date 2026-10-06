"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { dayDate } from "@/lib/demo/format";
import { useDemo } from "./DemoProvider";
import { PreparedBy, Wordmark } from "./Brand";
import Dialog from "./Dialog";
import Icon from "./Icon";

export default function DemoShell({ children }: { children: ReactNode }) {
  const { cfg, base, anchor } = useDemo();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const href = (path: string) => (path ? `${base}/${path}` : base);
  const isActive = (path: string) => pathname === href(path);
  const phoneTabs = cfg.modules.filter((m) => m.phone).slice(0, 4);
  const moreItems = cfg.modules.filter((m) => !phoneTabs.includes(m));
  const moreActive = moreItems.some((m) => isActive(m.path));

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Ribbon: on every screen. */}
      <p className="bg-(--d-accent) px-4 py-1.5 text-center text-[12px] leading-snug font-medium text-(--d-on-accent)">{cfg.copy.ribbon}</p>

      <header className="sticky top-0 z-40 bg-(--d-header) text-(--d-on-header)">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <Link href={href(cfg.modules[0].path)} className="min-w-0 rounded-lg" aria-label={`${cfg.company.name} ${cfg.company.appName}, home`}>
            <span className="sm:hidden"><Wordmark cfg={cfg} compact /></span>
            <span className="hidden sm:inline"><Wordmark cfg={cfg} /></span>
          </Link>
          <span className="ml-1 hidden rounded-full border border-current/25 px-2.5 py-0.5 text-[12px] font-medium tracking-[0.04em] opacity-85 md:inline">{cfg.company.appName}</span>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden opacity-80 lg:block"><PreparedBy /></span>
            <a
              href={CAL_BOOKING_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-(--d-accent) px-4 whitespace-nowrap text-[14px] font-semibold text-(--d-on-accent) hover:brightness-110 sm:px-5"
            >
              <Icon name="calendar" size={18} className="hidden sm:block" />
              <span className="sm:hidden">Book a call</span>
              <span className="hidden sm:inline">Book a free 15-min call</span>
              <span className="sr-only"> (opens Cal.com in a new tab)</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-w-0 flex-1">
        {/* Rail (tablet) → full sidebar (desktop). */}
        <nav aria-label="Modules" className="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-(--d-line) bg-(--d-panel) p-2 md:flex md:w-[88px] xl:w-[236px] xl:p-3">
          {cfg.modules.map((m) => (
            <Link
              key={m.key}
              href={href(m.path)}
              aria-current={isActive(m.path) ? "page" : undefined}
              className={`flex min-h-12 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-center text-[11px] leading-tight xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-left xl:text-[14.5px] ${
                isActive(m.path) ? "bg-(--d-accent) text-(--d-on-accent)" : "text-(--d-muted) hover:bg-(--d-panel2) hover:text-(--d-text)"
              }`}
            >
              <Icon name={m.icon} size={21} />
              <span className="font-medium">{m.label}</span>
            </Link>
          ))}
          <div className="mt-auto hidden px-3 pt-4 pb-2 text-[12px] text-(--d-muted) xl:block">
            <p>As of {dayDate(anchor)}</p>
            <PreparedBy className="mt-1" />
          </div>
        </nav>

        <main id="main" className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 md:pb-10 lg:px-8 lg:pt-7">
          <div className="mx-auto max-w-[1320px]">{children}</div>
          <footer className="mx-auto mt-12 flex max-w-[1320px] flex-wrap items-center justify-between gap-2 border-t border-(--d-line) pt-4 text-[12px] text-(--d-muted)">
            <PreparedBy />
            <span>{cfg.copy.footer}</span>
          </footer>
        </main>
      </div>

      {/* Phone: bottom tab bar. */}
      <nav aria-label="Modules" className="fixed inset-x-0 bottom-0 z-50 border-t border-(--d-line) bg-(--d-panel)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {phoneTabs.map((m) => {
            const on = isActive(m.path);
            return (
              <li key={m.key}>
                <Link href={href(m.path)} aria-current={on ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11.5px] font-medium ${on ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
                  <Icon name={m.icon} size={22} />
                  {m.short ?? m.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium ${moreActive ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
              <Icon name="more" size={22} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More">
        <ul className="grid grid-cols-1 gap-2 pb-2 min-[420px]:grid-cols-2">
          {moreItems.map((m) => (
            <li key={m.key}>
              <Link
                href={href(m.path)}
                onClick={() => setMore(false)}
                aria-current={isActive(m.path) ? "page" : undefined}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-[16px] font-medium ${isActive(m.path) ? "border-(--d-accent) text-(--d-accent)" : "border-(--d-line) text-(--d-text)"}`}
              >
                <Icon name={m.icon} size={22} />
                {m.label}
                <Icon name="arrow" size={18} className="ml-auto text-(--d-muted)" />
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}
