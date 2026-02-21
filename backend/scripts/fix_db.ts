
import { createClient } from '@supabase/supabase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('Adding time column to bookings table...');

    // Supabase JS doesn't support raw SQL query directly for schema changes easily 
    // unless you use the postgres connection.
    // But we can try to use RPC if it exists, or just hope the table exists.

    // Actually, I can't run raw SQL via Supabase JS client easily.
    // I should use the pg library if I have DATABASE_URL.

    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "time" TEXT;');
    console.log('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPrice" DOUBLE PRECISION;');
}

run();
