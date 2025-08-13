-- ===============================================
-- MEDIA FILES TABLE SETUP AND PERMISSIONS FIX
-- ===============================================
-- This ensures the media_files table exists with proper RLS policies

-- Create media_files table if it doesn't exist
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_files_event_id ON media_files(event_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Grant permissions to authenticated users
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON media_files TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable RLS
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access media files for events they can access
CREATE POLICY "Users can access media files for their timelines" ON media_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON t.id = te.timeline_id
            WHERE te.id = media_files.event_id
            AND (
                t.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM timeline_shares ts
                    WHERE ts.timeline_id = t.id
                    AND ts.shared_with_user_id = auth.uid()
                    AND ts.status = 'accepted'
                    AND ts.is_active = true
                )
            )
        )
    );

-- RLS Policy: Allow anonymous access to media files (for public links)
CREATE POLICY "Allow anonymous access to media files" ON media_files
    FOR SELECT USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_media_files_updated_at();

-- Comments
COMMENT ON TABLE media_files IS 'Media files attached to timeline events';
COMMENT ON COLUMN media_files.event_id IS 'Reference to the timeline event this media belongs to';
COMMENT ON COLUMN media_files.file_url IS 'Public URL to access the file';
COMMENT ON COLUMN media_files.file_type IS 'MIME type of the file (image/jpeg, video/mp4, etc.)';
COMMENT ON COLUMN media_files.file_size IS 'File size in bytes';