import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase not initialized")
  }
  return supabase
}

export function initDatabase(): void {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. " +
        "Please set them in your environment or .env file."
    )
  }

  supabase = createClient(supabaseUrl, supabaseKey)

  console.log("✅ Supabase initierad")
}

// SQL to run in Supabase SQL Editor to create tables:
/*
-- Users table (profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_images_ad_id ON images(ad_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for ads
CREATE POLICY "Anyone can view active ads" ON ads FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (auth.uid() = user_id);

-- Policies for images
CREATE POLICY "Anyone can view images" ON images FOR SELECT USING (true);
CREATE POLICY "Users can insert images for own ads" ON images FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_id AND ads.user_id = auth.uid()));
CREATE POLICY "Users can delete images for own ads" ON images FOR DELETE 
  USING (EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_id AND ads.user_id = auth.uid()));

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

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Användare'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
*/
