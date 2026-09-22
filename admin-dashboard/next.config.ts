import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // VERCEL DEPLOY NOTE:
  // If you set "Root Directory" = "admin-dashboard" in Vercel project settings
  // (recommended), keep this as "./" — __dirname will be the project root.
  // If deploying from the monorepo root, change to "../" so Vercel traces
  // node_modules from the workspace root.
  outputFileTracingRoot: path.join(__dirname, "./"),
  experimental: {
    reactCompiler: false,
  },
};

export default nextConfig;
