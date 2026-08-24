const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const userId = '723ea70d-c24c-4a89-b626-966fce53af3d'; // Animesh yadav (BOUNCER)
    
    // Simulate payload from BouncerSurveyScreen.tsx
    const reqBody = {
      name: 'Animesh yadav',
      bouncerProfile: {
        age: 50,
        gender: 'Male',
        registrationType: 'Individual',
        isGunman: false,
        bio: 'I am a professional bouncer',
        upiId: 'animesh@upi',
        skills: ['Crowd Control', 'VIP Protection'],
        experience: 10,
        gallery: ['http://localhost:5000/uploads/gallery-1.jpg'],
        identityVerified: true,
        aadhaarLast4: '1234',
        livenessVerifiedAt: new Date().toISOString()
      }
    };

    const { name, bouncerProfile } = reqBody;

    console.log("1. Fetching existing bouncer...");
    const existingBouncerRes = await client.query('SELECT * FROM bouncers WHERE "userId" = $1', [userId]);
    const existingBouncer = existingBouncerRes.rows[0];
    console.log("Existing bouncer found:", !!existingBouncer);

    if (existingBouncer) {
        console.log("2. Compiling bouncerUpdates...");
        const bouncerUpdates = {
            updatedAt: new Date().toISOString()
        };

        if (name) bouncerUpdates.name = name;
        
        // Extended fields logic from userController.ts
        bouncerUpdates.bio = `${bouncerProfile.bio} | UPI ID: ${bouncerProfile.upiId}`;
        bouncerUpdates.skills = bouncerProfile.skills;
        bouncerUpdates.experience = bouncerProfile.experience;
        bouncerUpdates.gallery = bouncerProfile.gallery;
        bouncerUpdates.age = bouncerProfile.age;
        bouncerUpdates.gender = bouncerProfile.gender;
        bouncerUpdates.registrationType = bouncerProfile.registrationType;
        bouncerUpdates.isGunman = bouncerProfile.isGunman;

        bouncerUpdates.identity_verified = bouncerProfile.identityVerified;
        bouncerUpdates.aadhaar_last_4 = bouncerProfile.aadhaarLast4;
        bouncerUpdates.liveness_verified_at = bouncerProfile.livenessVerifiedAt;

        console.log("3. Executing update query on bouncers table...");
        const keys = Object.keys(bouncerUpdates);
        const values = Object.values(bouncerUpdates);
        const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        const queryText = `UPDATE bouncers SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        
        console.log("Query text:", queryText);
        console.log("Values count:", values.length);
        const bouncerUpdateRes = await client.query(queryText, [...values, existingBouncer.id]);
        console.log("✅ Success! Updated bouncer:", bouncerUpdateRes.rows[0].id);
    }

  } catch (err) {
    console.error("❌ Exception caught:", err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
