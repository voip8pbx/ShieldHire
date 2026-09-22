import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yoshgwtufyjjfqittrhb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc2hnd3R1ZnlqamZxaXR0cmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU1ODk5MywiZXhwIjoyMDg3MTM0OTkzfQ.AASg13lxDHmzl_giIKabuC3S3BjqIhHXVq5kGdsppuU';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc2hnd3R1ZnlqamZxaXR0cmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTg5OTMsImV4cCI6MjA4NzEzNDk5M30.9Q20Su-q-ODH-OGBqp3OyPoEDHDRRHW8sA3KtiAtbf8';

if (!process.env.SUPABASE_URL) {
    console.warn('⚠️ SUPABASE_URL not set in environment, using default configured URL');
}

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
