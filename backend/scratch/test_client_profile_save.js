const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const camelCaseKeys = (obj) => {
    if (!obj) return null;
    const newObj = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};

async function run() {
  const client = await pool.connect();
  try {
    const userId = 'a5015002-6128-46b8-9ff6-7dde5d518723'; // mayurkarthick2006@gmail.com (USER)
    
    // Simulate req.body from BouncerProfileScreen.tsx
    const reqBody = {
      name: 'Mayur Karthick',
      contactNo: '1234567879',
      profilePhoto: 'https://avatar.placeholder',
      bouncerProfile: {
        age: '20',
        gender: 'Male',
        experience: '5',
        registrationType: 'Individual',
        agencyReferralCode: ''
      }
    };

    const { name, contactNo, profilePhoto, age, gender, location, company, clientProfile, bouncerProfile } = reqBody;

    const safeParseInt = (val) => {
        if (val === undefined || val === null || val === '') return null;
        const parsed = parseInt(String(val), 10);
        return isNaN(parsed) ? null : parsed;
    };

    console.log("1. Dynamic User Update...");
    const userUpdates = [];
    const userValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
        userUpdates.push(`name = $${paramIndex++}`);
        userValues.push(name);
    }
    if (contactNo !== undefined) {
        userUpdates.push(`"contactNo" = $${paramIndex++}`);
        userValues.push(contactNo);
    }
    if (profilePhoto !== undefined) {
        userUpdates.push(`"profilePhoto" = $${paramIndex++}`);
        userValues.push(profilePhoto);
    }
    
    userUpdates.push(`"updatedAt" = $${paramIndex++}`);
    userValues.push(new Date().toISOString());

    const userQueryText = `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const userRes = await client.query(userQueryText, [...userValues, userId]);
    const updatedUser = userRes.rows[0];
    console.log("Updated user successfully:", updatedUser.name);

    console.log("2. Client Upsert...");
    if (updatedUser.role === 'USER') {
        const clientAge = age || clientProfile?.age;
        const clientGender = gender || clientProfile?.gender;
        const clientLocation = location || clientProfile?.location;

        await client.query(
            `INSERT INTO clients ("userId", name, "contactNo", age, gender, location, "profilePhoto", "verificationStatus", "rejectionReason", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             ON CONFLICT ("userId") 
             DO UPDATE SET 
                 name = EXCLUDED.name, 
                 "contactNo" = EXCLUDED."contactNo", 
                 age = EXCLUDED.age, 
                 gender = EXCLUDED.gender, 
                 location = EXCLUDED.location, 
                 "profilePhoto" = EXCLUDED."profilePhoto", 
                 "verificationStatus" = EXCLUDED."verificationStatus", 
                 "rejectionReason" = EXCLUDED."rejectionReason", 
                 "updatedAt" = EXCLUDED."updatedAt"`,
            [
                userId, 
                name || updatedUser.name, 
                contactNo !== undefined ? contactNo : updatedUser.contactNo, 
                clientAge ? safeParseInt(clientAge) : null, 
                clientGender || null, 
                clientLocation || null, 
                profilePhoto !== undefined ? profilePhoto : updatedUser.profilePhoto, 
                'PENDING', 
                null, 
                new Date().toISOString()
            ]
        );
        console.log("Client upserted successfully!");
    }

    console.log("3. Bouncer updates...");
    let updatedBouncer = null;
    if (bouncerProfile) {
        const existingBouncerRes = await client.query(
            'SELECT * FROM bouncers WHERE "userId" = $1',
            [userId]
        );
        const existingBouncer = existingBouncerRes.rows[0];
        console.log("Existing bouncer for user:", existingBouncer ? 'yes' : 'no');

        if (existingBouncer) {
            // (Skips if none)
        }
    }

    console.log("4. Formatting response...");
    const responseUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        contactNo: updatedUser.contactNo,
        age: updatedUser.age,
        profilePhoto: updatedUser.profilePhoto,
        bouncerProfile: updatedBouncer ? camelCaseKeys(updatedBouncer) : undefined
    };

    if (!updatedBouncer) {
        const bouncerRes = await client.query(
            'SELECT * FROM bouncers WHERE "userId" = $1',
            [userId]
        );
        const bouncer = bouncerRes.rows[0];
        if (bouncer) {
            responseUser.bouncerProfile = camelCaseKeys(bouncer);
        }
    }

    if (updatedUser.role === 'USER') {
        const clientRes = await client.query(
            'SELECT * FROM clients WHERE "userId" = $1',
            [userId]
        );
        const client = clientRes.rows[0];
        if (client) {
            responseUser.clientProfile = camelCaseKeys(client);
        }
    }

    console.log("✅ Success! Response User:", responseUser);

  } catch (err) {
    console.error("❌ Error caught:", err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
