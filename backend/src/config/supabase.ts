import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables! Check SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_ANON_KEY');
}

// Admin client - uses service role key, bypasses RLS
// Use only on backend/server side, NEVER expose to client
export const supabaseAdmin = createClient(supabaseUrl as string, supabaseServiceKey as string, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Public client - uses anon key, respects RLS policies
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export default supabaseAdmin;
