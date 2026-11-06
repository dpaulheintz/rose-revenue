import type { DemoMeta } from "../kit/types";
import { simpletimes as cfg } from "./config";

export const meta: DemoMeta = {
  title: "Simple Times",
  description: "Brands and co-packing, run from one place on your phone. Concept demo for Simple Times by Rose Revenue. Sample data: all records are fictional.",
  og: {
    headline: "Both sides of Simple Times, in your pocket.",
    sub: "Accounts, tastings and sales for the brands. Runs, inventory and quotes for co-packing. One system you own.",
    bg: cfg.theme.header,
    fg: cfg.theme.onHeader,
    accent: "#da5856",
    noMark: true,
    font: { family: "Bayon", weight: 400 },
  },
  app: { name: "Simple Times", icon: "/demos/simpletimes/apple-touch-icon.png" },
};
