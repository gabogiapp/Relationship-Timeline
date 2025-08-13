import React, { useState } from 'react';
import { AlertTriangle, Database, CheckCircle, Copy, ExternalLink } from 'lucide-react';

const SetupGuide = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- ===============================================
-- CLEAN TIMELINE SHARING SCHEMA (Google Docs Style)
-- ===============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS timeline_shares CASCADE;
DROP TABLE IF EXISTS timeline_activity_log CASCADE;
DROP TABLE IF EXISTS timeline_notifications CASCADE;
DROP TABLE IF EXISTS timeline_share_links CASCADE;

-- Create timelines table (if not exists)
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

-- Create timeline events table (if not exists)
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

-- Simple sharing table - each record represents one user's access to one timeline
CREATE TABLE timeline_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('viewer', 'editor', 'owner')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(timeline_id, user_id),
    UNIQUE(timeline_id, email)
);

-- Public sharing links
CREATE TABLE timeline_public_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    link_token VARCHAR(50) NOT NULL UNIQUE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'editor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(timeline_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timelines_owner_id ON timelines(owner_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_collaborators_timeline_id ON timeline_collaborators(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_collaborators_user_id ON timeline_collaborators(user_id);

-- Grant permissions
GRANT ALL ON timelines TO authenticated;
GRANT ALL ON timeline_events TO authenticated;
GRANT ALL ON timeline_collaborators TO authenticated;
GRANT ALL ON timeline_public_links TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;`;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlSchema);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy SQL:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Database Setup Required</h2>
                <p className="text-gray-600">Set up the clean sharing system</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Access Supabase SQL Editor
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Go to your Supabase project dashboard and open the SQL Editor.
                  </p>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Supabase Dashboard</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Copy and Run SQL Schema
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Copy the SQL below and paste it into your Supabase SQL Editor, then click "Run".
                  </p>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400 text-sm font-mono">clean_schema.sql</span>
                      <button
                        onClick={handleCopySQL}
                        className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                      </button>
                    </div>
                    <pre className="text-gray-300 text-xs overflow-x-auto max-h-64">
                      {sqlSchema}
                    </pre>
                  </div>

                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> This will create the necessary tables for the Google Docs-style sharing system 
                      and remove any complex RLS policies that may have been causing issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Refresh the Application
                  </h3>
                  <p className="text-gray-700 mb-3">
                    After running the SQL, refresh this page to start using the new sharing system.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Refresh Application</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 p-6 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ✨ What You'll Get After Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Google Docs-style sharing</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Email-based invitations</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Public link sharing</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Permission management</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Fast timeline switching</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>No more RLS complexity</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Close & Skip Setup
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;