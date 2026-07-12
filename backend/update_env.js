const fs = require('fs');
let env = fs.readFileSync('../.env', 'utf8');
env = env.replace(/DATABASE_URL=".+"/g, '# pooler removed');
env += '\nDATABASE_URL="postgresql://postgres.yoshgwtufyjjfqittrhb:q8NW0vCKkEngqU8L@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"\n';
fs.writeFileSync('.env', env);
