"use client";

// This demo's screens, provider and shell, each loaded as its own chunk so a
// page only downloads what it shows. Keys match config.modules[].key.
// (Literal import() calls let Next server-render them and preload the chunk.)
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";

const Provider = dynamic(() => import("../parts/AtProvider"));
const ShellImpl = dynamic(() => import("../parts/AtShell"));

const screens: Record<string, ComponentType> = {
  "today": dynamic(() => import("./Today")),
  "jobs": dynamic(() => import("./Jobs")),
  "customers": dynamic(() => import("./Customers")),
  "money": dynamic(() => import("./Money")),
  "billing": dynamic(() => import("./Billing")),
  "reviews": dynamic(() => import("./Reviews")),
  "tuneups": dynamic(() => import("./TuneUps")),
  "stock": dynamic(() => import("./Stock")),
  "view": dynamic(() => import("./CustomerView")),
};

// Warm the other screens once the browser is idle, so moving between them is instant.
const warm = [
  () => import("./Today"), () => import("./Jobs"), () => import("./Customers"), () => import("./Money"), () => import("./Billing"),
  () => import("./Reviews"), () => import("./TuneUps"), () => import("./Stock"), () => import("./CustomerView"), () => import("../parts/Sheets"),
];

export function Data({ anchor, children }: { anchor: string; children: ReactNode }) {
  return <Provider anchor={anchor}>{children}</Provider>;
}

export function Shell({ children }: { children: ReactNode }) {
  return <ShellImpl>{children}</ShellImpl>;
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
