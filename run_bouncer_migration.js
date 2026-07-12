const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.yoshgwtufyjjfqittrhb:q8NW0vCKkEngqU8L@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  console.log(`Trying connection to pooler...`);
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n🎉 CONNECTED SUCCESSFULLY!`);
    
    console.log('Running migration queries...');
    await client.query(`
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
    `);

    console.log('Migration completed successfully!');
    await client.end();
  } catch (error) {
    console.error(`Connection failed:`, error.message);
  }
}

run();
