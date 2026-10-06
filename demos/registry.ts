import type { DemoConfig } from "./types";

const DEMOS: Record<string, DemoConfig> = {};

export const demoSlugs = Object.keys(DEMOS);
export const getDemo = (slug: string): DemoConfig | null => DEMOS[slug] ?? null;
