import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /demo holds private, link-only sales demos for prospects.
    rules: { userAgent: "*", allow: "/", disallow: "/demo" },
  };
}
