-- Add authId column to users table to link Supabase Auth Users to Public Profiles
-- This allows us to keep existing Profile IDs (referenced by bookings/bouncers) 
-- while using Supabase Auth for login (as a fallback or secondary option).

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authId" UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_authId ON "users"("authId");

-- Optional: Function to auto-create profile on signup (Supabase Auth fallback)
-- Handle name from metadata or fallback to email prefix
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

-- Trigger (Disabled by default, uncomment if using Supabase Auth alongside Firebase)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
