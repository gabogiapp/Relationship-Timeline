-- ===============================================
-- CLEAN TIMELINE SHARING SCHEMA (Google Docs Style)
-- ===============================================
-- Simple sharing model without RLS complexity

-- Drop existing tables if they exist
DROP TABLE IF EXISTS timeline_shares CASCADE;
DROP TABLE IF EXISTS timeline_activity_log CASCADE;
DROP TABLE IF EXISTS timeline_notifications CASCADE;
DROP TABLE IF EXISTS timeline_share_links CASCADE;

-- ===============================================
-- CORE TABLES
-- ===============================================

-- Users table (should already exist from Supabase Auth)
-- We'll reference auth.users(id) for user authentication

-- Timelines table (should already exist)
-- If not, here's a simple version:
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT FALSE,
    public_link_token VARCHAR(50) UNIQUE
);

-- Timeline events/memories (should already exist)
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(255),
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    color VARCHAR(50) DEFAULT 'blue',
    event_type VARCHAR(50) DEFAULT 'memory',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ===============================================
-- SHARING SYSTEM (Google Docs Style)
-- ===============================================

-- Simple sharing table - each record represents one user's access to one timeline
CREATE TABLE timeline_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL, -- Store email for invitations
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('viewer', 'editor', 'owner')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one record per user per timeline
    UNIQUE(timeline_id, user_id),
    UNIQUE(timeline_id, email)
);

-- Public sharing links (like Google Docs share links)
CREATE TABLE timeline_public_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    link_token VARCHAR(50) NOT NULL UNIQUE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- One active link per timeline
    UNIQUE(timeline_id)
);

-- ===============================================
-- HELPER FUNCTIONS
-- ===============================================

-- Function to get user's permission for a timeline
CREATE OR REPLACE FUNCTION get_user_timeline_permission(
    user_id_param UUID,
    timeline_id_param UUID
) RETURNS VARCHAR(20) AS $$
DECLARE
    permission VARCHAR(20);
BEGIN
    -- Check if user is the owner
    SELECT 'owner' INTO permission
    FROM timelines 
    WHERE id = timeline_id_param AND owner_id = user_id_param;
    
    IF permission IS NOT NULL THEN
        RETURN permission;
    END IF;
    
    -- Check collaborator permission
    SELECT permission_level INTO permission
    FROM timeline_collaborators 
    WHERE timeline_id = timeline_id_param 
    AND user_id = user_id_param 
    AND status = 'accepted';
    
    RETURN COALESCE(permission, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access timeline
CREATE OR REPLACE FUNCTION can_user_access_timeline(
    user_id_param UUID,
    timeline_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
    permission VARCHAR(20);
    is_public BOOLEAN;
BEGIN
    -- Check permission
    permission := get_user_timeline_permission(user_id_param, timeline_id_param);
    
    IF permission != 'none' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if timeline is public
    SELECT timelines.is_public INTO is_public
    FROM timelines 
    WHERE id = timeline_id_param;
    
    RETURN COALESCE(is_public, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_timelines_owner_id ON timelines(owner_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_collaborators_timeline_id ON timeline_collaborators(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_collaborators_user_id ON timeline_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_collaborators_email ON timeline_collaborators(email);
CREATE INDEX IF NOT EXISTS idx_timeline_public_links_token ON timeline_public_links(link_token);

-- ===============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_timelines_updated_at ON timelines;
CREATE TRIGGER update_timelines_updated_at
    BEFORE UPDATE ON timelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER update_timeline_events_updated_at
    BEFORE UPDATE ON timeline_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- GRANT PERMISSIONS (NO RLS!)
-- ===============================================

-- Grant full access to authenticated users
-- We'll handle permissions in the application layer instead of database RLS
GRANT ALL ON timelines TO authenticated;
GRANT ALL ON timeline_events TO authenticated;
GRANT ALL ON timeline_collaborators TO authenticated;
GRANT ALL ON timeline_public_links TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===============================================
-- SAMPLE DATA FOR TESTING
-- ===============================================

-- This will be handled by the application
-- INSERT INTO timelines (title, description, owner_id) VALUES (...);

-- ===============================================
-- NOTES
-- ===============================================

-- This schema is intentionally simple and RLS-free:
-- 1. All permissions are handled in the application layer
-- 2. timeline_collaborators table works like Google Docs sharing
-- 3. Public links work with tokens, no complex policies
-- 4. Each user can have one permission level per timeline
-- 5. Owners are stored in the timelines.owner_id field
-- 6. Simple status tracking for invitations (pending/accepted/declined)

COMMENT ON TABLE timeline_collaborators IS 'Google Docs style sharing - each record represents one users access to one timeline';
COMMENT ON TABLE timeline_public_links IS 'Public sharing links with tokens, like Google Docs share links';
COMMENT ON FUNCTION get_user_timeline_permission IS 'Returns users permission level for a timeline: owner, editor, viewer, or none';
COMMENT ON FUNCTION can_user_access_timeline IS 'Checks if user can access timeline (either through permission or public access)';