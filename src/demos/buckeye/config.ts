// Buckeye Precision Machining: fictional. Names, colors and nav words come from
// industry.ts so that one file changes what kind of shop this is.

import type { DemoConfig } from "../kit/types";
import { industry as ind } from "./industry";

const v = ind.vocab;

export const buckeye: DemoConfig = {
  slug: "buckeye",
  seed: 0xb0c4e7,
  timeZone: "America/New_York",
  company: { name: ind.company.name, wordmark: ind.company.wordmark, appName: v.app, place: ind.company.place },
  theme: {
    bg: ind.brand.bg,
    panel: "#ffffff",
    panel2: "#f1f3f4",
    line: "#d3d8db",
    text: "#14181b",
    muted: "#525a61",
    accent: ind.brand.accent,
    onAccent: "#ffffff",
    header: ind.brand.header,
    onHeader: "#f3f5f6",
    good: "#17784a",
    bad: "#b5302a",
    warn: "#9a6500",
    info: "#17689c",
    chart: [ind.brand.accent, "#6f7a83", "#17784a", "#c98a00", "#b5302a", "#17689c"],
  },
  look: { themeColor: ind.brand.header, displayWeight: 600, displayTracking: "0.005em", wordmarkWeight: 600, wordmarkTracking: "0.02em", radius: "6px", shadow: "0 1px 0 rgb(20 24 27 / 0.05)" },
  brand: { mark: ind.brand.mark, markColor: ind.brand.highlight, preparedBy: false },
  copy: {
    ribbon: "Sample data. Concept demo by Rose Revenue. All names, numbers and records are fictional.",
    toast: "Demo mode. In your system this saves and updates everything connected to it.",
    footer: "Built by Rose Revenue · Your tools, your data.",
  },
  modules: [
    { key: "dashboard", label: "Dashboard", short: "Home", icon: "home", path: "dashboard", phone: true },
    { key: "jobs", label: v.JobsNav, short: v.Jobs, icon: "hammer", path: "jobs", phone: true },
    { key: "quotes", label: "Quotes", icon: "dollar", path: "quotes", phone: true },
    { key: "inventory", label: "Inventory & Purchasing", short: "Inventory", icon: "box", path: "inventory" },
    { key: "quality", label: "Quality & Traceability", short: "Quality", icon: "shield", path: "quality", phone: true },
    { key: "customers", label: "Customers", icon: "users", path: "customers" },
    { key: "maintenance", label: v.MachinesNav, short: "Maintenance", icon: "wrench", path: "maintenance" },
    { key: "scorecard", label: "Weekly Scorecard", short: "Scorecard", icon: "chart", path: "scorecard" },
    { key: "ask", label: v.ask, icon: "chat", path: "ask" },
  ],
  vocab: v,
};
