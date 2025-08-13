-- ===============================================
-- SIMPLE MEDIA FILES RLS POLICY FIX
-- ===============================================
-- This creates simple, working RLS policies for media_files

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow anonymous access to media files" ON media_files;
DROP POLICY IF EXISTS "Users can access media files for their timelines" ON media_files;
DROP POLICY IF EXISTS "Users can manage own media files" ON media_files;

-- Ensure media_files table exists and has proper structure
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make sure RLS is enabled
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can do everything with media files
-- We'll make it more restrictive later once it's working
CREATE POLICY "Authenticated users can manage media files" ON media_files
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow public (anonymous) users to SELECT media files
CREATE POLICY "Public can view media files" ON media_files
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON media_files TO authenticated;
GRANT SELECT ON media_files TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_media_files_event_id ON media_files(event_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Add comment
COMMENT ON TABLE media_files IS 'Media files attached to timeline events with simple RLS policies';