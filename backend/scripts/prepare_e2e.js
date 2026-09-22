require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

async function run() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing DIRECT_URL or DATABASE_URL in .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully!");

        console.log("Cleaning up conflicting test bookings...");
        await client.query('DELETE FROM bookings WHERE "userId" = $1 OR "bouncerId" = $2;', ['a5015002-6128-46b8-9ff6-7dde5d518723', 'e77b90ef-96e2-4ccf-a76b-d5597d56e0c8']);

        // 1. Client user & profile preparation
        const clientUserId = 'a5015002-6128-46b8-9ff6-7dde5d518723';
        const clientEmail = 'mayurkarthick2006@gmail.com';
        const clientName = 'Mayur Karthick 1787211010839';

        console.log("Preparing Client user...");
        await client.query(`
            INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET role = 'USER', email = $2, name = $4;
        `, [clientUserId, clientEmail, '', clientName, 'USER']);

        console.log("Preparing Client profile as APPROVED...");
        await client.query(`
            INSERT INTO clients (id, "userId", name, "contactNo", age, gender, "profilePhoto", location, "verificationStatus", "createdAt", "updatedAt")
            VALUES ($1, $1, $2, '9876543210', 30, 'Male', '', 'Mumbai', 'APPROVED', NOW(), NOW())
            ON CONFLICT ("userId") DO UPDATE SET "verificationStatus" = 'APPROVED', name = $2;
        `, [clientUserId, clientName]);

        // 2. Bouncer user & profile preparation
        const bouncerUserId = '585bd292-1e65-4fcd-9982-8e28b7eccc92';
        const bouncerEmail = 'mapyur06@gmail.com';
        const bouncerName = 'Mayur P';
        const bouncerProfileId = 'e77b90ef-96e2-4ccf-a76b-d5597d56e0c8';

        console.log("Preparing Bouncer user...");
        await client.query(`
            INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET role = 'USER', email = $2, name = $4;
        `, [bouncerUserId, bouncerEmail, '', bouncerName, 'USER']);

        console.log("Preparing Bouncer profile...");
        await client.query(`
            INSERT INTO bouncers (id, "userId", name, "contactNo", age, gender, "profilePhoto", "govtIdPhoto", "hasGunLicense", "isGunman", "registrationType", rating, "isAvailable", bio, skills, experience, gallery)
            VALUES ($1, $2, $3, '9876543211', 28, 'Male', '', '', false, false, 'Individual', 5.0, true, 'Test bio', ARRAY['Security', 'VIP'], 5, ARRAY[]::text[])
            ON CONFLICT ("userId") DO UPDATE SET "isAvailable" = true, name = $3;
        `, [bouncerProfileId, bouncerUserId, bouncerName]);

        console.log("⚡ Database prepared successfully for E2E testing!");
    } catch (err) {
        console.error("❌ DB Preparation Error:", err.message);
    } finally {
        await client.end();
    }
}
run();
