const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    console.log("Attempting write action to capture network cause...");
    const { data, error } = await supabase
      .from('users')
      .insert({ 
        email: 'test-error-cause@gmail.com',
        name: 'test',
        role: 'USER'
      })
      .select();
    
    if (error) {
      console.log("❌ REST API returned error:", error);
    } else {
      console.log("⚡ REST API success:", data);
    }
  } catch (err) {
    console.error("❌ REST API Exception captured:");
    console.error(err);
    if (err.cause) {
      console.error("❌ Exception Cause details:");
      console.error(err.cause);
    }
  }
}

run();
