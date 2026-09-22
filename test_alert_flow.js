
const API_URL = 'http://localhost:5000/api'; // Wait, backend is on /api/auth? No, /auth.
// I need checking app.ts routes.
// app.use('/auth', authRoutes).
// app.use('/api/alerts', alertRoutes).

const BASE_URL = 'http://localhost:5000';

async function testAlertFlow() {
    try {
        const email = `bouncer_test_${Date.now()}@example.com`;
        const password = 'password123';
        const role = 'BOUNCER';

        console.log('1. Signing up user:', email);
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: 'Test Bouncer', role })
        });

        const signupData = await signupRes.json();

        if (!signupRes.ok) {
            console.error('Signup Failed:', signupData);
            return;
        }

        const token = signupData.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        if (!token) return;

        // 2. Send SOS Alert
        console.log('2. Sending SOS Alert...');
        const alertRes = await fetch(`${BASE_URL}/api/alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                latitude: 12.9716,
                longitude: 77.5946,
                location: 'Bangalore, India - Test Alert'
            })
        });

        const alertData = await alertRes.json();

        if (alertRes.ok) {
            console.log('✅ Alert Created Successfully!');
            console.log('Alert ID:', alertData.id);
        } else {
            console.error('❌ Alert Creation Failed:', alertData);
        }

    } catch (error) {
        console.error('Test Script Error:', error);
    }
}

testAlertFlow();
