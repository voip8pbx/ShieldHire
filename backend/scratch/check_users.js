const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (userErr) {
    console.error("Error fetching users:", userErr);
    return;
  }
  console.log("USERS IN DB:");
  users.forEach(u => console.log(`- ${u.id}: ${u.email} (${u.role})`));

  const { data: bouncers, error: bouncerErr } = await supabase.from('bouncers').select('*');
  if (bouncerErr) {
    console.error("Error fetching bouncers:", bouncerErr);
    return;
  }
  console.log("\nBOUNCERS IN DB:");
  bouncers.forEach(b => console.log(`- ${b.id}: userId=${b.userId}, name=${b.name}, age=${b.age}, exp=${b.experience}`));
}

run();
