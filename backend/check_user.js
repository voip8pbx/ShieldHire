const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'mayurkarthick2006@gmail.com';
    console.log('Checking user for email:', email);
    
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
    if (userError) {
        console.error('User Error:', userError);
        return;
    }
    
    console.log('User Record:', user);
    
    const { data: bouncer, error: bouncerError } = await supabase
        .from('bouncers')
        .select('*')
        .eq('userId', user.id);
        
    console.log('Bouncer Profiles:', bouncer);
    
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('userId', user.id);
        
    console.log('Client Profiles:', client);
}

main();
