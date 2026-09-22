const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        console.log('Querying users matching mayur or karthick...');
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or('email.ilike.%mayur%,email.ilike.%karthick%,name.ilike.%mayur%,name.ilike.%karthick%');
            
        if (error) {
            console.error('Error fetching users:', error);
            return;
        }
        
        console.log('Found users:', JSON.stringify(users, null, 2));
        
        for (const u of users) {
            const { data: bouncer } = await supabase
                .from('bouncers')
                .select('*')
                .eq('userId', u.id);
            const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('userId', u.id);
                
            console.log(`\nUser: ${u.email} (Role: ${u.role})`);
            console.log('Bouncer profiles:', bouncer);
            console.log('Client profiles:', client);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
