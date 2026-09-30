import type { DemoConfig } from "./types";
import { ironwolf } from "./ironwolf/config";

// Each prospect demo is one config. The next prospect = a new file here.
const DEMOS: Record<string, DemoConfig> = { ironwolf };

export const demoSlugs = Object.keys(DEMOS);
export const getDemo = (slug: string): DemoConfig | null => DEMOS[slug] ?? null;
