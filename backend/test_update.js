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
    const email = 'voip8pbx@gmail.com';
    const newPassword = 'adminPassword123';
    const hashedPassword = await bcrypt.hash(newPassword, 8);

    console.log("Updating user role and password via Supabase REST API...");
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: 'ADMIN',
        password: hashedPassword
      })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error("❌ REST API Update Error:", error.message);
    } else {
      console.log("⚡ REST API Update Success! Row updated:");
      console.log(data);
    }
  } catch (err) {
    console.error("❌ REST API Update Exception:", err.message);
  }
}

run();
