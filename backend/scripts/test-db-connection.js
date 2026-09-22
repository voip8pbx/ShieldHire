const { Client } = require('pg');

const password = process.env.DB_PASSWORD || 'q8NW0vCKkEngqU8L';
const projectId = 'yoshgwtufyjjfqittrhb';

// List all known Supabase pooler regions
const regions = [
    'aws-0-ap-south-1',
    'aws-0-ap-southeast-1',
    'aws-0-us-east-1',
    'aws-0-eu-central-1',
];

async function testConnections() {
    console.log('Testing Supabase regions with Transaction Pooler (port 6543)...');

    for (const region of regions) {
        const host = `${region}.pooler.supabase.com`;
        // Try transaction pooler port 6543
        // Note: Transaction pooler usually requires SSL verify-full or at least require
        const str = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres`;

        console.log(`Trying ${region}:6543...`);

        const client = new Client({
            connectionString: str,
            connectionTimeoutMillis: 5000,
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS! Connected to ${region} on port 6543`);
            await client.end();
            return;
        } catch (err) {
            if (err.message.includes('Tenant or user not found')) {
                console.log(`❌ Tenant/User not found in ${region}`);
            } else {
                console.log(`❌ Error connecting to ${region}: ${err.message}`);
            }
        }
    }

    console.log('❌ All attempts failed.');
}

testConnections();
