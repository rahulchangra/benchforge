import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Only use standalone output for Docker containers; Vercel bundles serverless functions natively
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.resolve(process.env.USERPROFILE || __dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
