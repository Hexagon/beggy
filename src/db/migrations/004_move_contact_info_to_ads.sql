-- ============================================================================
-- Migration: Move contact information from profiles to ads
-- ============================================================================
-- This migration removes contact_phone and contact_email from the profiles
-- table and adds them to the ads table instead.
--
-- This improves privacy by ensuring contact information is:
-- 1. Only associated with specific ads, not the user profile
-- 2. Automatically deleted when the ad is removed
-- 3. Reducing the amount of personal data stored
-- ============================================================================

-- Add contact columns to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Remove contact columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE profiles DROP COLUMN IF EXISTS contact_email;
