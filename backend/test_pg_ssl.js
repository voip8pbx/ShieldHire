const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Missing DATABASE_URL in .env file");
  process.exit(1);
}

// Enable SSL configuration
const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log("Connecting to PostgreSQL with SSL enabled...");
    await client.connect();
    console.log("⚡ SSL Connection successful!");
    
    // Promote user voip8pbx@gmail.com to ADMIN role
    const query = "UPDATE users SET role = 'ADMIN' WHERE email = 'voip8pbx@gmail.com' RETURNING id, email, role;";
    const res = await client.query(query);
    
    console.log("=== DB Promotion Result ===");
    if (res.rows.length === 0) {
      console.log("⚠️ No user found with the email 'voip8pbx@gmail.com'.");
    } else {
      console.log("Success! Updated user profile:", res.rows[0]);
    }
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
