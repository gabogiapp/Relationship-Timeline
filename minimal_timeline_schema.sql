-- MINIMAL TIMELINE SCHEMA FOR QUICK SETUP
-- =========================================
-- This creates just the basic timeline table to get the app working

-- 1. CREATE TIMELINES TABLE
CREATE TABLE IF NOT EXISTS timelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_private BOOLEAN DEFAULT true NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  cover_image_url TEXT,
  color VARCHAR(20) DEFAULT '#10B981'
);

-- 2. UPDATE EXISTING TIMELINE_EVENTS TABLE
-- Add timeline_id column if it doesn't exist
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timelines_owner_id ON timelines(owner_id);

-- 3. ROW LEVEL SECURITY
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- Basic policies for timelines
CREATE POLICY "Users can view their own timelines" ON timelines
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own timelines" ON timelines
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own timelines" ON timelines
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own timelines" ON timelines
  FOR DELETE USING (auth.uid() = owner_id);

-- 4. CREATE A SIMPLE GET USER TIMELINES FUNCTION
CREATE OR REPLACE FUNCTION get_user_timelines(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_private BOOLEAN,
  settings JSONB,
  cover_image_url TEXT,
  color VARCHAR,
  permission_level TEXT,
  is_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.owner_id,
    t.created_at,
    t.updated_at,
    t.is_private,
    t.settings,
    t.cover_image_url,
    t.color,
    'owner'::TEXT as permission_level,
    true as is_owner
  FROM timelines t
  WHERE t.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE DEFAULT TIMELINE FOR EXISTING USERS
-- This will create a default timeline for users who don't have any
INSERT INTO timelines (title, description, owner_id, is_private, color)
SELECT 
  'My Timeline',
  'My personal timeline of memories and moments',
  user_id,
  true,
  '#10B981'
FROM (
  SELECT DISTINCT user_id
  FROM timeline_events te
  WHERE NOT EXISTS (
    SELECT 1 FROM timelines t WHERE t.owner_id = te.user_id
  )
) existing_users;

-- 6. LINK EXISTING EVENTS TO DEFAULT TIMELINES
-- Update existing events to link them to the user's default timeline
UPDATE timeline_events 
SET timeline_id = (
  SELECT t.id 
  FROM timelines t 
  WHERE t.owner_id = timeline_events.user_id 
  LIMIT 1
)
WHERE timeline_id IS NULL;

-- 7. CREATE TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION create_default_timeline_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timelines (title, description, owner_id, is_private, color)
  VALUES (
    'My Timeline',
    'My personal timeline of memories and moments',
    NEW.id,
    true,
    '#10B981'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to create timeline for new users
DROP TRIGGER IF EXISTS trigger_create_default_timeline ON auth.users;
CREATE TRIGGER trigger_create_default_timeline
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_timeline_for_user();