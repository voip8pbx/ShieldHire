require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

async function migrate() {
    let url = process.env.DATABASE_URL;
    url = url.replace('aws-0-ap-south-1.pooler.supabase.com:6543', 'db.yoshgwtufyjjfqittrhb.supabase.co:5432').replace('?pgbouncer=true', '');
    url = url.replace('postgres.yoshgwtufyjjfqittrhb', 'postgres');
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS "verificationStatus" VARCHAR(20) DEFAULT 'PENDING'`);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
migrate();
