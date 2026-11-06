// Server-side demo registry: for each slug, its config, metadata, fonts, data
// provider and screens. To add a demo, build src/demos/<slug>/ and add one line.

import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { DemoConfig, DemoMeta } from "./kit/types";
import { getConfig, getMeta } from "./index";
import * as atwoodFonts from "./atwood/fonts";
import * as atwoodClient from "./atwood/pages";
import * as act2Fonts from "./act2/fonts";
import * as act2Client from "./act2/pages";
import * as buckeyeFonts from "./buckeye/fonts";
import * as buckeyeClient from "./buckeye/pages";
import * as simpletimesFonts from "./simpletimes/fonts";
import * as simpletimesClient from "./simpletimes/pages";
import { fontClass as sweetgrassFonts } from "./sweetgrass/fonts";
import * as sweetgrassClient from "./sweetgrass/pages";

export type Registered = {
  config: DemoConfig;
  meta: DemoMeta;
  fontClass: string; // next/font variable classes
  fontVars?: CSSProperties; // maps the kit's font roles onto this demo's fonts
  Provider: ComponentType<{ anchor: string; children: ReactNode }>; // the demo's own data + state (lazy)
  Screen: ComponentType<{ id: string }>; // renders one screen by config.modules[].key (lazy)
  Shell?: ComponentType<{ children: ReactNode }>; // optional custom shell (e.g. one built on kit/shell/LaneShell); default DemoShell
};

const entries: Record<string, Omit<Registered, "config" | "meta">> = {
  sweetgrass: { fontClass: sweetgrassFonts, Provider: sweetgrassClient.Data, Screen: sweetgrassClient.Screen },
  act2: { fontClass: act2Fonts.fontClass, fontVars: act2Fonts.fontVars as CSSProperties, Provider: act2Client.Data, Screen: act2Client.Screen },
  buckeye: { fontClass: buckeyeFonts.fontClass, fontVars: buckeyeFonts.fontVars as CSSProperties, Provider: buckeyeClient.Data, Screen: buckeyeClient.Screen },
  simpletimes: { fontClass: simpletimesFonts.fontClass, fontVars: simpletimesFonts.fontVars as CSSProperties, Provider: simpletimesClient.Data, Screen: simpletimesClient.Screen, Shell: simpletimesClient.Shell },
  atwood: { fontClass: atwoodFonts.fontClass, fontVars: atwoodFonts.fontVars as CSSProperties, Provider: atwoodClient.Data, Screen: atwoodClient.Screen, Shell: atwoodClient.Shell },
};

export function getRegistered(slug: string): Registered | null {
  const config = getConfig(slug);
  const e = entries[slug];
  return config && e ? { config, meta: getMeta(slug)!, ...e } : null;
}

export const registeredSlugs = Object.keys(entries);
