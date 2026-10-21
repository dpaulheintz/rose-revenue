// Every registered demo's config: plain data only, safe to import anywhere
// (next.config.ts reads it for the /<slug> short links). The server-side
// wiring (screens, data provider, fonts, meta) lives in ./registry.ts.

import type { DemoConfig } from "./kit/types";
import { act2 } from "./act2/config";
import { sweetgrass } from "./sweetgrass/config";

export const DEMOS: DemoConfig[] = [sweetgrass, act2];
export const demoSlugs = DEMOS.map((d) => d.slug);
export const getConfig = (slug: string) => DEMOS.find((d) => d.slug === slug) ?? null;
