const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
console.log("Connecting directly to PostgreSQL database...");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const userId = 'a5015002-6128-46b8-9ff6-7dde5d518723';
    console.log(`Running SELECT query for user ${userId}...`);
    const selectRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log("Select result rows count:", selectRes.rows.length);
    if (selectRes.rows.length > 0) {
      console.log("User row:", selectRes.rows[0]);
    }

    console.log(`\nRunning UPDATE query for user ${userId}...`);
    const updateRes = await client.query('UPDATE users SET name = $1, "contactNo" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *', [
      'Mayur Karthick',
      '1234567879',
      userId
    ]);
    console.log("Update result rows count:", updateRes.rows.length);
    if (updateRes.rows.length > 0) {
      console.log("Updated row:", updateRes.rows[0]);
    } else {
      console.log("No rows were updated directly in Postgres!");
    }
  } catch (err) {
    console.error("❌ Direct PostgreSQL query error:", err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
