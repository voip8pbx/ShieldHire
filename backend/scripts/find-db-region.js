const { Client } = require('pg');
const dns = require('dns');

// Force IPv4 lookup
dns.setDefaultResultOrder('ipv4first');

const password = 'q8NW0vCKkEngqU8L';
const projectId = 'yoshgwtufyjjfqittrhb';

// Complete list of all Supabase regions
const regions = [
    'aws-0-ap-south-1',
    'aws-0-ap-southeast-1',
    'aws-0-ap-southeast-2',
    'aws-0-ap-northeast-1',
    'aws-0-ap-northeast-2',
    'aws-0-ap-northeast-3',
    'aws-0-us-east-1',
    'aws-0-us-east-2',
    'aws-0-us-west-1',
    'aws-0-us-west-2',
    'aws-0-ca-central-1',
    'aws-0-eu-west-1',
    'aws-0-eu-west-2',
    'aws-0-eu-west-3',
    'aws-0-eu-central-1',
    'aws-0-eu-north-1',
    'aws-0-sa-east-1'
];

async function run() {
  console.log('Scanning all Supabase pooler regions to find project host...');
  
  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    const connStr = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres?pgbouncer=true`;
    
    console.log(`Scanning region ${region}...`);
    const client = new Client({
      connectionString: connStr,
      connectionTimeoutMillis: 3000,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`\n🎉 FOUND IT! SUCCESS!`);
      console.log(`Region: ${region}`);
      console.log(`Host: ${host}`);
      console.log(`Connection String: postgresql://postgres.${projectId}:[PASSWORD]@${host}:6543/postgres?pgbouncer=true`);
      await client.end();
      return;
    } catch (err) {
      if (err.message.includes('Tenant or user not found')) {
        // This pooler exists but our tenant is not in this region
        console.log(`   └─ ❌ tenant not in this region`);
      } else {
        // Network timeout or other error
        console.log(`   └─ ⚠️ error/timeout: ${err.message}`);
      }
    }
  }
  
  console.log('\n❌ Scan complete. No active regional pooler routed the connection.');
}

run();
