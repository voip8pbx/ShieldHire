import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase URL or Service Key is missing for Admin client');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder-to-prevent-crash-if-missing');
