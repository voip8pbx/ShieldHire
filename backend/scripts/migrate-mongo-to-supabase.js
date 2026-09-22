const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Load root .env for Supabase
// Load backend .env for Mongo if needed

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL_MONGO;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing. Please set MONGO_URI environment variable.');
    console.log('Usage: MONGO_URI="mongodb+srv://..." node backend/scripts/migrate-mongo-to-supabase.js');
    process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service key needed to bypass RLS

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const idMap = new Map(); // MongoId (string) -> Supabase UUID (string)
const bookingIdMap = new Map(); // Mongo BookingId -> UUID

const migrate = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // 1. MIGRATE USERS
        console.log('🚀 Migrating Users...');
        const users = await db.collection('users').find().toArray();
        console.log(`Found ${users.length} users`);

        const userInserts = [];
        for (const user of users) {
            const newId = randomUUID();
            idMap.set(user._id.toString(), newId);

            userInserts.push({
                id: newId,
                email: user.email,
                password: user.password || '', // Hash is preserved
                name: user.name,
                contact_no: user.contactNo || user.contact_no, // Handle camelCase or snake_case
                age: user.age,
                profile_photo: user.profilePhoto || user.profile_photo,
                role: user.role || 'USER',
                google_id: user.googleId || user.google_id,
                created_at: user.createdAt ? new Date(user.createdAt) : new Date(),
                updated_at: user.updatedAt ? new Date(user.updatedAt) : new Date()
            });
        }

        if (userInserts.length > 0) {
            const { error } = await supabase.from('users').upsert(userInserts);
            if (error) {
                console.error('❌ Error inserting users:', error);
                throw error;
            }
            console.log(`✅ Migrated ${userInserts.length} users`);
        }

        // 2. MIGRATE BOUNCERS
        console.log('🚀 Migrating Bouncers...');
        const bouncers = await db.collection('bouncers').find().toArray();
        const bouncerInserts = [];

        for (const b of bouncers) {
            const userId = idMap.get(b.userId?.toString() || b.user?.toString());
            if (!userId) {
                console.warn(`⚠️ Skipping bouncer with missing user ref: ${b._id}`);
                continue;
            }

            bouncerInserts.push({
                user_id: userId,
                name: b.name,
                contact_no: b.contactNo || b.contact_no,
                age: b.age,
                gender: b.gender,
                profile_photo: b.profilePhoto || b.profile_photo,
                govt_id_photo: b.govtIdPhoto || b.govt_id_photo,
                has_gun_license: b.hasGunLicense || false,
                gun_license_photo: b.gunLicensePhoto || b.gun_license_photo,
                is_gunman: b.isGunman || false,
                registration_type: b.registrationType || 'Individual',
                agency_referral_code: b.agencyReferralCode,
                rating: b.rating || 0.0,
                is_available: b.isAvailable ?? true,
                bio: b.bio,
                skills: b.skills || [],
                experience: b.experience || 0,
                gallery: b.gallery || [],
                verification_status: b.verificationStatus || 'PENDING',
                verified_by: b.verifiedBy && idMap.get(b.verifiedBy.toString()) ? idMap.get(b.verifiedBy.toString()) : null,
                verified_at: b.verifiedAt ? new Date(b.verifiedAt) : null,
                rejection_reason: b.rejectionReason,
                created_at: b.createdAt ? new Date(b.createdAt) : new Date(),
                updated_at: b.updatedAt ? new Date(b.updatedAt) : new Date()
            });
        }

        if (bouncerInserts.length > 0) {
            const { error } = await supabase.from('bouncers').upsert(bouncerInserts);
            if (error) console.error('❌ Error inserting bouncers:', error);
            else console.log(`✅ Migrated ${bouncerInserts.length} bouncers`);
        }

        // 3. MIGRATE TRAINER PROFILES
        console.log('🚀 Migrating Trainer Profiles...');
        const trainers = await db.collection('trainerprofiles').find().toArray(); // Check collection name (mongo usually lowercases model name + s, or User defined)
        // Adjust collection name if it's 'TrainerProfile' or 'trainer_profiles'
        // Trying 'TrainerProfile' usually becomes 'trainerprofiles' in Mongoose default.

        let trainerData = trainers;
        if (trainers.length === 0) {
            const t2 = await db.collection('trainer_profiles').find().toArray();
            if (t2.length > 0) trainerData = t2;
        }

        const trainerInserts = [];
        for (const t of trainerData) {
            const userId = idMap.get(t.userId?.toString());
            if (!userId) continue;

            // Generate UUID for trainer profile explicitly to link bookings if needed using map, 
            // but schema says bookings.trainer_id REFERENCES trainer_profiles(id).
            // So I need the new ID.
            const newId = randomUUID();
            // Store mapping if needed? Bookings reference trainer_id (profile id)
            // But usually bookings reference *User* acting as trainer?
            // Schema: trainer_id references trainer_profiles(id).
            // So I need a map for TrainerProfileId too.
            idMap.set(t._id.toString(), newId);

            trainerInserts.push({
                id: newId,
                user_id: userId,
                bio: t.bio,
                specialization: t.specialization,
                experience: t.experience,
                price_per_session: t.pricePerSession,
                rating: t.rating,
                is_available: t.isAvailable,
                created_at: t.createdAt ? new Date(t.createdAt) : new Date(),
                updated_at: t.updatedAt ? new Date(t.updatedAt) : new Date()
            });
        }

        if (trainerInserts.length > 0) {
            const { error } = await supabase.from('trainer_profiles').upsert(trainerInserts);
            if (error) console.error('❌ Error inserting trainer profiles:', error);
            else console.log(`✅ Migrated ${trainerInserts.length} trainer profiles`);
        }

        // 4. MIGRATE BOOKINGS
        console.log('🚀 Migrating Bookings...');
        const bookings = await db.collection('bookings').find().toArray();
        const bookingInserts = [];

        for (const b of bookings) {
            const userId = idMap.get(b.userId?.toString());
            const trainerId = idMap.get(b.trainerId?.toString()); // References TrainerProfile ID (from previous step)

            if (!userId || !trainerId) {
                console.warn(`⚠️ Skipping booking ${b._id} due to missing user/trainer ref`);
                continue;
            }

            const newId = randomUUID();
            bookingIdMap.set(b._id.toString(), newId);

            bookingInserts.push({
                id: newId,
                user_id: userId,
                trainer_id: trainerId,
                date: b.date ? new Date(b.date) : new Date(),
                status: b.status || 'PENDING',
                location: b.location,
                created_at: b.createdAt ? new Date(b.createdAt) : new Date(),
                updated_at: b.updatedAt ? new Date(b.updatedAt) : new Date()
            });
        }

        if (bookingInserts.length > 0) {
            const { error } = await supabase.from('bookings').upsert(bookingInserts);
            if (error) console.error('❌ Error inserting bookings:', error);
            else console.log(`✅ Migrated ${bookingInserts.length} bookings`);
        }

        // 5. MIGRATE REVIEWS
        console.log('🚀 Migrating Reviews...');
        const reviews = await db.collection('reviews').find().toArray();
        const reviewInserts = [];

        for (const r of reviews) {
            const userId = idMap.get(r.userId?.toString());
            const bookingId = bookingIdMap.get(r.bookingId?.toString()); // Use bookingId map

            if (!userId || !bookingId) continue;

            reviewInserts.push({
                rating: r.rating,
                comment: r.comment,
                booking_id: bookingId,
                user_id: userId,
                created_at: r.createdAt ? new Date(r.createdAt) : new Date()
            });
        }

        if (reviewInserts.length > 0) {
            const { error } = await supabase.from('reviews').upsert(reviewInserts);
            if (error) console.error('❌ Error inserting reviews:', error);
            else console.log(`✅ Migrated ${reviewInserts.length} reviews`);
        }

        // 6. MIGRATE EMERGENCY ALERTS
        console.log('🚀 Migrating Emergency Alerts...');
        const alerts = await db.collection('emergencyalerts').find().toArray(); // Mongoose default lowercase
        let alertData = alerts;
        if (alertData.length === 0) {
            const a2 = await db.collection('emergency_alerts').find().toArray();
            if (a2.length > 0) alertData = a2;
        }

        const alertInserts = [];
        for (const a of alertData) {
            const userId = idMap.get(a.userId?.toString());
            if (!userId) continue;

            alertInserts.push({
                user_id: userId,
                latitude: a.latitude,
                longitude: a.longitude,
                location: a.location,
                status: a.status || 'OPEN',
                created_at: a.createdAt ? new Date(a.createdAt) : new Date(),
                updated_at: a.updatedAt ? new Date(a.updatedAt) : new Date()
            });
        }

        if (alertInserts.length > 0) {
            const { error } = await supabase.from('emergency_alerts').upsert(alertInserts);
            if (error) console.error('❌ Error inserting alerts:', error);
            else console.log(`✅ Migrated ${alertInserts.length} alerts`);
        }

        console.log('✨ Data migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

migrate();
