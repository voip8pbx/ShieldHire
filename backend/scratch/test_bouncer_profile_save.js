const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '../.env' });

const jwtSecret = process.env.JWT_SECRET || 'default_secret';

async function main() {
    try {
        // Bouncer: Animesh yadav (userId = 723ea70d-c24c-4a89-b626-966fce53af3d)
        const userId = '723ea70d-c24c-4a89-b626-966fce53af3d';
        const email = '0201it221018@gmail.com';
        
        // Generate a token
        const token = jwt.sign(
            { id: userId, email: email, role: 'BOUNCER' },
            jwtSecret,
            { expiresIn: '7d' }
        );
        
        console.log('Generated Bouncer Token:', token);

        const payload = JSON.stringify({
          name: 'Animesh yadav',
          contactNo: '9876543210',
          profilePhoto: 'https://avatar.placeholder',
          bouncerProfile: {
            age: '50',
            gender: 'Male',
            registrationType: 'Individual',
            isGunman: false,
            bio: 'Experienced bouncer',
            upiId: 'animesh@upi',
            skills: ['Security', 'Crowd Control'],
            experience: '10',
            gallery: []
          }
        });
        
        // Make http request to /user/profile
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/user/profile',
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                console.log('Response Body:', body);
            });
        });
        
        req.on('error', (err) => {
            console.error('Request error:', err);
        });
        
        req.write(payload);
        req.end();
        
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
