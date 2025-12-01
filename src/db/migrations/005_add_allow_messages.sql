-- ============================================================================
-- Migration: Add allow_messages field to ads
-- ============================================================================
-- This migration adds the allow_messages column to the ads table.
-- This allows users to choose whether to enable on-site messaging for each ad.
-- 
-- By default, allow_messages is TRUE (on-site messaging enabled).
-- Users must select at least one contact method when creating an ad.
-- ============================================================================

-- Add allow_messages column to ads table with default value of true
ALTER TABLE ads ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT TRUE;
