import type { DemoMeta } from "../kit/types";
import { buckeye as cfg } from "./config";
import { industry as ind } from "./industry";

export const meta: DemoMeta = {
  title: cfg.company.name,
  description: `${ind.copy.description} Concept demo by Rose Revenue. Sample data: all names, numbers and records are fictional.`,
  og: {
    headline: ind.copy.ogHeadline,
    sub: ind.copy.ogSub,
    bg: cfg.theme.header,
    fg: cfg.theme.onHeader,
    accent: cfg.brand!.markColor!,
    mark: cfg.brand!.mark,
    font: { family: "Barlow Condensed", weight: 600 },
  },
};
