import type { NextConfig } from "next";
import { loadEnvConfig } from '@next/env';
import path from 'path';

try {
  loadEnvConfig(path.resolve(__dirname, '..'));
} catch (e) {
  console.warn('Could not load environment config from parent directory:', e);
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
