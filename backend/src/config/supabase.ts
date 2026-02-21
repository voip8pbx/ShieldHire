import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yoshgwtufyjjfqittrhb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Admin client - uses service role key, bypasses RLS
// Use only on backend/server side, NEVER expose to client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Public client - uses anon key, respects RLS policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseAdmin;
