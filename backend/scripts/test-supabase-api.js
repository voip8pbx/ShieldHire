const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yoshgwtufyjjfqittrhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc2hnd3R1ZnlqamZxaXR0cmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTg5OTMsImV4cCI6MjA4NzEzNDk5M30.9Q20Su-q-ODH-OGBqp3OyPoEDHDRRHW8sA3KtiAtbf8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApi() {
    console.log('Testing Supabase REST API...');

    // Try to fetch from a system table or just check health?
    // We'll try to sign in locally (client-side auth mock) or fetch a public table
    // Since we haven't created tables yet, we expect an error or empty list, but NOT a connection error.

    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);

        if (error) {
            console.log('API responded (Success):', error.message);
            // "relation 'users' does not exist" is good! It means we connected to Postgres.
            if (error.message.includes('relation "users" does not exist') || error.code === '42P01') {
                console.log('✅ Project is ACTIVE and accessible via API!');
            } else {
                console.log('⚠️ API Error:', error.code, error.message);
            }
        } else {
            console.log('✅ API Success! Data:', data);
        }
    } catch (err) {
        console.log('❌ Network/Client Error:', err.message);
    }
}

testApi();
