import type { FarmSeed } from "@/lib/demo/farm/types";
import type { DemoConfig } from "./types";
import { sweetgrass } from "./sweetgrass/config";
import { sweetgrassSeed } from "./sweetgrass/seed";

const DEMOS: Record<string, DemoConfig> = { sweetgrass };
const FARMS: Record<string, FarmSeed> = { sweetgrass: sweetgrassSeed };

export const demoSlugs = Object.keys(DEMOS);
export const getDemo = (slug: string): DemoConfig | null => DEMOS[slug] ?? null;
export const getFarmSeed = (slug: string): FarmSeed | null => FARMS[slug] ?? null;
