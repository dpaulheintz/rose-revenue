// Every registered demo's config: plain data only, safe to import anywhere
// (next.config.ts reads it for the /<slug> short links). The server-side
// wiring (screens, data provider, fonts, meta) lives in ./registry.ts.

import type { DemoConfig, DemoMeta } from "./kit/types";
import { act2 } from "./act2/config";
import { meta as act2Meta } from "./act2/meta";
import { buckeye } from "./buckeye/config";
import { meta as buckeyeMeta } from "./buckeye/meta";
import { sweetgrass } from "./sweetgrass/config";
import { meta as sweetgrassMeta } from "./sweetgrass/meta";

export const DEMOS: DemoConfig[] = [sweetgrass, act2, buckeye];
export const demoSlugs = DEMOS.map((d) => d.slug);
export const getConfig = (slug: string) => DEMOS.find((d) => d.slug === slug) ?? null;

const METAS: Record<string, DemoMeta> = { sweetgrass: sweetgrassMeta, act2: act2Meta, buckeye: buckeyeMeta };
export const getMeta = (slug: string): DemoMeta | null => METAS[slug] ?? null;
