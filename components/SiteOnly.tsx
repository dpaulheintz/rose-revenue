"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders marketing-site-only extras (grain overlay, analytics) everywhere
 * except /demo, which is a self-contained sales demo that must make no
 * tracking or other network requests beyond its fonts.
 */
export default function SiteOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/demo")) return null;
  return children;
}
