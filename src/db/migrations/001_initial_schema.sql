-- ============================================================================
-- Initial Database Schema for Beggy
-- ============================================================================
-- This is the original schema that created the production database.
-- DO NOT MODIFY THIS FILE - it represents the initial database state.
-- 
-- For any database changes, create a new migration file with the next
-- sequential number (e.g., 002_add_new_feature.sql)
-- ============================================================================

-- Users table (profiles linked to auth.users)
-- Changed: name -> username, phone -> contact_phone, added contact_email
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  contact_phone TEXT,  -- Optional public contact phone (shown with warning)
  contact_email TEXT,  -- Optional public contact email (shown with warning)
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ads table
-- Changed: status -> state (ok, reported, expired, sold, deleted)
-- Added: expires_at (auto-expire after 30 days)
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'ok' CHECK (state IN ('ok', 'reported', 'expired', 'sold', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table (BBS law compliance)
-- Removed: reporter_ip_hash (not needed, privacy improvement)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Conversations table (for chat between buyer and seller)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encryption_key TEXT NOT NULL,  -- Encrypted conversation key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- Set to NOW() + 90 days when ad is deleted
  UNIQUE(ad_id, buyer_id)
);

-- Messages table (encrypted chat messages)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,  -- AES-GCM encrypted message
  iv TEXT NOT NULL,  -- Initialization vector for decryption
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_state ON ads(state);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_images_ad_id ON images(ad_id);
CREATE INDEX IF NOT EXISTS idx_reports_ad_id ON reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_conversations_ad_id ON conversations(ad_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for ads
CREATE POLICY "Anyone can view ok ads" ON ads FOR SELECT
  USING (state = 'ok' OR user_id = auth.uid());
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (auth.uid() = user_id);

-- Policies for images
CREATE POLICY "Anyone can view images" ON images FOR SELECT USING (true);
CREATE POLICY "Users can insert images for own ads" ON images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_id AND ads.user_id = auth.uid()));
CREATE POLICY "Users can delete images for own ads" ON images FOR DELETE
  USING (EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_id AND ads.user_id = auth.uid()));

-- Policies for reports (BBS law - anyone can report, no one can read reports except admin)
CREATE POLICY "Anyone can insert reports" ON reports FOR INSERT WITH CHECK (true);
-- Note: SELECT, UPDATE, DELETE policies for reports should be added for admin users only

-- Policies for conversations (only participants can access)
CREATE POLICY "Participants can view their conversations" ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update their conversations" ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policies for messages (only conversation participants can access)
CREATE POLICY "Participants can view messages" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  ));
CREATE POLICY "Participants can send messages" ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  ) AND auth.uid() = sender_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', 'Användare'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to auto-expire ads after 30 days
-- Run this as a scheduled job (e.g., pg_cron)
CREATE OR REPLACE FUNCTION expire_old_ads()
RETURNS void AS $$
BEGIN
  UPDATE ads
  SET state = 'expired'
  WHERE state = 'ok'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to set conversation expiry when ad is deleted
CREATE OR REPLACE FUNCTION set_conversation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'deleted' AND OLD.state != 'deleted' THEN
    UPDATE conversations
    SET expires_at = NOW() + INTERVAL '90 days'
    WHERE ad_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ad_deleted
  AFTER UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION set_conversation_expiry();

-- Function to clean up expired conversations
-- Run this as a scheduled job (e.g., pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM conversations
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
