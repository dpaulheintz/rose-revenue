"use client";

// This demo's screens and data provider, each loaded as its own chunk so a
// page only downloads what it shows. Keys match config.modules[].key.
// (Literal import() calls let Next server-render them and preload the chunk.)
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";

const Provider = dynamic(() => import("../parts/FarmProvider"));

const screens: Record<string, ComponentType> = {
  "overview": dynamic(() => import("./Overview")),
  "customers": dynamic(() => import("./Customers")),
  "sales": dynamic(() => import("./Sales")),
  "inventory": dynamic(() => import("./Inventory")),
  "herd": dynamic(() => import("./Herd")),
  "poultry": dynamic(() => import("./Poultry")),
  "production": dynamic(() => import("./Production")),
  "delivery": dynamic(() => import("./Delivery")),
  "maintenance": dynamic(() => import("./Maintenance")),
  "projects": dynamic(() => import("./Projects")),
  "ask": dynamic(() => import("./Ask")),
};

// Warm the other screens once the browser is idle, so moving between them is instant.
const warm = [
  () => import("./Overview"),
  () => import("./Customers"),
  () => import("./Sales"),
  () => import("./Inventory"),
  () => import("./Herd"),
  () => import("./Poultry"),
  () => import("./Production"),
  () => import("./Delivery"),
  () => import("./Maintenance"),
  () => import("./Projects"),
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
