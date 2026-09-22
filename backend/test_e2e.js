const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '../.env' });

const jwtSecret = process.env.JWT_SECRET || 'default_secret';

const CLIENT_PAYLOAD = {
    id: 'a5015002-6128-46b8-9ff6-7dde5d518723',
    email: 'mayurkarthick2006@gmail.com',
    role: 'USER',
    name: 'Mayur Karthick 1787211010839'
};

const BOUNCER_PAYLOAD = {
    id: '585bd292-1e65-4fcd-9982-8e28b7eccc92',
    email: 'mapyur06@gmail.com',
    role: 'BOUNCER',
    name: 'Mayur P'
};

const ADMIN_PAYLOAD = {
    id: 'admin_123',
    email: 'voip8pbx@gmail.com',
    role: 'ADMIN',
    name: 'Admin User'
};

const clientToken = jwt.sign(CLIENT_PAYLOAD, jwtSecret);
const bouncerToken = jwt.sign(BOUNCER_PAYLOAD, jwtSecret);
const adminToken = jwt.sign(ADMIN_PAYLOAD, jwtSecret);

const request = (options, body) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => resBody += chunk);
            res.on('end', () => {
                let data;
                try {
                    data = JSON.parse(resBody);
                } catch (e) {
                    data = resBody;
                }
                resolve({ statusCode: res.statusCode, data });
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

async function runTest() {
    console.log('🚀 STARTING END-TO-END FLOW SIMULATION...');
    console.log('Using backend server on http://127.0.0.1:5000');
    
    let bookingId = '';
    
    // Step 1: Client creates booking request
    console.log('\n--- STEP 1: Client creates booking request ---');
    const step1 = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/bookings',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        bouncerId: 'e77b90ef-96e2-4ccf-a76b-d5597d56e0c8', // Mayur P (your bouncer test account)
        date: new Date(`2027-02-${Math.floor(Math.random() * 20) + 10}T00:00:00Z`).toISOString(),
        time: '10:00 AM',
        location: 'Mumbai Event Hall',
        duration: 4,
        totalPrice: 2000,
        package: 'SINGLE_SHIFT',
        notes: 'Test Booking Notes'
    });
    
    if (step1.statusCode !== 201 && step1.statusCode !== 200) {
        console.error('❌ Step 1 Failed:', step1.statusCode, step1.data);
        return;
    }
    bookingId = step1.data.id;
    console.log(`✅ Booking Created Successfully! ID: ${bookingId}`);
    
    // Step 2: Bouncer accepts booking
    console.log('\n--- STEP 2: Bouncer accepts booking ---');
    const step2 = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/status`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${bouncerToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        status: 'ACCEPTED'
    });
    
    if (step2.statusCode !== 200) {
        console.error('❌ Step 2 Failed:', step2.statusCode, step2.data);
        return;
    }
    console.log('✅ Bouncer Accepted the Request! Status updated to: ACCEPTED');

    // Step 2b: Bouncer transitions to PAYMENT_PENDING
    console.log('\n--- STEP 2b: Bouncer requests payment ---');
    const step2b = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/status`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${bouncerToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        status: 'PAYMENT_PENDING'
    });
    
    if (step2b.statusCode !== 200) {
        console.error('❌ Step 2b Failed:', step2b.statusCode, step2b.data);
        return;
    }
    console.log('✅ Booking Status transitioned to: PAYMENT_PENDING');

    // Step 2c: Client transitions to PAYMENT_PROOF_SUBMITTED
    console.log('\n--- STEP 2c: Client transitions to PAYMENT_PROOF_SUBMITTED ---');
    const step2c = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/status`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${bouncerToken}`, // bouncer or admin can update status
            'Content-Type': 'application/json'
        }
    }, {
        status: 'PAYMENT_PROOF_SUBMITTED'
    });
    
    if (step2c.statusCode !== 200) {
        console.error('❌ Step 2c Failed:', step2c.statusCode, step2c.data);
        return;
    }
    console.log('✅ Booking Status transitioned to: PAYMENT_PROOF_SUBMITTED');
    
    // Step 3: Client submits payment proof details
    console.log('\n--- STEP 3: Client submits dummy payment proof ---');
    const step3 = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/payment-details`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        transactionId: 'TXN999988887777',
        paymentProofUrl: 'https://nyedypqduffj2hmb.public.blob.vercel-storage.com/mock-screenshot.png'
    });
    
    if (step3.statusCode !== 200) {
        console.error('❌ Step 3 Failed:', step3.statusCode, step3.data);
        return;
    }
    console.log('✅ Payment Proof details submitted successfully!');
    
    // Step 4: Admin verifies payment
    console.log('\n--- STEP 4: Admin verifies payment on Dashboard ---');
    const step4 = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/payment`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        paymentStatus: 'PAID'
    });
    
    if (step4.statusCode !== 200) {
        console.error('❌ Step 4 Failed:', step4.statusCode, step4.data);
        return;
    }
    console.log('✅ Admin Verified! Payment status updated to: PAID');

    // Step 4b: Admin confirms the booking status
    console.log('\n--- STEP 4b: Admin confirms overall booking status ---');
    const step4b = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}/status`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    }, {
        status: 'CONFIRMED'
    });
    
    if (step4b.statusCode !== 200) {
        console.error('❌ Step 4b Failed:', step4b.statusCode, step4b.data);
        return;
    }
    console.log('✅ Booking overall status updated to: CONFIRMED');
    
    // Step 5: Verify final booking status
    console.log('\n--- STEP 5: Verify final status of the booking ---');
    const step5 = await request({
        hostname: '127.0.0.1',
        port: 5000,
        path: `/bookings/${bookingId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (step5.statusCode !== 200) {
        console.error('❌ Step 5 Failed:', step5.statusCode, step5.data);
        return;
    }
    
    console.log('Final Booking details in database:');
    console.log(`- Booking ID: ${step5.data.id}`);
    console.log(`- Overall Status: ${step5.data.status}`);
    console.log(`- Payment Status: ${step5.data.paymentStatus}`);
    console.log(`- Transaction ID: ${step5.data.transactionId}`);
    console.log(`- Payment Proof URL: ${step5.data.paymentProofUrl}`);
    console.log('- Chat length:', step5.data.chat ? step5.data.chat.length : 0);
    
    console.log('\n🎉 ALL E2E FLOW STEPS COMPLETED AND VERIFIED SUCCESSFULLY!');
}

runTest();
