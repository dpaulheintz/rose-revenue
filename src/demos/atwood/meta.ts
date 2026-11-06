import type { DemoMeta } from "../kit/types";
import { atwood as cfg } from "./config";

export const meta: DemoMeta = {
  title: "Atwood Door Co.",
  description: "The whole back office for a one-truck garage door business, on your phone. Concept demo for Atwood Door Company by Rose Revenue. Sample data: all records are fictional.",
  og: {
    headline: "Your whole back office, in the truck.",
    sub: "Today's route, estimates, invoices, payments, reviews and tune-up reminders. Built for one guy and a phone.",
    bg: cfg.theme.header,
    fg: cfg.theme.onHeader,
    accent: "#35979b",
    noMark: true,
    font: { family: "Montserrat", weight: 800 },
  },
  app: { name: "Atwood Door", icon: "/demos/atwood/apple-touch-icon.png" },
};
