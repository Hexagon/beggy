-- Add read tracking per participant to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS buyer_last_read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_last_read_at TIMESTAMPTZ;