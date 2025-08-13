-- ENABLE SHARING TABLES AND POLICIES
-- ====================================
-- This script ensures all sharing tables have proper RLS policies

-- 1. Make sure sharing tables exist (from the main schema)
-- These should already exist, but let's make sure RLS is set up correctly

-- Enable RLS on sharing tables
ALTER TABLE timeline_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies and create permissive ones for now
DROP POLICY IF EXISTS "Users can view shares for their timelines" ON timeline_shares;
DROP POLICY IF EXISTS "Timeline owners can manage shares" ON timeline_shares;
DROP POLICY IF EXISTS "Timeline owners can manage share links" ON timeline_share_links;
DROP POLICY IF EXISTS "Users can view activity for accessible timelines" ON timeline_activity_log;
DROP POLICY IF EXISTS "Users can insert activity for accessible timelines" ON timeline_activity_log;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow timeline sharing operations" ON timeline_shares
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND owner_id = auth.uid()
    ) OR shared_with_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Allow share link operations" ON timeline_share_links
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Allow activity log access" ON timeline_activity_log
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM timeline_shares 
          WHERE timeline_shares.timeline_id = timelines.id 
          AND shared_with_user_id = auth.uid() 
          AND is_active = true
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timelines 
      WHERE id = timeline_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM timeline_shares 
          WHERE timeline_shares.timeline_id = timelines.id 
          AND shared_with_user_id = auth.uid() 
          AND permission_level IN ('editor', 'admin') 
          AND is_active = true
        )
      )
    )
  );