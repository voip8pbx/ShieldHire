const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Force IPv4 lookup for HTTPS calls as well
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://yoshgwtufyjjfqittrhb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Running RPC exec_sql for bookings migration...');
  const sqlQuery = `
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transaction_id" TEXT;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING';
  `;

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlQuery
    });
    
    if (error) {
       console.log('⚠️ Error executing via sql_query parameter, trying sql parameter...', error.message);
       const { data: data2, error: err2 } = await supabaseAdmin.rpc('exec_sql', { sql: sqlQuery });
       if (err2) {
         console.error('❌ Failed via both sql_query and sql parameters:', err2.message);
         throw err2;
       }
       console.log('✅ Success via sql parameter!', data2);
    } else {
       console.log('✅ Success via sql_query parameter!', data);
    }
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
