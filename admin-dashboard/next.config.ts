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
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL as string,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  },
  reactCompiler: true,
};

export default nextConfig;
