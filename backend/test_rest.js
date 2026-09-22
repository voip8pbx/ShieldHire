const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    console.log("Querying Supabase REST API...");
    const { data, error } = await supabase
      .from('users')
      .select('email, role')
      .limit(3);
    
    if (error) {
      console.error("❌ REST API Error:", error.message);
    } else {
      console.log("⚡ REST API query successful! Data fetched:");
      console.log(data);
    }
  } catch (err) {
    console.error("❌ REST API Exception:", err.message);
  }
}

run();
