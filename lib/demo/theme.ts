import type { CSSProperties } from "react";
import type { Look, Theme } from "@/demos/types";

/** CSS custom properties for a demo theme (read by .demo-root and every component). */
export function themeVars(t: Theme): CSSProperties {
  return {
    "--d-bg": t.bg, "--d-panel": t.panel, "--d-panel2": t.panel2, "--d-line": t.line, "--d-text": t.text, "--d-muted": t.muted,
    "--d-accent": t.accent, "--d-on-accent": t.onAccent, "--d-header": t.header, "--d-on-header": t.onHeader,
    "--d-good": t.good, "--d-bad": t.bad, "--d-warn": t.warn, "--d-info": t.info,
    ...Object.fromEntries(t.chart.map((c, i) => [`--d-c${i + 1}`, c])),
  } as CSSProperties;
}

/** Typography/shape overrides; empty when a demo uses the defaults. */
export function lookVars(l: Look | undefined): CSSProperties {
  if (!l) return {};
  const v: Record<string, string> = {};
  if (l.displayWeight) v["--d-display-weight"] = String(l.displayWeight);
  if (l.displayTracking) v["--d-display-tracking"] = l.displayTracking;
  if (l.wordmarkWeight) v["--d-wordmark-weight"] = String(l.wordmarkWeight);
  if (l.wordmarkTracking) v["--d-wordmark-tracking"] = l.wordmarkTracking;
  if (l.radius) v["--d-radius"] = l.radius;
  if (l.shadow) v["--d-shadow"] = l.shadow;
  if (l.fonts === "shop") {
    v["--font-demo-display"] = "var(--font-shop-display)";
    v["--font-demo-body"] = "var(--font-shop-body)";
    v["--font-demo-mono"] = "var(--font-shop-body)";
  }
  return v as CSSProperties;
}
