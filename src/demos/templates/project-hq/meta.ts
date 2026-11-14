import type { DemoMeta } from "../../kit/types";
import type { ProjectProspect } from "./types";

export function projectHqMeta(p: ProjectProspect): DemoMeta {
  return {
    title: `${p.name}: Project HQ`,
    description: `Every job's cost, billing, change orders and manpower on one screen. A sample built for ${p.name} by Rose Revenue. Sample data.`,
    og: { headline: "Every job, every dollar, one screen.", sub: "Budget vs. actual, change orders, pay apps and manpower, built around how you run.", bg: p.colors.ink, fg: "#f5f7f9", accent: p.colors.second ?? p.colors.accent, noMark: !p.logo, logo: p.logo, font: { family: "Manrope", weight: 800 } },
  };
}
