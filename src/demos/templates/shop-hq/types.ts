// What a Shop HQ prospect config holds. Everything company-specific lives in
// src/demos/<slug>/prospect.ts; the generator and every screen read from it.

import type { ProspectBase } from "../../kit/data/prospect";

export type Trade = "HVAC" | "Plumbing";
export type ShopProspect = ProspectBase & {
  towns: string[]; // service area towns (real towns are fine; streets and people are invented)
  trades: Trade[]; // HVAC, Plumbing, or both
  services: Array<{ name: string; trade: Trade; kind: "Service" | "Repair" | "Install" | "Tune-up"; ticket: [number, number] }>; // what they sell and the usual ticket range
  crew: Array<{ name: string; role: string; trade: Trade; install?: boolean }>; // techs, plus install crew (install: true)
  plans: Array<{ name: string; price: number; visits: number }>; // maintenance plans, yearly price
  leadSources: Array<{ name: string; share: number }>; // where calls come from
  members: number; // active maintenance plan members, roughly
  connects: string; // what the real version would hook into, for the note on Today
};
