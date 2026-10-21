import type { FarmSeed } from "@/lib/demo/farm/types";
import type { ShopSeed } from "@/lib/demo/shop/types";
import type { DemoConfig } from "./types";
import { act2 } from "./act2/config";
import { act2Seed } from "./act2/seed";
import { sweetgrass } from "./sweetgrass/config";
import { sweetgrassSeed } from "./sweetgrass/seed";

const DEMOS: Record<string, DemoConfig> = { sweetgrass, act2 };
const FARMS: Record<string, FarmSeed> = { sweetgrass: sweetgrassSeed };
const SHOPS: Record<string, ShopSeed> = { act2: act2Seed };

export const demoSlugs = Object.keys(DEMOS);
export const getDemo = (slug: string): DemoConfig | null => DEMOS[slug] ?? null;
export const getFarmSeed = (slug: string): FarmSeed | null => FARMS[slug] ?? null;
export const getShopSeed = (slug: string): ShopSeed | null => SHOPS[slug] ?? null;
