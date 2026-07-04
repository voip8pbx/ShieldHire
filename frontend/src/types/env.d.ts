/**
 * TypeScript declarations for variables imported from '@env'.
 * These are injected by react-native-dotenv at Metro bundle time
 * from frontend/.env — no native module is involved.
 *
 * Add a new entry here whenever you add a new key to frontend/.env.
 */
declare module '@env' {
    export const GOOGLE_MAPS_API_KEY: string;
    export const SUPABASE_URL: string;
    export const SUPABASE_ANON_KEY: string;
    export const PORT: string;
}
