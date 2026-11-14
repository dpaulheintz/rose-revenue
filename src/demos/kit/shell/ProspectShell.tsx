"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CAL_BOOKING_URL } from "@/lib/booking";
import { BookCall } from "@demos/kit/shell/BookCall";
import { PreparedBy, Wordmark } from "@demos/kit/shell/Brand";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Dialog from "@demos/kit/ui/Dialog";
import Icon from "@demos/kit/ui/Icon";

/**
 * Shell for the prospect templates (templates/*): the banner on every screen,
 * the prospect's name with "Prepared by Rose Revenue" in the header at every
 * size, Book-a-call, a sidebar from 1024px and, below that, a bottom tab bar
 * (the first four `phone: true` modules plus More).
 */
export default function ProspectShell({ children }: { children: ReactNode }) {
  const { cfg, base } = useDemo();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const href = (p: string) => `${base}/${p}`;
  const current = cfg.modules.find((m) => pathname === href(m.path)) ?? cfg.modules[0];
  const tabs = cfg.modules.filter((m) => m.phone).slice(0, 4);
  const rest = cfg.modules.filter((m) => !tabs.includes(m));
  const moreOn = rest.includes(current);

  return (
    <div className="flex min-h-dvh flex-col bg-(--d-bg) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-(--d-text)">
      <p className="bg-(--d-accent) px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2 text-center text-[14px] leading-snug font-semibold text-(--d-on-accent)">{cfg.copy.ribbon}</p>

      <header className="sticky top-0 z-40 border-b border-(--d-line) bg-(--d-header) text-(--d-on-header)">
        <div className="flex min-h-16 items-center gap-3 px-4 py-2 lg:px-6">
          <Link href={href(cfg.modules[0].path)} className="flex min-h-12 min-w-0 flex-col justify-center" aria-label={`${cfg.company.name}, home`}>
            <span className="sm:hidden"><Wordmark cfg={cfg} compact /></span>
            <span className="hidden sm:block"><Wordmark cfg={cfg} /></span>
          </Link>
          <span className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden opacity-85 md:block"><PreparedBy /></span>
            <BookCall />
          </span>
        </div>
        <p className="border-t border-white/10 px-4 py-1 text-[12.5px] opacity-85 md:hidden"><PreparedBy /></p>
      </header>

      <div className="flex min-w-0 flex-1">
        <nav aria-label="Screens" className="sticky top-[65px] hidden h-[calc(100dvh-65px)] w-[236px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-(--d-line) bg-(--d-panel) p-3 lg:flex">
          {cfg.modules.map((m) => {
            const on = m === current;
            return (
              <Link key={m.key} href={href(m.path)} aria-current={on ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-[15px] ${on ? "bg-(--d-accent) font-semibold text-(--d-on-accent)" : "hover:bg-(--d-panel2)"}`}>
                <Icon name={m.icon} size={20} />{m.label}
              </Link>
            );
          })}
        </nav>
        <main id="main" className="min-w-0 flex-1 px-4 pt-4 pb-[calc(110px+env(safe-area-inset-bottom))] lg:px-8 lg:pt-6 lg:pb-12">
          <div className="mx-auto max-w-[1240px]">{children}</div>
          <footer className="mx-auto mt-10 max-w-[1240px] border-t border-(--d-line) pt-4 text-[13px] text-(--d-muted)">{cfg.copy.footer}</footer>
        </main>
      </div>

      <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-50 border-t border-(--d-line) bg-[color-mix(in_oklab,var(--d-panel)_96%,transparent)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map((m) => {
            const on = m === current;
            return (
              <li key={m.key}>
                <Link href={href(m.path)} aria-current={on ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12.5px] font-semibold ${on ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
                  <Icon name={m.icon} size={23} />{m.short ?? m.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-[12.5px] font-semibold ${moreOn ? "text-(--d-accent)" : "text-(--d-muted)"}`}>
              <Icon name="more" size={23} />More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More" sheet>
        <ul className="space-y-2 pb-2">
          {rest.map((m) => (
            <li key={m.key}>
              <Link href={href(m.path)} onClick={() => setMore(false)} aria-current={m === current ? "page" : undefined} className="flex min-h-14 items-center gap-3 rounded-[12px] border border-(--d-line) px-4 text-[16px] font-semibold">
                <Icon name={m.icon} size={22} className="text-(--d-accent)" />{m.label}<Icon name="arrow" size={18} className="ml-auto text-(--d-muted)" />
              </Link>
            </li>
          ))}
        </ul>
        <a href={CAL_BOOKING_URL} target="_blank" rel="noopener" className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-[12px] bg-(--d-accent) px-4 text-[16px] font-semibold text-(--d-on-accent)">
          <Icon name="calendar" size={20} />Book a free 15-min call<span className="sr-only"> (opens Cal.com in a new tab)</span>
        </a>
      </Dialog>
    </div>
  );
}

/** Paul's note for the template home screens: what the real version would be. */
export function RoseNote({ connects, className = "" }: { connects: string; className?: string }) {
  return (
    <section className={`rounded-[16px] border border-(--d-line) bg-(--d-panel) p-4 sm:p-5 ${className}`} aria-label="A note from Rose Revenue">
      <p className="text-[16px] leading-relaxed">
        This is a sample built for you. The real version connects to {connects}, is built around how your team actually works, and you own the code and the data. No software to rent.
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[15px]">
        <span><span className="font-semibold">Paul Heintzman</span>, Rose Revenue</span>
        <BookCall />
      </p>
    </section>
  );
}
