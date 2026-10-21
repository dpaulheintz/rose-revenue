// Server-side demo registry: for each slug, its config, metadata, fonts, data
// provider and screens. To add a demo, build src/demos/<slug>/ and add one line.

import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { DemoConfig, DemoMeta } from "./kit/types";
import { getConfig } from "./index";
import * as act2Fonts from "./act2/fonts";
import { meta as act2Meta } from "./act2/meta";
import * as act2Client from "./act2/pages";
import { fontClass as sweetgrassFonts } from "./sweetgrass/fonts";
import { meta as sweetgrassMeta } from "./sweetgrass/meta";
import * as sweetgrassClient from "./sweetgrass/pages";

export type Registered = {
  config: DemoConfig;
  meta: DemoMeta;
  fontClass: string; // next/font variable classes
  fontVars?: CSSProperties; // maps the kit's font roles onto this demo's fonts
  Provider: ComponentType<{ anchor: string; children: ReactNode }>; // the demo's own data + state (lazy)
  Screen: ComponentType<{ id: string }>; // renders one screen by config.modules[].key (lazy)
};

const entries: Record<string, Omit<Registered, "config">> = {
  sweetgrass: { meta: sweetgrassMeta, fontClass: sweetgrassFonts, Provider: sweetgrassClient.Data, Screen: sweetgrassClient.Screen },
  act2: { meta: act2Meta, fontClass: act2Fonts.fontClass, fontVars: act2Fonts.fontVars as CSSProperties, Provider: act2Client.Data, Screen: act2Client.Screen },
};

export function getRegistered(slug: string): Registered | null {
  const config = getConfig(slug);
  const e = entries[slug];
  return config && e ? { config, ...e } : null;
}

export const registeredSlugs = Object.keys(entries);
