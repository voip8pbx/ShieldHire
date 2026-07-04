-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add FCM token columns to the users table
-- Run this in Supabase SQL Editor or as a migration file
-- ─────────────────────────────────────────────────────────────────────────────

-- Add fcm_token column (nullable; NULL means the device hasn't registered yet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token       TEXT,
  ADD COLUMN IF NOT EXISTS fcm_updated_at  TIMESTAMPTZ;

-- Index for quick lookup (useful if you query by token, e.g., to clean stale tokens)
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users (fcm_token)
  WHERE fcm_token IS NOT NULL;

-- Row-Level Security: Only the authenticated user can update their own FCM token.
-- (Assumes you already have RLS enabled on the users table.)
CREATE POLICY "Users can update own FCM token"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Example: Query all active FCM tokens (for broadcast notifications)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT id, fcm_token
-- FROM   users
-- WHERE  fcm_token IS NOT NULL
--   AND  fcm_updated_at > NOW() - INTERVAL '30 days';  -- only recent tokens
