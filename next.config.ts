import type { NextConfig } from "next";
import { demoSlugs } from "./src/demos";

const nextConfig: NextConfig = {
  // Short links Paul can text: /<slug> → /demo/<slug>, for every registered demo.
  async redirects() {
    return demoSlugs.map((slug) => ({ source: `/${slug}`, destination: `/demo/${slug}`, permanent: true }));
  },
};

export default nextConfig;
