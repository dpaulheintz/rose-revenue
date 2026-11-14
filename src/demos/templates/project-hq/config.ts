// Builds a demo config from a Project HQ prospect. Relative imports only: this
// is read by next.config through src/demos/index.ts.

import type { DemoConfig } from "../../kit/types";
import { PROSPECT_COPY, prospectTheme } from "../../kit/data/prospect";
import type { ProjectProspect } from "./types";

export function projectHqConfig(p: ProjectProspect): DemoConfig {
  return {
    slug: p.slug,
    seed: 0x9a0e,
    timeZone: "America/New_York",
    company: { name: p.name, wordmark: p.wordmark, appName: "Project HQ", place: p.place },
    theme: prospectTheme(p.colors),
    look: { themeColor: p.colors.ink, displayWeight: 800, displayTracking: "-0.02em", wordmarkWeight: 800, wordmarkTracking: "0.03em", radius: "12px", shadow: "none", bodySize: "16px", viewportFit: "cover" },
    brand: p.logo ? { logo: p.logo, logoAlt: p.name } : { typeOnly: true },
    copy: PROSPECT_COPY,
    modules: [
      { key: "dashboard", label: "Owner Dashboard", short: "Dashboard", icon: "home", path: "dashboard", phone: true },
      { key: "projects", label: "Projects", icon: "board", path: "projects", phone: true },
      { key: "changes", label: "Change Orders", short: "COs", icon: "pen", path: "change-orders", phone: true },
      { key: "billing", label: "Billing", icon: "receipt", path: "billing", phone: true },
      { key: "labor", label: "Labor & Manpower", short: "Labor", icon: "users", path: "labor" },
      { key: "service", label: "Service Contracts", short: "Service", icon: "wrench", path: "service" },
    ],
  };
}
