const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        const email = 'mayurkarthick2006@gmail.com';
        const { data: user, error } = await supabase
            .from('users')
            .select('*, bouncers(*), clients(*)')
            .eq('email', email)
            .single();
            
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        console.log('Raw user with relations:', JSON.stringify(user, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
