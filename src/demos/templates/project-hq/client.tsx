"use client";

// Project HQ screens and provider, each loaded as its own chunk so a page only
// downloads what it shows. A prospect's pages/index.tsx re-exports these and
// hands its prospect.ts to Data. Keys match the modules in config.ts.
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";
import ProspectShell from "@demos/kit/shell/ProspectShell";
import type { ProjectProspect } from "./types";

const Provider = dynamic(() => import("./parts/Provider"));

const screens: Record<string, ComponentType> = {
  "dashboard": dynamic(() => import("./pages/Dashboard")),
  "projects": dynamic(() => import("./pages/Projects")),
  "changes": dynamic(() => import("./pages/ChangeOrders")),
  "billing": dynamic(() => import("./pages/Billing")),
  "labor": dynamic(() => import("./pages/Labor")),
  "service": dynamic(() => import("./pages/Service")),
};
const warm = [() => import("./pages/Dashboard"), () => import("./pages/Projects"), () => import("./pages/ChangeOrders"), () => import("./pages/Billing"), () => import("./pages/Labor"), () => import("./pages/Service")];

export function ProjectData({ prospect, anchor, children }: { prospect: ProjectProspect; anchor: string; children: ReactNode }) {
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
