// What a Project HQ prospect config holds. Everything company-specific lives in
// src/demos/<slug>/prospect.ts; the generator and every screen read from it.

import type { ProspectBase } from "../../kit/data/prospect";

export type ProjectProspect = ProspectBase & {
  trade: "Mechanical" | "Plumbing" | "Electrical";
  projectTypes: Array<{ type: string; share: number }>; // the markets they build in
  pms: string[]; // project managers
  gcs: string[]; // general contractors they work under (invent these)
  contractRange: [number, number]; // smallest and largest contract
  activeProjects: number; // roughly how many jobs are going at once
  laborRate: number; // blended field labor cost, $/hour
  crews: Array<{ name: string; size: number }>; // crew types and headcount (about 60 in all)
  serviceAgreements: number; // maintenance agreements, roughly
  connects: string; // what the real version would hook into, for the dashboard note
};
