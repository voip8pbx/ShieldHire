const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        console.log('Querying clients...');
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*, users(name, email)')
            .eq('verificationStatus', 'PENDING');
            
        if (error) {
            console.error('Query error:', error);
            return;
        }
        
        console.log('Raw clients data from Supabase:', JSON.stringify(clients, null, 2));
        
        // Let's test the mapping logic
        const formatted = clients.map((c) => {
            const f = { ...c };
            if (c.users) {
                f.user = Array.isArray(c.users) ? c.users[0] : c.users;
                delete f.users;
            }
            return f;
        });
        
        console.log('Formatted clients data:', JSON.stringify(formatted, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
