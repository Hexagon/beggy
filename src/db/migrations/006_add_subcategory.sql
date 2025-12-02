-- ============================================================================
-- Migration: Add subcategory column to ads table
-- ============================================================================
-- This migration adds the subcategory column to the ads table.
-- Subcategories allow more specific categorization of ads, for example
-- "Fordon" category can have subcategories like "Bilar", "Motorcyklar", etc.
--
-- The subcategory column is optional (TEXT, nullable) and stores a slug
-- that references the subcategory configuration in the application.
-- ============================================================================

-- Add subcategory column to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add index on subcategory for faster filtering
CREATE INDEX IF NOT EXISTS idx_ads_subcategory ON ads(subcategory);
