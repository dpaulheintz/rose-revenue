// Sweet Grass Dairy (Fredericktown, OH): concept demo. Brand colors and type
// are read from the farm's own sites (GrazeCart theme: pasture green #4d723c
// with butter #fcf09a; Aleo headings on the main site, Open Sans body on the
// store). No logo or photos: a typeset wordmark plus a generic grass mark.

import type { DemoConfig } from "../types";

export const sweetgrass: DemoConfig = {
  kind: "farm",
  slug: "sweetgrass",
  seed: 0x5a2013,
  timeZone: "America/New_York",
  company: {
    name: "Sweet Grass Dairy",
    wordmark: ["Sweet Grass", "Dairy · Fredericktown, OH"],
    appName: "Farm HQ",
    place: "Fredericktown, Ohio",
  },
  theme: {
    bg: "#f3eee2",
    panel: "#fffdf7",
    panel2: "#efe8d8",
    line: "#ddd4c0",
    text: "#22301e",
    muted: "#5a6150",
    accent: "#4d723c",
    onAccent: "#fcf09a",
    header: "#263421",
    onHeader: "#f4efdf",
    good: "#2d7a4c",
    bad: "#a3392a",
    warn: "#875a00",
    info: "#2f6585",
    chart: ["#4d723c", "#c9a227", "#7b5636", "#5f8fa8", "#a3392a", "#93a86a", "#3a4a35"],
  },
  copy: {
    ribbon: "Sample data. Concept demo built for Sweet Grass Dairy by Rose Revenue. All names, numbers and records are fictional.",
    toast: "Demo mode. In the real system this saves and updates everything connected to it.",
    footer: "Concept demo. All names, numbers and records are fictional.",
  },
  modules: [
    { key: "overview", label: "Today", icon: "sun", path: "overview", phone: true, blurb: "Chores, orders to pack, alerts and the herd's paddock." },
    { key: "customers", label: "Customers", icon: "users", path: "customers", phone: true, blurb: "Every customer, herdshare owner and wholesale account." },
    { key: "sales", label: "Sales", icon: "chart", path: "sales", blurb: "Revenue by channel, best sellers, profit by enterprise." },
    { key: "inventory", label: "Inventory", icon: "box", path: "inventory", blurb: "On hand vs. par, sold-out waitlists, incoming batches." },
    { key: "herd", label: "Herd & Pasture", short: "Herd", icon: "cow", path: "herd", phone: true, blurb: "Paddock rotation, milk, calving and finishing." },
    { key: "poultry", label: "Poultry & Eggs", short: "Eggs", icon: "egg", path: "poultry", phone: true, blurb: "Lay rate, broiler batches and turkey pre-orders." },
    { key: "production", label: "Production", icon: "flask", path: "production", blurb: "Cheese aging, milk tests, sanitation, sourdough, lots." },
    { key: "delivery", label: "Delivery", icon: "truck", path: "delivery", blurb: "This week's routes, stops, pack lists and cold packs." },
    { key: "maintenance", label: "Maintenance", icon: "wrench", path: "maintenance", blurb: "Equipment schedule, overdue service and repair costs." },
    { key: "projects", label: "Projects", icon: "board", path: "projects", blurb: "Barn conversion, bundles, turkeys, daily chores." },
    { key: "ask", label: "Ask the Farm", icon: "chat", path: "ask", blurb: "Concept: ask questions of your own data." },
  ],
};
