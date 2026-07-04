/**
 * Centralised environment config for the React Native frontend.
 *
 * Keys are defined in:
 *   - Root source of truth  : d:\.React\HomeGymTrainer\.env
 *   - RN bundle-time copy   : d:\.React\HomeGymTrainer\frontend\.env  (read by react-native-dotenv)
 *
 * react-native-dotenv injects values from frontend/.env at Metro bundle time
 * via a Babel plugin — no native module, works with RN 0.76 bridgeless/new architecture.
 *
 * DEV networking: uses `adb reverse tcp:5000 tcp:5000` so the device tunnels
 * all API calls through USB to the PC's local backend.
 * Run once per session: `adb reverse tcp:5000 tcp:5000`
 */

import { GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, PORT } from '@env';

export const ENV = {
    // API Configurations
    API_PORT: PORT || '5000',
    DEV_BASE_URL: `http://localhost:${PORT || '5000'}`,
    PROD_BASE_URL: 'https://shield-hire-znyu.vercel.app',

    // Google Services — injected from frontend/.env at bundle time
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY ?? '',

    // Supabase — injected from frontend/.env at bundle time
    SUPABASE_URL: SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ?? '',
};
