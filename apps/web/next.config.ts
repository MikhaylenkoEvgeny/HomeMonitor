import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@homemonitor/ui", "@homemonitor/types"]
};

export default nextConfig;
