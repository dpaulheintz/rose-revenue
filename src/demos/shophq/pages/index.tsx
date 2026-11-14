"use client";

// Shop HQ screens and shell, with this prospect plugged in.
import type { ReactNode } from "react";
import { ShopData } from "@demos/templates/shop-hq/client";
import { prospect } from "../prospect";

export { Screen, Shell } from "@demos/templates/shop-hq/client";

export function Data({ anchor, children }: { anchor: string; children: ReactNode }) {
  return <ShopData prospect={prospect} anchor={anchor}>{children}</ShopData>;
}
