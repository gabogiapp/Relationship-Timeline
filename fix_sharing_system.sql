-- ===============================================
-- TIMELINE SHARING SYSTEM SCHEMA FIX
-- ===============================================
-- This creates the correct sharing tables that match the code expectations

-- Drop old tables if they exist
DROP TABLE IF EXISTS timeline_collaborators CASCADE;
DROP TABLE IF EXISTS timeline_public_links CASCADE;

-- Create the sharing tables that the code expects
CREATE TABLE IF NOT EXISTS timeline_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255) NOT NULL,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active share per email per timeline
    UNIQUE(timeline_id, shared_with_email, is_active)
);

-- Create share links table
CREATE TABLE IF NOT EXISTS timeline_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    share_token VARCHAR(50) NOT NULL UNIQUE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor')),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One active link per timeline
    UNIQUE(timeline_id, is_active) WHERE is_active = TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timeline_shares_timeline_id ON timeline_shares(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_shares_user_id ON timeline_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_shares_email ON timeline_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_timeline_shares_status ON timeline_shares(status);
CREATE INDEX IF NOT EXISTS idx_timeline_share_links_token ON timeline_share_links(share_token);

-- Grant permissions
GRANT ALL ON timeline_shares TO authenticated;
GRANT ALL ON timeline_share_links TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===============================================
-- HELPER FUNCTIONS FOR INVITATIONS
-- ===============================================

-- Function to get pending invitations for a user
CREATE OR REPLACE FUNCTION get_user_pending_invitations(user_id_param UUID)
RETURNS TABLE (
    share_id UUID,
    timeline_id UUID,
    timeline_title VARCHAR,
    timeline_description TEXT,
    shared_by_email VARCHAR,
    permission_level VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Get user's email
    DECLARE
        user_email VARCHAR;
    BEGIN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = user_id_param;
        
        IF user_email IS NULL THEN
            RETURN;
        END IF;
        
        RETURN QUERY
        SELECT 
            ts.id as share_id,
            ts.timeline_id,
            t.title as timeline_title,
            t.description as timeline_description,
            sharer.email as shared_by_email,
            ts.permission_level,
            ts.created_at
        FROM timeline_shares ts
        JOIN timelines t ON ts.timeline_id = t.id
        JOIN auth.users sharer ON ts.shared_by_user_id = sharer.id
        WHERE ts.shared_with_email = user_email
        AND ts.status = 'pending'
        AND ts.is_active = TRUE
        ORDER BY ts.created_at DESC;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept timeline invitation
CREATE OR REPLACE FUNCTION accept_timeline_invitation(share_id_param UUID, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_email VARCHAR;
    share_record timeline_shares%ROWTYPE;
BEGIN
    -- Get user's email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    IF user_email IS NULL THEN
        RETURN '{"success": false, "error": "User not found"}'::JSON;
    END IF;
    
    -- Get the share record and verify it belongs to this user
    SELECT * INTO share_record 
    FROM timeline_shares 
    WHERE id = share_id_param 
    AND shared_with_email = user_email
    AND status = 'pending'
    AND is_active = TRUE;
    
    IF share_record.id IS NULL THEN
        RETURN '{"success": false, "error": "Invitation not found or already processed"}'::JSON;
    END IF;
    
    -- Update the share record
    UPDATE timeline_shares 
    SET 
        shared_with_user_id = user_id_param,
        status = 'accepted',
        updated_at = NOW()
    WHERE id = share_id_param;
    
    -- Return success with timeline info
    SELECT json_build_object(
        'success', true,
        'timeline_id', share_record.timeline_id,
        'permission_level', share_record.permission_level
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline timeline invitation
CREATE OR REPLACE FUNCTION decline_timeline_invitation(share_id_param UUID, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_email VARCHAR;
BEGIN
    -- Get user's email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    IF user_email IS NULL THEN
        RETURN '{"success": false, "error": "User not found"}'::JSON;
    END IF;
    
    -- Update the share record to declined
    UPDATE timeline_shares 
    SET 
        status = 'declined',
        updated_at = NOW()
    WHERE id = share_id_param 
    AND shared_with_email = user_email
    AND status = 'pending'
    AND is_active = TRUE;
    
    IF FOUND THEN
        RETURN '{"success": true}'::JSON;
    ELSE
        RETURN '{"success": false, "error": "Invitation not found or already processed"}'::JSON;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- UPDATE TRIGGERS
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to sharing tables
DROP TRIGGER IF EXISTS update_timeline_shares_updated_at ON timeline_shares;
CREATE TRIGGER update_timeline_shares_updated_at
    BEFORE UPDATE ON timeline_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- COMMENTS
-- ===============================================

COMMENT ON TABLE timeline_shares IS 'Timeline sharing system - tracks user permissions for shared timelines';
COMMENT ON TABLE timeline_share_links IS 'Public sharing links with tokens for anonymous access';
COMMENT ON FUNCTION get_user_pending_invitations IS 'Returns pending timeline invitations for a user';
COMMENT ON FUNCTION accept_timeline_invitation IS 'Accepts a timeline sharing invitation';
COMMENT ON FUNCTION decline_timeline_invitation IS 'Declines a timeline sharing invitation';