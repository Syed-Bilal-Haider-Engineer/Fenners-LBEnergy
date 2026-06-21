import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace/watch root to this client folder. Without this Next infers
  // the monorepo root (a stray root package-lock.json) and watches data/, outputs/,
  // and Python caches — every file touch then triggers a recompile + reload loop.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
