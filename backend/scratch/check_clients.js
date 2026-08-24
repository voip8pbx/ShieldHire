const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: clients, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error("Error fetching clients:", error);
    return;
  }
  console.log("CLIENTS IN DB:");
  clients.forEach(c => console.log(`- ${c.id}: userId=${c.userId}, name=${c.name}, contact=${c.contactNo}, age=${c.age}, location=${c.location}`));
}

run();
