-- =============================================
-- ShieldHire - Clean Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- WARNING: This will DELETE existing data for a fresh start.
-- =============================================

-- 0. Clean up existing tables
DROP TABLE IF EXISTS "emergency_alerts" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "bouncers" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT DEFAULT '',
    "name" TEXT NOT NULL,
    "contactNo" TEXT,
    "age" INTEGER,
    "profilePhoto" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER', -- USER, BOUNCER, GUNMAN, ADMIN
    "googleId" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. BOUNCERS TABLE
-- =============================================
CREATE TABLE "bouncers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "govtIdPhoto" TEXT DEFAULT '',
    "hasGunLicense" BOOLEAN DEFAULT FALSE,
    "gunLicensePhoto" TEXT,
    "isGunman" BOOLEAN DEFAULT FALSE,
    "registrationType" TEXT DEFAULT 'Individual',
    "agencyReferralCode" TEXT,
    "rating" FLOAT DEFAULT 0.0,
    "isAvailable" BOOLEAN DEFAULT TRUE,

    -- Profile details
    "bio" TEXT,
    "skills" TEXT[] DEFAULT '{}',
    "experience" INTEGER DEFAULT 0,
    "gallery" TEXT[] DEFAULT '{}',

    -- Verification
    "verificationStatus" TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMPTZ,
    "rejectionReason" TEXT,

    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "idx_bouncer_verification" ON "bouncers"("verificationStatus");
CREATE INDEX "idx_bouncer_available" ON "bouncers"("isAvailable");

-- =============================================
-- 3. BOOKINGS TABLE
-- =============================================
CREATE TABLE "bookings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id"),
    "bouncerId" UUID NOT NULL REFERENCES "bouncers"("id"),
    "date" TIMESTAMPTZ NOT NULL,
    "time" TEXT,
    "status" TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, REJECTED, COMPLETED
    "location" TEXT,
    "duration" INTEGER DEFAULT 4,
    "totalPrice" FLOAT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "idx_booking_user" ON "bookings"("userId");
CREATE INDEX "idx_booking_bouncer" ON "bookings"("bouncerId");
CREATE INDEX "idx_booking_date" ON "bookings"("date");

-- =============================================
-- 4. REVIEWS TABLE
-- =============================================
CREATE TABLE "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment" TEXT,
    "bookingId" UUID UNIQUE NOT NULL REFERENCES "bookings"("id"),
    "userId" UUID NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. EMERGENCY ALERTS TABLE
-- =============================================
CREATE TABLE "emergency_alerts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id"),
    "latitude" FLOAT,
    "longitude" FLOAT,
    "location" TEXT,
    "status" TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED, DISMISSED
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "idx_alert_status" ON "emergency_alerts"("status");
CREATE INDEX "idx_alert_user" ON "emergency_alerts"("userId");

-- =============================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bouncers_updated_at BEFORE UPDATE ON "bouncers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON "bookings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON "emergency_alerts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bouncers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_alerts" ENABLE ROW LEVEL SECURITY;

-- Simple Policies for Development (Allows cross-app interaction)
CREATE POLICY "Public user access" ON "users" FOR SELECT USING (true);
CREATE POLICY "Users can update self" ON "users" FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can view approved bouncers" ON "bouncers" FOR SELECT USING ("verificationStatus" = 'APPROVED');
CREATE POLICY "Bouncers can manage self" ON "bouncers" FOR ALL USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Bookings visibility" ON "bookings" FOR SELECT USING (true); -- Allows bouncers and clients to see relevant bookings
CREATE POLICY "Clients can create bookings" ON "bookings" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update booking status" ON "bookings" FOR UPDATE USING (true); -- Allow bouncers to Accept/Reject

CREATE POLICY "Alerts management" ON "emergency_alerts" FOR ALL USING (true);
CREATE POLICY "Reviews management" ON "reviews" FOR ALL USING (true);

-- =============================================
-- 8. STORAGE BUCKETS
-- =============================================
-- Run these in Supabase Dashboard -> Storage -> New Bucket
-- 1. "profile-photos"  (Public)
-- 2. "kyc-documents"   (Private)
-- 3. "bouncer-gallery" (Public)
