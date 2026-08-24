const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const jwtSecret = process.env.JWT_SECRET || 'default_secret';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        const email = 'mayurkarthick2006@gmail.com';
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
            
        if (userError || !user) {
            console.error('User not found:', userError);
            return;
        }
        
        // Generate a token just like backend authController does
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );
        
        console.log('Generated Admin/User Token:', token);
        
        // Make http request to /auth/me
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/auth/me',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                console.log('/auth/me response:', JSON.stringify(JSON.parse(body), null, 2));
            });
        });
        
        req.on('error', (err) => {
            console.error('Request error:', err);
        });
        
        req.end();
        
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
