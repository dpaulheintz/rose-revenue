"use client";

// Shop HQ screens and provider, each loaded as its own chunk so a page only
// downloads what it shows. A prospect's pages/index.tsx re-exports these and
// hands its prospect.ts to Data. Keys match the modules in config.ts.
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";
import ProspectShell from "@demos/kit/shell/ProspectShell";
import type { ShopProspect } from "./types";

const Provider = dynamic(() => import("./parts/Provider"));

const screens: Record<string, ComponentType> = {
  "today": dynamic(() => import("./pages/Today")),
  "leads": dynamic(() => import("./pages/Leads")),
  "needs": dynamic(() => import("./pages/NeedsYou")),
  "money": dynamic(() => import("./pages/Money")),
  "plans": dynamic(() => import("./pages/Plans")),
  "techs": dynamic(() => import("./pages/Techs")),
};
const warm = [() => import("./pages/Today"), () => import("./pages/Leads"), () => import("./pages/NeedsYou"), () => import("./pages/Money"), () => import("./pages/Plans"), () => import("./pages/Techs")];

export function ShopData({ prospect, anchor, children }: { prospect: ShopProspect; anchor: string; children: ReactNode }) {
  return <Provider prospect={prospect} anchor={anchor}>{children}</Provider>;
}

export function Shell({ children }: { children: ReactNode }) {
  return <ProspectShell>{children}</ProspectShell>;
}

export function Screen({ id }: { id: string }) {
  useEffect(() => {
    const run = () => warm.forEach((load) => void load());
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const t = w.requestIdleCallback ? w.requestIdleCallback(run) : window.setTimeout(run, 1500);
    return () => { if (!w.requestIdleCallback) window.clearTimeout(t); };
  }, []);
  const S = screens[id];
  return S ? <S /> : null;
}
