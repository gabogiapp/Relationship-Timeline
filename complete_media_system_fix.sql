-- ===============================================
-- COMPLETE MEDIA FILES SYSTEM FIX
-- ===============================================
-- This script fixes all media file upload issues

-- ===============================================
-- 1. MEDIA FILES TABLE SETUP
-- ===============================================

-- Drop existing table to recreate with correct structure
DROP TABLE IF EXISTS media_files CASCADE;

-- Create media_files table with correct structure
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_media_files_event_id ON media_files(event_id);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);

-- ===============================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on media_files table
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow anonymous access to media files" ON media_files;
DROP POLICY IF EXISTS "Users can access media files for their timelines" ON media_files;
DROP POLICY IF EXISTS "Users can manage own media files" ON media_files;
DROP POLICY IF EXISTS "Authenticated users can manage media files" ON media_files;
DROP POLICY IF EXISTS "Public can view media files" ON media_files;

-- Policy 1: Authenticated users can SELECT media files for their own timelines or shared timelines
CREATE POLICY "Users can view media files" ON media_files
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON t.id = te.timeline_id
            WHERE te.id = media_files.event_id
            AND (
                -- User owns the timeline
                t.owner_id = auth.uid()
                OR 
                -- Timeline is shared with the user
                EXISTS (
                    SELECT 1 FROM timeline_shares ts
                    WHERE ts.timeline_id = t.id
                    AND ts.shared_with_user_id = auth.uid()
                    AND ts.status = 'accepted'
                    AND ts.is_active = true
                )
            )
        )
    );

-- Policy 2: Authenticated users can INSERT media files for their own timelines
CREATE POLICY "Users can upload media files" ON media_files
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON t.id = te.timeline_id
            WHERE te.id = media_files.event_id
            AND t.owner_id = auth.uid()
        )
    );

-- Policy 3: Users can UPDATE/DELETE media files for their own timelines
CREATE POLICY "Users can manage their media files" ON media_files
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM timeline_events te
            JOIN timelines t ON t.id = te.timeline_id
            WHERE te.id = media_files.event_id
            AND t.owner_id = auth.uid()
        )
    );

-- Policy 4: Allow public access to media files (for sharing)
CREATE POLICY "Public can view media files" ON media_files
    FOR SELECT USING (true);

-- ===============================================
-- 3. GRANT PERMISSIONS
-- ===============================================

-- Grant table permissions
GRANT ALL ON media_files TO authenticated;
GRANT SELECT ON media_files TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ===============================================
-- 4. STORAGE BUCKET SETUP
-- ===============================================

-- Create the timeline-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('timeline-media', 'timeline-media', true)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- 5. STORAGE POLICIES
-- ===============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their media files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media files" ON storage.objects;

-- Policy 1: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload media files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'timeline-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 2: Users can view their own files and files in shared timelines
CREATE POLICY "Users can view media files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'timeline-media' AND
        (
            auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
            OR
            auth.role() = 'anon'
        )
    );

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete their media files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'timeline-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 4: Public can view all files (for sharing)
CREATE POLICY "Public can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'timeline-media');

-- ===============================================
-- 6. UPDATE TRIGGER
-- ===============================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_media_files_updated_at();

-- ===============================================
-- 7. HELPER FUNCTIONS
-- ===============================================

-- Function to get media files for an event
CREATE OR REPLACE FUNCTION get_event_media_files(event_id_param UUID)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.id,
        mf.file_name,
        mf.file_url,
        mf.file_type,
        mf.file_size,
        mf.created_at
    FROM media_files mf
    WHERE mf.event_id = event_id_param
    ORDER BY mf.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned media files
CREATE OR REPLACE FUNCTION cleanup_orphaned_media_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM media_files 
    WHERE event_id NOT IN (SELECT id FROM timeline_events);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 8. COMMENTS
-- ===============================================

COMMENT ON TABLE media_files IS 'Media files (images, videos) attached to timeline events';
COMMENT ON COLUMN media_files.event_id IS 'References the timeline event this media belongs to';
COMMENT ON COLUMN media_files.file_url IS 'Public URL to access the file in Supabase storage';
COMMENT ON COLUMN media_files.file_type IS 'MIME type of the file (e.g., image/jpeg, video/mp4)';
COMMENT ON COLUMN media_files.file_size IS 'File size in bytes';

COMMENT ON FUNCTION get_event_media_files IS 'Retrieves all media files for a specific timeline event';
COMMENT ON FUNCTION cleanup_orphaned_media_files IS 'Removes media file records that no longer have corresponding events';

-- ===============================================
-- 9. VERIFICATION QUERIES
-- ===============================================

-- Check if everything is set up correctly
SELECT 
    'media_files table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_files') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status;

SELECT 
    'timeline-media bucket' as component,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'timeline-media') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status;

-- Show RLS policies
SELECT schemaname, tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'media_files';

-- Show storage policies
SELECT policyname, cmd, qual 
FROM storage.policies 
WHERE bucket_id = 'timeline-media';

-- ===============================================
-- END OF SCRIPT
-- ===============================================