// Builds a demo config from a Shop HQ prospect. Relative imports only: this is
// read by next.config through src/demos/index.ts.

import type { DemoConfig } from "../../kit/types";
import { PROSPECT_COPY, prospectTheme } from "../../kit/data/prospect";
import type { ShopProspect } from "./types";

export function shopHqConfig(p: ShopProspect): DemoConfig {
  const theme = prospectTheme(p.colors);
  return {
    slug: p.slug,
    seed: 0x5409,
    timeZone: "America/New_York",
    company: { name: p.name, wordmark: p.wordmark, appName: "Shop HQ", place: p.place },
    theme,
    look: { themeColor: p.colors.ink, displayWeight: 800, displayTracking: "-0.015em", wordmarkWeight: 800, wordmarkTracking: "0.02em", radius: "14px", shadow: "none", bodySize: "16px", viewportFit: "cover" },
    brand: p.logo ? { logo: p.logo, logoAlt: p.name } : { typeOnly: true },
    copy: PROSPECT_COPY,
    modules: [
      { key: "today", label: "Today", icon: "sun", path: "today", phone: true },
      { key: "leads", label: "Calls & Leads", short: "Leads", icon: "phone", path: "leads", phone: true },
      { key: "needs", label: "Needs You", icon: "alert", path: "needs-you", phone: true },
      { key: "money", label: "Money", icon: "dollar", path: "money", phone: true },
      { key: "plans", label: "Maintenance Plans", short: "Plans", icon: "shield", path: "plans" },
      { key: "techs", label: "Tech Scorecard", short: "Techs", icon: "chart", path: "techs" },
    ],
  };
}
