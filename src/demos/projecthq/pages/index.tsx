"use client";

// Project HQ screens and shell, with this prospect plugged in.
import type { ReactNode } from "react";
import { ProjectData } from "@demos/templates/project-hq/client";
import { prospect } from "../prospect";

export { Screen, Shell } from "@demos/templates/project-hq/client";

export function Data({ anchor, children }: { anchor: string; children: ReactNode }) {
  return <ProjectData prospect={prospect} anchor={anchor}>{children}</ProjectData>;
}
