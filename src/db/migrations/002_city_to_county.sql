-- ============================================================================
-- Migration: Replace city with county (län) for location filtering
-- ============================================================================
-- This migration removes city from profiles and replaces city with county
-- in the ads table. County is now required for all ads.
-- 
-- Swedish counties (län) provide a standardized way to filter ads by location,
-- with support for including adjacent counties in searches.
-- ============================================================================

-- Remove city column from profiles table (location now tied to ads only)
ALTER TABLE profiles DROP COLUMN IF EXISTS city;

-- Rename city to county in ads table and make it required
-- First, add the county column if it doesn't exist
ALTER TABLE ads ADD COLUMN IF NOT EXISTS county TEXT;

-- Copy existing city data to county (if any)
UPDATE ads SET county = city WHERE county IS NULL AND city IS NOT NULL;

-- Set default value for any remaining NULL counties
UPDATE ads SET county = 'Stockholm' WHERE county IS NULL;

-- Now make county NOT NULL
ALTER TABLE ads ALTER COLUMN county SET NOT NULL;

-- Drop the old city column
ALTER TABLE ads DROP COLUMN IF EXISTS city;

-- Add index on county for faster filtering
CREATE INDEX IF NOT EXISTS idx_ads_county ON ads(county);
