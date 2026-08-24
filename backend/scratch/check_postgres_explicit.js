const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'postgres.yoshgwtufyjjfqittrhb',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    database: 'postgres',
    password: 'q8NW0vCKkEngqU8L',
    port: 6543,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting directly to PostgreSQL with explicit config...");
    await client.connect();
    console.log("✅ Successfully connected!");

    const userId = 'a5015002-6128-46b8-9ff6-7dde5d518723';
    console.log(`\nQuerying user row for ${userId}...`);
    const selectRes = await client.query('SELECT id, name, "contactNo" FROM users WHERE id = $1', [userId]);
    console.log("Select result rows:", selectRes.rows);

    console.log(`\nUpdating user name for ${userId}...`);
    const updateRes = await client.query('UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name', [
      'Mayur Karthick',
      userId
    ]);
    console.log("Update result rows:", updateRes.rows);

  } catch (err) {
    console.error("❌ PostgreSQL error:", err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
