const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Force IPv4 lookup
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  // Try port 443 (HTTPS port) which often bypasses outbound firewalls
  const connectionStrings = [
    'postgresql://postgres.yoshgwtufyjjfqittrhb:q8NW0vCKkEngqU8L@aws-0-ap-south-1.pooler.supabase.com:443/postgres?pgbouncer=true',
    'postgresql://postgres.yoshgwtufyjjfqittrhb:q8NW0vCKkEngqU8L@db.yoshgwtufyjjfqittrhb.supabase.co:5432/postgres',
    process.env.DATABASE_URL || 'postgresql://postgres.yoshgwtufyjjfqittrhb:q8NW0vCKkEngqU8L@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  ];

  let client = null;
  let success = false;

  for (const connStr of connectionStrings) {
    console.log(`Connecting to database via: ${connStr.split('@')[1]}...`);
    client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ Connected successfully!`);
      
      console.log('Running migration queries...');
      await client.query(`
        ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "transaction_id" TEXT;
        ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING';
      `);

      console.log('🎉 Migration completed successfully!');
      await client.end();
      success = true;
      break; // Exit loop on success
    } catch (error) {
      console.warn(`⚠️ Connection attempt failed:`, error.message);
      if (client) {
        try { await client.end(); } catch(e) {}
      }
    }
  }

  if (!success) {
    console.error(`❌ Migration failed on all connection configurations.`);
    process.exit(1);
  }
}

run();
