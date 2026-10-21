import type { DemoMeta } from "@demos/kit/types";
import { sweetgrass as cfg } from "./config";

export const meta: DemoMeta = {
  title: `${cfg.company.appName} · ${cfg.company.name}`,
  description: `Concept demo prepared for ${cfg.company.name} by Rose Revenue. Sample data: all names, numbers and records are fictional.`,
  og: {
    headline: "Run the whole farm from one place.",
    sub: "Herd and pasture, eggs and milk, customers, herdshare and the farm store, in one concept app.",
    bg: cfg.theme.header,
    fg: cfg.theme.onHeader,
    accent: "#fcf09a",
    mark: "grass",
  },
};
