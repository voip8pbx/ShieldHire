const { Client } = require('pg');
const dns = require('dns');

// Force IPv4 lookup
dns.setDefaultResultOrder('ipv4first');

const password = 'q8NW0vCKkEngqU8L';
const projectId = 'yoshgwtufyjjfqittrhb';

async function run() {
  const host = 'aws-0-ap-south-1.pooler.supabase.com';
  // Try port 5432 (session mode pooler)
  const connStr = `postgresql://postgres.${projectId}:${password}@${host}:5432/postgres`;
  
  console.log(`Connecting to ${host}:5432...`);
  const client = new Client({
    connectionString: connStr,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS! Connected to pooler on port 5432`);
    await client.end();
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
  }
}

run();
