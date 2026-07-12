const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Running RPC exec_sql...');
  const sqlQuery = `
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gallery_image_1" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gallery_image_2" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gallery_image_3" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gallery_image_4" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gun_license_url" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "professional_description" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "languages" TEXT[];
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "height" FLOAT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "weight" FLOAT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "blood_group" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "emergency_contact" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "updated_by_admin" TEXT;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "last_admin_update" TIMESTAMPTZ;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "gallery_updated_at" TIMESTAMPTZ;
    ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "license_updated_at" TIMESTAMPTZ;
  `;

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlQuery
    });
    
    if (error) {
       console.log('Error executing via sql_query, trying sql arg...');
       const { data: data2, error: err2 } = await supabaseAdmin.rpc('exec_sql', { sql: sqlQuery });
       if (err2) throw err2;
       console.log('Success!', data2);
    } else {
       console.log('Success!', data);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

run();
