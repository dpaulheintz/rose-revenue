// Shared by the prospect templates (templates/*): the fields every prospect
// config has, and how they become a theme and the template's standard copy.
// Plain data only (next.config imports this through src/demos/index.ts).

import type { Theme } from "../types";

export type ProspectBase = {
  slug: string; // URL: /demo/<slug>, short link /<slug>
  name: string; // company name as they write it
  wordmark: [string, string]; // typeset wordmark: name line, small second line
  place: string; // "Columbus, Ohio"
  phone: string; // phone shown in the app (555-01XX)
  logo?: string; // optional public path to a logo they supplied
  colors: {
    accent: string; // buttons and highlights; must read on white (4.5:1)
    ink: string; // text and the dark header
    second?: string; // a second brand color for charts
  };
};

/** A light theme from two brand colors. */
export function prospectTheme(c: ProspectBase["colors"]): Theme {
  return {
    bg: "#f3f5f7",
    panel: "#ffffff",
    panel2: "#edf0f3",
    line: "#dce1e6",
    text: c.ink,
    muted: "#55606b",
    accent: c.accent,
    onAccent: "#ffffff",
    header: c.ink,
    onHeader: "#f5f7f9",
    good: "#1f7a4a",
    bad: "#b3372f",
    warn: "#8a5a00",
    info: c.accent,
    chart: [c.accent, c.second ?? "#d9531e", "#6b7884", "#1f7a4a", "#b88a2b", "#7a5aa6"],
  };
}

/** The same words on every template. */
export const PROSPECT_COPY = {
  ribbon: "This is sample data. Yours would be the real thing.",
  toast: "Demo mode. In your version this saves and updates everything connected to it.",
  footer: "Prepared by Rose Revenue. Your tools, your data.",
};
