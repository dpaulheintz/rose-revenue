import type { DemoMeta } from "@demos/kit/types";
import { act2 as cfg } from "./config";

export const meta: DemoMeta = {
  title: `${cfg.company.appName} · ${cfg.company.name}`,
  description: `Concept demo prepared for ${cfg.company.name} by Rose Revenue. Sample data: all names, numbers and records are fictional.`,
  og: {
    headline: "Jobs, crews and the money, in your pocket.",
    sub: "Estimates, invoices, scheduling, job costing and the customer portal, in one concept app.",
    bg: cfg.theme.bg,
    fg: cfg.theme.text,
    accent: cfg.theme.accent,
    logo: "/demos/act2/logo.png",
  },
};
