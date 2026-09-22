const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://yoshgwtufyjjfqittrhb.supabase.co';
const apiKey = process.env.SUPABASE_ANON_KEY;

async function run() {
  console.log('Fetching Supabase Swagger/OpenAPI specification...');
  
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const spec = response.data;
    console.log(`✅ Successfully fetched spec!`);
    console.log(`API Title: ${spec.info.title}`);
    console.log(`API Version: ${spec.info.version}`);
    
    console.log('\n--- Available RPC Functions (Paths starting with /rpc/) ---');
    const paths = Object.keys(spec.paths);
    const rpcPaths = paths.filter(p => p.startsWith('/rpc/'));
    
    if (rpcPaths.length === 0) {
      console.log('No RPC functions found.');
    } else {
      rpcPaths.forEach(p => {
        console.log(`- ${p}`);
        const methods = Object.keys(spec.paths[p]);
        methods.forEach(m => {
          const params = spec.paths[p][m].parameters || [];
          const paramNames = params.map(pr => pr.name).join(', ');
          console.log(`  └─ ${m.toUpperCase()}: arguments: [${paramNames}]`);
        });
      });
    }

    console.log('\n--- Available Tables/Views ---');
    const tablePaths = paths.filter(p => !p.startsWith('/rpc/'));
    tablePaths.forEach(p => {
      console.log(`- ${p}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch spec:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

run();
