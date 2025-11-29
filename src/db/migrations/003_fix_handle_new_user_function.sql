-- ============================================================================
-- Migration: Fix handle_new_user function search_path
-- ============================================================================
-- This migration fixes the handle_new_user() trigger function by explicitly
-- setting the search_path to 'public'. This ensures the function can find
-- the profiles table when called from the auth.users trigger context.
--
-- Error fixed: "relation "profiles" does not exist (SQLSTATE 42P01)"
-- This error occurred because the function was called from the auth schema
-- context and couldn't resolve the profiles table without an explicit search_path.
-- ============================================================================

-- Drop the existing trigger first (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with explicit search_path set to public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', 'Användare'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
