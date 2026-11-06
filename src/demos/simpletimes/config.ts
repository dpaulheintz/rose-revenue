// Simple Times, LLC (Gahanna, Ohio): concept demo. Look follows
// simpletimesmixers.com: Bayon headings, Roboto Slab text, white and ink with
// the shop's coral (deepened for button contrast) and a berry for Syrup Project.
// Each lane brings its own accent: Brands coral, Co-Packing the site's blue, Company ink.

import type { DemoConfig } from "../kit/types";

export const simpletimes: DemoConfig = {
  slug: "simpletimes",
  seed: 0x5717e5,
  timeZone: "America/New_York",
  company: { name: "Simple Times", wordmark: ["Simple Times", "Gahanna, Ohio"], appName: "Company HQ", place: "Gahanna, Ohio" },
  theme: {
    bg: "#f4f4f2",
    panel: "#ffffff",
    panel2: "#efeeeb",
    line: "#e0ddd8",
    text: "#231f20",
    muted: "#5c5657",
    accent: "#c2403f",
    onAccent: "#ffffff",
    header: "#231f20",
    onHeader: "#f4f4f2",
    good: "#2a6b3c",
    bad: "#b8393a",
    warn: "#8a5a00",
    info: "#2671a4",
    chart: ["#da5856", "#923a4c", "#2671a4", "#cecb00", "#5c5657", "#2a6b3c"],
  },
  look: { themeColor: "#231f20", displayWeight: 400, displayTracking: "0.01em", wordmarkWeight: 400, wordmarkTracking: "0.06em", radius: "12px", shadow: "none", bodySize: "16px", viewportFit: "cover" },
  brand: { typeOnly: true, preparedBy: false },
  copy: {
    ribbon: "Sample data. Concept demo for Simple Times by Rose Revenue. All records fictional.",
    toast: "Demo mode. In your system this saves and updates everything connected to it.",
    footer: "Concept demo by Rose Revenue. Your tools, your data.",
  },
  lanes: [
    { key: "brands", label: "Brands", color: "#c2403f" },
    { key: "copack", label: "Co-Packing", color: "#2671a4" },
    { key: "company", label: "Company", color: "#231f20" },
  ],
  modules: [
    { key: "brands", lane: "brands", label: "Home", icon: "home", path: "brands", phone: true },
    { key: "accounts", lane: "brands", label: "Accounts", icon: "users", path: "accounts", phone: true },
    { key: "sales", lane: "brands", label: "Sales", icon: "chart", path: "sales", phone: true },
    { key: "calendar", lane: "brands", label: "Calendar", icon: "calendar", path: "calendar", phone: true },
    { key: "tastings", lane: "brands", label: "Tastings", icon: "drop", path: "tastings", phone: true },
    { key: "copack", lane: "copack", label: "Home", icon: "home", path: "copack", phone: true },
    { key: "pipeline", lane: "copack", label: "Pipeline", icon: "board", path: "pipeline", phone: true },
    { key: "runs", lane: "copack", label: "Runs", icon: "flask", path: "runs", phone: true },
    { key: "inventory", lane: "copack", label: "Inventory", icon: "box", path: "inventory", phone: true },
    { key: "quotes", lane: "copack", label: "Quotes", icon: "receipt", path: "quotes", phone: true },
    { key: "client", lane: "copack", label: "Client view", icon: "eye", path: "client-view" },
    { key: "overview", lane: "company", label: "Overview", icon: "home", path: "overview", phone: true },
    { key: "scorecard", lane: "company", label: "Scorecard", icon: "clipboard", path: "scorecard", phone: true },
  ],
};
