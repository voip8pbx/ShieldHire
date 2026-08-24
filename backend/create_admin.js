const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const email = 'admin@shieldhire.com';
    const password = 'ShieldAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 8);

    console.log("Creating new ADMIN user via Supabase REST API (POST)...");
    const { data, error } = await supabase
      .from('users')
      .insert({ 
        email: email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN'
      })
      .select();
    
    if (error) {
      console.error("❌ REST API Insert Error:", error.message);
    } else {
      console.log("⚡ REST API Insert Success! Admin user created:");
      console.log(data);
      console.log(`Login Email: ${email}`);
      console.log(`Password: ${password}`);
    }
  } catch (err) {
    console.error("❌ REST API Insert Exception:", err.message);
  }
}

run();
