const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = 'a5015002-6128-46b8-9ff6-7dde5d518723';
  
  console.log("1. Trying update name only...");
  const { data: d1, error: e1 } = await supabase
    .from('users')
    .update({ name: 'Mayur Karthick' })
    .eq('id', userId)
    .select();
  
  console.log("D1:", d1, "E1:", e1);

  console.log("\n2. Trying update name and contactNo only...");
  const { data: d2, error: e2 } = await supabase
    .from('users')
    .update({ name: 'Mayur Karthick', contactNo: '1234567879' })
    .eq('id', userId)
    .select();
  
  console.log("D2:", d2, "E2:", e2);

  console.log("\n3. Trying update name, contactNo, profilePhoto...");
  const { data: d3, error: e3 } = await supabase
    .from('users')
    .update({ name: 'Mayur Karthick', contactNo: '1234567879', profilePhoto: null })
    .eq('id', userId)
    .select();
  
  console.log("D3:", d3, "E3:", e3);
}

run();
