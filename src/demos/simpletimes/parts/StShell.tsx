"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import LaneShell from "@demos/kit/shell/LaneShell";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { BRANDS } from "@demos/simpletimes/catalog";
import type { BrandFilter } from "@demos/simpletimes/derive";
import { useSt } from "./StProvider";

/** Brand filter under the lane switcher on Brands screens: All, Mixers, Syrup Project. */
function BrandFilterBar() {
  const { brand, setBrand } = useSt();
  const opts: Array<{ v: BrandFilter; label: string; color?: string }> = [{ v: "all", label: "All" }, { v: "mixers", label: "Mixers", color: BRANDS.mixers.color }, { v: "syrup", label: "Syrup Project", color: BRANDS.syrup.color }];
  return (
    <div role="radiogroup" aria-label="Brand" className="flex gap-2">
      {opts.map((o) => {
        const on = brand === o.v;
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} onClick={() => setBrand(o.v)} className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 ${on ? "border-(--d-text) bg-(--d-text) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>
            {o.color ? <span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden="true" /> : null}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Co-Packing: the "See what your client sees" toggle. */
function ClientToggle({ on }: { on: boolean }) {
  const { base } = useDemo();
  return (
    <Link href={`${base}/${on ? "copack" : "client-view"}`} className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold ${on ? "border-(--d-accent) bg-(--d-accent) text-white" : "border-(--d-line) bg-(--d-panel)"}`}>
      <Icon name="eye" size={18} />{on ? "Back to my view" : "See what your client sees"}
    </Link>
  );
}

export default function StShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { base } = useDemo();
  const { open } = useSt();
  return (
    <LaneShell
      subbar={(lane, mod) => (lane === "brands" ? <BrandFilterBar /> : lane === "copack" ? <ClientToggle on={mod === "client"} /> : null)}
      quick={(lane, mod) =>
        lane === "brands" ? [
          { label: "Log visit", icon: "pin", go: () => open({ kind: "visit" }) },
          { label: "Log tasting", icon: "drop", go: () => open({ kind: "logTasting" }) },
          { label: "New order", icon: "receipt", go: () => open({ kind: "order" }) },
          { label: "Add account", icon: "users", go: () => open({ kind: "addAccount" }) },
        ] : lane === "copack" && mod !== "quotes" && mod !== "client" ? [
          { label: "New quote", icon: "receipt", go: () => router.push(`${base}/quotes`) },
          { label: "Schedule run", icon: "calendar", go: () => open({ kind: "scheduleRun" }) },
          { label: "Receive inventory", icon: "truck", go: () => open({ kind: "receive" }) },
          { label: "Add client", icon: "users", go: () => open({ kind: "addClient" }) },
        ] : []
      }
    >
      {children}
    </LaneShell>
  );
}
