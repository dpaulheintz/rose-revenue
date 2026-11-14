import type { DemoMeta } from "../../kit/types";
import type { ShopProspect } from "./types";

export function shopHqMeta(p: ShopProspect): DemoMeta {
  return {
    title: `${p.name}: Shop HQ`,
    description: `The whole shop on one phone: today's crews, calls and leads, what needs you, plans and money. A sample built for ${p.name} by Rose Revenue. Sample data.`,
    og: { headline: "Your whole shop, on your phone.", sub: "Crews, calls, unpaid invoices, plan renewals and cash, built around how you run.", bg: p.colors.ink, fg: "#f5f7f9", accent: p.colors.second ?? p.colors.accent, noMark: !p.logo, logo: p.logo, font: { family: "Bricolage Grotesque", weight: 800 } },
  };
}
