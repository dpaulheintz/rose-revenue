import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Short link Paul can text: /act2 → the Act 2 Mechanical demo.
  async redirects() {
    return [{ source: "/act2", destination: "/demo/act2", permanent: true }];
  },
};

export default nextConfig;
