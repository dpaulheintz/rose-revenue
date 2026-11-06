// Atwood Door Company (Carroll, Ohio): concept demo. Look follows
// atwooddoorcompany.com: Montserrat headings, Mulish text, the site's deep teal
// on near-white. Typeset wordmark, no logo.

import type { DemoConfig } from "../kit/types";

export const atwood: DemoConfig = {
  slug: "atwood",
  seed: 0xa7d00e,
  timeZone: "America/New_York",
  company: { name: "Atwood Door Co.", wordmark: ["Atwood Door Co.", "Experience you can depend on"], appName: "Office", place: "Carroll, Ohio" },
  theme: {
    bg: "#f3f4f3",
    panel: "#ffffff",
    panel2: "#eceeed",
    line: "#d9dddc",
    text: "#242424",
    muted: "#555c5c",
    accent: "#266e71",
    onAccent: "#ffffff",
    header: "#0e4042",
    onHeader: "#f2f7f7",
    good: "#22704a",
    bad: "#b3372f",
    warn: "#8a5a00",
    info: "#266e71",
    chart: ["#266e71", "#35979b", "#0e4042", "#b88a2b", "#8a9a9a", "#b3372f"],
  },
  look: { themeColor: "#0e4042", displayWeight: 800, displayTracking: "-0.01em", wordmarkWeight: 800, wordmarkTracking: "0.06em", radius: "14px", shadow: "none", bodySize: "16px", viewportFit: "cover" },
  brand: { typeOnly: true, preparedBy: false },
  copy: {
    ribbon: "Sample data. Concept demo for Atwood Door Company by Rose Revenue. All records fictional.",
    toast: "Demo mode. In your system this saves and updates everything connected to it.",
    footer: "Concept demo by Rose Revenue. Your tools, your data.",
  },
  modules: [
    { key: "today", label: "Today", icon: "sun", path: "today", phone: true },
    { key: "jobs", label: "Jobs", icon: "calendar", path: "jobs", phone: true },
    { key: "customers", label: "Customers", icon: "users", path: "customers", phone: true },
    { key: "money", label: "Money", icon: "dollar", path: "money", phone: true },
    { key: "billing", label: "Estimates & invoices", short: "Billing", icon: "receipt", path: "billing" },
    { key: "reviews", label: "Reviews", icon: "spark", path: "reviews" },
    { key: "tuneups", label: "Tune-up reminders", short: "Tune-ups", icon: "clock", path: "tune-ups" },
    { key: "stock", label: "Truck stock", icon: "truck", path: "truck-stock" },
    { key: "view", label: "Customer view", icon: "eye", path: "customer-view" },
  ],
};
