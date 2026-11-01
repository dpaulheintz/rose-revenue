"use client";

// This demo's screens and data provider, each loaded as its own chunk so a
// page only downloads what it shows. Keys match config.modules[].key.
// (Literal import() calls let Next server-render them and preload the chunk.)
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";

const Provider = dynamic(() => import("../parts/BuckeyeProvider"));

const screens: Record<string, ComponentType> = {
  "dashboard": dynamic(() => import("./Dashboard")),
  "jobs": dynamic(() => import("./Jobs")),
  "quotes": dynamic(() => import("./Quotes")),
  "inventory": dynamic(() => import("./Inventory")),
  "quality": dynamic(() => import("./Quality")),
  "customers": dynamic(() => import("./Customers")),
  "maintenance": dynamic(() => import("./Maintenance")),
  "scorecard": dynamic(() => import("./Scorecard")),
  "ask": dynamic(() => import("./Ask")),
};

// Warm the other screens once the browser is idle, so moving between them is instant.
const warm = [
  () => import("./Dashboard"),
  () => import("./Jobs"),
  () => import("./Quotes"),
  () => import("./Inventory"),
  () => import("./Quality"),
  () => import("./Customers"),
  () => import("./Maintenance"),
  () => import("./Scorecard"),
  () => import("./Ask"),
];

export function Data({ anchor, children }: { anchor: string; children: ReactNode }) {
  return <Provider anchor={anchor}>{children}</Provider>;
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
