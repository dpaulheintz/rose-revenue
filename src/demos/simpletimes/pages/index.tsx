"use client";

// This demo's screens, provider and shell, each loaded as its own chunk so a
// page only downloads what it shows. Keys match config.modules[].key.
// (Literal import() calls let Next server-render them and preload the chunk.)
import dynamic from "next/dynamic";
import { useEffect, type ComponentType, type ReactNode } from "react";

const Provider = dynamic(() => import("../parts/StProvider"));
const ShellImpl = dynamic(() => import("../parts/StShell"));

const screens: Record<string, ComponentType> = {
  "brands": dynamic(() => import("./BrandsHome")),
  "accounts": dynamic(() => import("./Accounts")),
  "sales": dynamic(() => import("./Sales")),
  "calendar": dynamic(() => import("./Calendar")),
  "tastings": dynamic(() => import("./Tastings")),
  "copack": dynamic(() => import("./CopackHome")),
  "pipeline": dynamic(() => import("./Pipeline")),
  "runs": dynamic(() => import("./Runs")),
  "inventory": dynamic(() => import("./Inventory")),
  "quotes": dynamic(() => import("./Quotes")),
  "client": dynamic(() => import("./ClientView")),
  "overview": dynamic(() => import("./Overview")),
  "scorecard": dynamic(() => import("./Scorecard")),
};

// Warm the other screens once the browser is idle, so moving between them is instant.
const warm = [
  () => import("./BrandsHome"), () => import("./Accounts"), () => import("./Sales"), () => import("./Calendar"), () => import("./Tastings"),
  () => import("./CopackHome"), () => import("./Pipeline"), () => import("./Runs"), () => import("./Inventory"), () => import("./Quotes"),
  () => import("./ClientView"), () => import("./Overview"), () => import("./Scorecard"), () => import("../parts/Sheets"),
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
