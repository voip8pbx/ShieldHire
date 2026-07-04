const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Testing RPC exec_sql...');
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "identity_verified" BOOLEAN DEFAULT FALSE;'
    });
    if (error) throw error;
    console.log('Success!', data);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

run();
