import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory to avoid monorepo lockfile confusion
  outputFileTracingRoot: path.join(__dirname, "./"),
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
