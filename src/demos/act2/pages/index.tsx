"use client";

// This demo's screens and data provider, each loaded as its own chunk so a
// page only downloads what it shows. Keys match config.modules[].key.
// (Literal import() calls let Next server-render them and preload the chunk.)
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";

const Provider = dynamic(() => import("../parts/ShopProvider"));

const screens: Record<string, ComponentType> = {
  "today": dynamic(() => import("./Today")),
  "jobs": dynamic(() => import("./Jobs")),
  "money": dynamic(() => import("./Money")),
  "customers": dynamic(() => import("./Customers")),
  "sales": dynamic(() => import("./Sales")),
  "costing": dynamic(() => import("./Costing")),
  "change-orders": dynamic(() => import("./ChangeOrders")),
  "crew": dynamic(() => import("./Crew")),
  "materials": dynamic(() => import("./Materials")),
  "photos": dynamic(() => import("./Photos")),
  "permits": dynamic(() => import("./Permits")),
  "warranty": dynamic(() => import("./Warranty")),
  "portal": dynamic(() => import("./Portal")),
  "ask": dynamic(() => import("./Ask")),
};

// Warm the other screens once the browser is idle, so moving between them is instant.
const warm = [
  () => import("./Today"),
  () => import("./Jobs"),
  () => import("./Money"),
  () => import("./Customers"),
  () => import("./Sales"),
  () => import("./Costing"),
  () => import("./ChangeOrders"),
  () => import("./Crew"),
  () => import("./Materials"),
  () => import("./Photos"),
  () => import("./Permits"),
  () => import("./Warranty"),
  () => import("./Portal"),
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
