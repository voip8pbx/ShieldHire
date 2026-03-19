-- =============================================
-- ShieldHire - Complete Integrated Supabase Schema
-- Combined from main migration and auth mapping schema
-- Run this in: Supabase Dashboard → SQL Editor
-- WARNING: This will DELETE existing data for a fresh start.
-- =============================================

-- 0. Clean up existing tables and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS "emergency_alerts" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "bouncers" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
-- Includes 'authId' to link Supabase Auth Users while keeping independent profile IDs
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "authId" UUID UNIQUE, -- Links to auth.users(id)
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT DEFAULT '',
    "name" TEXT NOT NULL,
    "contactNo" TEXT,
    "age" INTEGER,
    "profilePhoto" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER', -- USER, BOUNCER, GUNMAN, ADMIN
    "googleId" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_auth_user FOREIGN KEY ("authId") REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_users_authId ON "users"("authId");

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
-- 6. TRIGGER FUNCTIONS
-- =============================================

-- 6.1 Function to update 'updatedAt' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6.2 Function to auto-create profile on signup (Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."users" ("authId", "email", "name", "role")
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'USER')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. APPLY TRIGGERS
-- =============================================

-- Apply updatedAt triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bouncers_updated_at BEFORE UPDATE ON "bouncers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON "bookings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON "emergency_alerts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply Supabase Auth trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bouncers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_alerts" ENABLE ROW LEVEL SECURITY;

-- 8.1 Users Policies
CREATE POLICY "Public user access" ON "users" FOR SELECT USING (true);
CREATE POLICY "Users can update self" ON "users" FOR UPDATE 
  USING (auth.uid() = "authId");

-- 8.2 Bouncers Policies
CREATE POLICY "Anyone can view approved bouncers" ON "bouncers" FOR SELECT 
  USING ("verificationStatus" = 'APPROVED');
CREATE POLICY "Bouncers can manage self" ON "bouncers" FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM "users" 
    WHERE "users"."id" = "bouncers"."userId" 
    AND "users"."authId" = auth.uid()
  ));

-- 8.3 Bookings Policies
CREATE POLICY "Bookings visibility" ON "bookings" FOR SELECT USING (true);
CREATE POLICY "Clients can create bookings" ON "bookings" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update booking status" ON "bookings" FOR UPDATE USING (true);

-- 8.4 Alerts & Reviews
CREATE POLICY "Alerts management" ON "emergency_alerts" FOR ALL USING (true);
CREATE POLICY "Reviews management" ON "reviews" FOR ALL USING (true);

-- =============================================
-- 9. STORAGE BUCKETS (Reference)
-- =============================================
-- Ensure these exist and are configured in Supabase Dashboard:
-- 1. "profile-photos"  (Public)
-- 2. "kyc-documents"   (Private)
-- 3. "bouncer-gallery" (Public)
