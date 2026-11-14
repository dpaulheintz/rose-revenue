// EVERYTHING ABOUT THIS PROSPECT LIVES HERE. Copy this folder to a new slug,
// edit these values, register the slug (see templates/project-hq/README.md).
// Default prospect: Ridgeline Mechanical is fictional. All records are invented.

import type { ProjectProspect } from "../templates/project-hq/types";

export const prospect: ProjectProspect = {
  slug: "projecthq",
  name: "Ridgeline Mechanical",
  wordmark: ["Ridgeline", "Mechanical Contractors"],
  place: "Columbus, Ohio",
  phone: "(614) 555-0163",
  colors: { accent: "#9c4518", ink: "#1d262b", second: "#3f7d8c" },
  trade: "Mechanical",
  projectTypes: [
    { type: "Healthcare", share: 0.28 },
    { type: "Education", share: 0.24 },
    { type: "Industrial", share: 0.2 },
    { type: "Office", share: 0.18 },
    { type: "Lab and research", share: 0.1 },
  ],
  pms: ["Dana Whitfield", "Greg Sauer", "Monica Reyes", "Brian Tolle"],
  gcs: ["Granite Peak Builders", "Oakline Construction", "Three Forks General Contractors", "Stonebridge Building Group", "Meridian Way Builders"],
  contractRange: [250_000, 8_000_000],
  activeProjects: 18,
  laborRate: 72,
  crews: [
    { name: "Pipefitters", size: 18 },
    { name: "Sheet metal", size: 14 },
    { name: "Plumbers", size: 10 },
    { name: "Controls", size: 6 },
    { name: "Service techs", size: 8 },
    { name: "Apprentices and helpers", size: 6 },
  ],
  serviceAgreements: 45,
  connects: "the estimating, accounting and scheduling software you already use",
};
