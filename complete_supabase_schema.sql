-- =============================================
-- ShieldHire - Complete Integrated Supabase Schema
-- Combined from main schema + FCM token migration
-- Run this in: Supabase Dashboard → SQL Editor
-- SAFE MODE: Does not delete existing tables.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
-- Includes 'authId' to link Supabase Auth Users while keeping independent profile IDs
-- Includes 'fcm_token' for Firebase Cloud Messaging push notifications
CREATE TABLE IF NOT EXISTS "users" (
    "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "authId"        UUID UNIQUE,                    -- Links to auth.users(id)
    "email"         TEXT UNIQUE NOT NULL,
    "password"      TEXT DEFAULT '',
    "name"          TEXT NOT NULL,
    "contactNo"     TEXT,
    "age"           INTEGER,
    "profilePhoto"  TEXT,
    "role"          TEXT NOT NULL DEFAULT 'USER',   -- USER, BOUNCER, GUNMAN, ADMIN
    "googleId"      TEXT UNIQUE,

    -- FCM (Firebase Cloud Messaging) push notification token
    "fcm_token"     TEXT,                           -- NULL = device not registered yet
    "fcm_updated_at" TIMESTAMPTZ,                   -- Timestamp of last token upsert

    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_auth_user FOREIGN KEY ("authId") REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes on users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_authId     ON "users"("authId");
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON "users"("fcm_token")
  WHERE "fcm_token" IS NOT NULL;          -- Partial index — only indexed rows have a token

-- =============================================
-- 1.5. CLIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "clients" (
    "id"                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"              UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name"                TEXT,
    "contactNo"           TEXT,
    "age"                 INTEGER,
    "gender"              TEXT,
    "profilePhoto"        TEXT,
    "location"            TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. BOUNCERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "bouncers" (
    "id"                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"              UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name"                TEXT NOT NULL,
    "contactNo"           TEXT NOT NULL,
    "age"                 INTEGER NOT NULL,
    "gender"              TEXT NOT NULL,
    "profilePhoto"        TEXT,
    "govtIdPhoto"         TEXT DEFAULT '',
    "hasGunLicense"       BOOLEAN DEFAULT FALSE,
    "gunLicensePhoto"     TEXT,
    "isGunman"            BOOLEAN DEFAULT FALSE,
    "registrationType"    TEXT DEFAULT 'Individual',
    "agencyReferralCode"  TEXT,
    "rating"              FLOAT DEFAULT 0.0,
    "isAvailable"         BOOLEAN DEFAULT TRUE,

    -- Profile details
    "bio"        TEXT,
    "skills"     TEXT[] DEFAULT '{}',
    "experience" INTEGER DEFAULT 0,
    "gallery"    TEXT[] DEFAULT '{}',

    -- Verification
    "verificationStatus" TEXT DEFAULT 'PENDING',    -- PENDING, APPROVED, REJECTED
    "verifiedBy"         TEXT,
    "verifiedAt"         TIMESTAMPTZ,
    "rejectionReason"    TEXT,

    -- Identity Verification (Case 4)
    "identity_verified"  BOOLEAN DEFAULT FALSE,
    "aadhaar_last_4"     TEXT,
    "liveness_verified_at" TIMESTAMPTZ,

    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_bouncer_verification" ON "bouncers"("verificationStatus");
CREATE INDEX IF NOT EXISTS "idx_bouncer_available"    ON "bouncers"("isAvailable");

-- =============================================
-- 3. BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "bookings" (
    "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"     UUID NOT NULL REFERENCES "users"("id"),
    "bouncerId"  UUID NOT NULL REFERENCES "bouncers"("id"),
    "date"       TIMESTAMPTZ NOT NULL,
    "time"       TEXT,
    "status"     TEXT DEFAULT 'PENDING',            -- PENDING, CONFIRMED, REJECTED, COMPLETED
    "location"   TEXT,                              -- Event location name/address
    "latitude"   FLOAT,                             -- Event location latitude for map marker
    "longitude"  FLOAT,                             -- Event location longitude for map marker
    "duration"   INTEGER DEFAULT 4,
    "totalPrice" FLOAT,
    "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_booking_user"    ON "bookings"("userId");
CREATE INDEX IF NOT EXISTS "idx_booking_bouncer" ON "bookings"("bouncerId");
CREATE INDEX IF NOT EXISTS "idx_booking_date"    ON "bookings"("date");

-- =============================================
-- 4. REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "reviews" (
    "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rating"    INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment"   TEXT,
    "bookingId" UUID UNIQUE NOT NULL REFERENCES "bookings"("id"),
    "userId"    UUID NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. EMERGENCY ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "emergency_alerts" (
    "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"    UUID NOT NULL REFERENCES "users"("id"),
    "latitude"  FLOAT,
    "longitude" FLOAT,
    "location"  TEXT,
    "status"    TEXT DEFAULT 'OPEN',                -- OPEN, RESOLVED, DISMISSED
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_alert_status" ON "emergency_alerts"("status");
CREATE INDEX IF NOT EXISTS "idx_alert_user"   ON "emergency_alerts"("userId");

-- =============================================
-- 6. NOTIFICATIONS TABLE (History)
-- =============================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "type"      TEXT,                   -- BOOKING_REQUEST, HIRE_CONFIRMED, etc.
    "data"      JSONB DEFAULT '{}',     -- Structured payload
    "isRead"    BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_notification_user" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "idx_notification_created" ON "notifications"("createdAt");

-- =============================================
-- 7. TRIGGER FUNCTIONS
-- =============================================

-- 6.1 Auto-update 'updatedAt' timestamp on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 6.2 Auto-create a user profile row when a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
  user_role TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'USER');

  INSERT INTO public."users" ("authId", "email", "name", "role", "profilePhoto")
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    user_role,
    new.raw_user_meta_data->>'avatar_url'
  ) RETURNING id INTO new_user_id;

  IF user_role = 'USER' THEN
    INSERT INTO public."clients" ("userId", "name", "profilePhoto")
    VALUES (
      new_user_id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Auto-notify users if their profile information is missing
CREATE OR REPLACE FUNCTION public.check_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for missing contact information
    IF (NEW."contactNo" IS NULL OR NEW."contactNo" = '') THEN
        INSERT INTO public."notifications" ("userId", "title", "body", "type")
        VALUES (
            NEW.id,
            'Profile Incomplete ⚠️',
            'Please update your contact number to receive booking updates.',
            'PROFILE_UPDATE'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- Check for missing push token
    IF (NEW."fcm_token" IS NULL) THEN
        INSERT INTO public."notifications" ("userId", "title", "body", "type")
        VALUES (
            NEW.id,
            'Notifications Disabled 🔔',
            'Please enable notifications in settings to stay updated with your hires.',
            'SETTING_UPDATE'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Auto-notify bouncers if their bio or photos are missing
CREATE OR REPLACE FUNCTION public.check_bouncer_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW."bio" IS NULL OR NEW."bio" = '' OR NEW."profilePhoto" IS NULL) THEN
        INSERT INTO public."notifications" ("userId", "title", "body", "type")
        VALUES (
            NEW."userId",
            'Bouncer Profile Incomplete 🛡️',
            'Adding a bio and photo increases your chances of getting hired by 80%!',
            'PROFILE_UPDATE'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. APPLY TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bouncers_updated_at ON "bouncers";
CREATE TRIGGER update_bouncers_updated_at
  BEFORE UPDATE ON "bouncers"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON "bookings";
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON "bookings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_alerts_updated_at ON "emergency_alerts";
CREATE TRIGGER update_emergency_alerts_updated_at
  BEFORE UPDATE ON "emergency_alerts"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Supabase Auth → auto-create profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS notify_incomplete_user_profile ON "users";
CREATE TRIGGER notify_incomplete_user_profile
  AFTER INSERT OR UPDATE OF "contactNo", "fcm_token" ON "users"
  FOR EACH ROW EXECUTE FUNCTION check_profile_completeness();

DROP TRIGGER IF EXISTS notify_incomplete_bouncer_profile ON "bouncers";
CREATE TRIGGER notify_incomplete_bouncer_profile
  AFTER INSERT OR UPDATE OF "bio", "profilePhoto" ON "bouncers"
  FOR EACH ROW EXECUTE FUNCTION check_bouncer_profile_completeness();

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

ALTER TABLE "users"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bouncers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_alerts" ENABLE ROW LEVEL SECURITY;

-- 8.1 Users Policies
DROP POLICY IF EXISTS "Public user access" ON "users";
CREATE POLICY "Public user access"
  ON "users" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update self" ON "users";
CREATE POLICY "Users can update self"
  ON "users" FOR UPDATE
  USING (auth.uid() = "authId")
  WITH CHECK (auth.uid() = "authId");
  -- NOTE: This single policy covers ALL updates by the user, including FCM token.
  --       The FCM service writes fcm_token via the backend using service_role key,
  --       which bypasses RLS entirely — no separate policy needed.

-- 8.2 Bouncers Policies
DROP POLICY IF EXISTS "Anyone can view approved bouncers" ON "bouncers";
CREATE POLICY "Anyone can view approved bouncers"
  ON "bouncers" FOR SELECT
  USING ("verificationStatus" = 'APPROVED');

-- Clients RLS
CREATE POLICY "Clients are viewable by everyone" ON public."clients"
FOR SELECT USING (true);

CREATE POLICY "Users can update their own client profile" ON public."clients"
FOR UPDATE USING (auth.uid() = (SELECT "authId" FROM public."users" WHERE id = "userId"));

-- Bouncers RLS
DROP POLICY IF EXISTS "Bouncers can manage self" ON "bouncers";
CREATE POLICY "Bouncers can manage self" ON public."bouncers" FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "users"
    WHERE "users"."id" = "bouncers"."userId"
      AND "users"."authId" = auth.uid()
  ));

-- 8.3 Bookings Policies
DROP POLICY IF EXISTS "Bookings visibility" ON "bookings";
CREATE POLICY "Bookings visibility"
  ON "bookings" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can create bookings" ON "bookings";
CREATE POLICY "Clients can create bookings"
  ON "bookings" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update booking status" ON "bookings";
CREATE POLICY "Update booking status"
  ON "bookings" FOR UPDATE USING (true);

-- 8.4 Alerts & Reviews
DROP POLICY IF EXISTS "Alerts management" ON "emergency_alerts";
CREATE POLICY "Alerts management" ON "emergency_alerts" FOR ALL USING (true);
DROP POLICY IF EXISTS "Reviews management" ON "reviews";
CREATE POLICY "Reviews management" ON "reviews"          FOR ALL USING (true);

-- 8.5 Notifications (Self only)
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON "notifications";
CREATE POLICY "Users can view own notifications"
  ON "notifications" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "users"
    WHERE "users"."id" = "notifications"."userId"
      AND "users"."authId" = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON "notifications";
CREATE POLICY "Users can mark own notifications as read"
  ON "notifications" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "users"
    WHERE "users"."id" = "notifications"."userId"
      AND "users"."authId" = auth.uid()
  ));

-- =============================================
-- 9. STORAGE BUCKETS (Reference)
-- =============================================
-- Ensure these exist and are configured in Supabase Dashboard:
-- 1. "profile-photos"  (Public)
-- 2. "kyc-documents"   (Private)
-- 3. "bouncer-gallery" (Public)

-- =============================================
-- 10. USEFUL REFERENCE QUERIES
-- =============================================

-- Get all users with an active FCM token (registered in last 30 days):
-- SELECT id, email, fcm_token
-- FROM   "users"
-- WHERE  fcm_token IS NOT NULL
--   AND  fcm_updated_at > NOW() - INTERVAL '30 days';

-- Broadcast: get all active bouncer FCM tokens:
-- SELECT u.id, u.fcm_token
-- FROM   "users" u
-- JOIN   "bouncers" b ON b."userId" = u.id
-- WHERE  u.fcm_token IS NOT NULL
--   AND  b."isAvailable" = TRUE;

-- =============================================
-- 11. DB UPGRADES / MIGRATIONS
-- =============================================

-- Ensure case 4 identity verification columns exist on bouncers table
ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "identity_verified" BOOLEAN DEFAULT FALSE;
ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "aadhaar_last_4" TEXT;
ALTER TABLE "bouncers" ADD COLUMN IF NOT EXISTS "liveness_verified_at" TIMESTAMPTZ;

