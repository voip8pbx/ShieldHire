const { Client } = require('pg');

async function run() {
  const host = '2406:da14:271:9922:6a59:f03d:2f1d:4d6b';
  console.log(`Trying direct IPv6 connection to [${host}]...`);
  
  const client = new Client({
    host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'q8NW0vCKkEngqU8L',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n🎉 CONNECTED SUCCESSFULLY via IPv6!`);
    
    console.log('Running migration queries...');
    await client.query(`
      ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "identity_verified" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "aadhaar_last_4" TEXT;
      ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "liveness_verified_at" TIMESTAMPTZ;
    `);

    console.log('Migration completed successfully!');
    await client.end();
  } catch (error) {
    console.error(`IPv6 connection failed:`, error.message);
  }
}

run();
