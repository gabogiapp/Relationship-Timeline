/**
 * TIMELINE SHARE MODAL
 * ===================
 * This component provides a comprehensive interface for sharing timelines,
 * similar to Google Docs sharing modal with:
 * - User invitations by email
 * - Permission level management
 * - Public link sharing
 * - Share link settings (password, expiration)
 * - Activity log
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Link, 
  Users, 
  Clock, 
  Shield, 
  Copy, 
  Trash2, 
  Edit, 
  Eye,
  UserPlus,
  Settings,
  Activity,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  userSharingAPI, 
  linkSharingAPI, 
  activityAPI,
  PERMISSION_LEVELS,
  hasPermission,
  generateShareURL,
  formatPermissionLevel 
} from '../lib/timelineSharing';
import { useAuth } from '../contexts/AuthContext';

const TimelineShareModal = ({ timeline, isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'links', 'activity'
  const [loading, setLoading] = useState(false);
  
  // User sharing state
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState(PERMISSION_LEVELS.VIEWER);
  const [sharedUsers, setSharedUsers] = useState([]);
  
  // Link sharing state
  const [shareLinks, setShareLinks] = useState([]);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [newLinkPermission, setNewLinkPermission] = useState(PERMISSION_LEVELS.VIEWER);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkExpiration, setLinkExpiration] = useState('');
  
  // Activity state
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    if (isOpen && timeline) {
      loadSharedUsers();
      loadShareLinks();
      loadActivityLog();
    }
  }, [isOpen, timeline]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  const loadSharedUsers = async () => {
    try {
      const users = await userSharingAPI.getTimelineUsers(timeline.id);
      setSharedUsers(users || []);
    } catch (error) {
      if (error.message?.includes('403') || error.message?.includes('permission denied')) {
        console.log('🔒 Timeline sharing RLS policies need to be updated. Run complete_rls_fix.sql in Supabase.');
      } else {
        console.error('Error loading shared users:', error);
      }
      setSharedUsers([]);
    }
  };

  const loadShareLinks = async () => {
    try {
      const links = await linkSharingAPI.getTimelineShareLinks(timeline.id);
      setShareLinks(links || []);
    } catch (error) {
      if (error.message?.includes('403') || error.message?.includes('permission denied')) {
        console.log('🔒 Share links RLS policies need to be updated. Run complete_rls_fix.sql in Supabase.');
      } else {
        console.error('Error loading share links:', error);
      }
      setShareLinks([]);
    }
  };

  const loadActivityLog = async () => {
    try {
      const activity = await activityAPI.getTimelineActivity(timeline.id);
      setActivityLog(activity || []);
    } catch (error) {
      if (error.message?.includes('403') || error.message?.includes('permission denied')) {
        console.log('🔒 Activity log RLS policies need to be updated. Run complete_rls_fix.sql in Supabase.');
      } else {
        console.error('Error loading activity log:', error);
      }
      setActivityLog([]);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      await userSharingAPI.shareWithUser(
        timeline.id,
        inviteEmail.trim(),
        invitePermission,
        user.id
      );
      
      const email = inviteEmail.trim();
      setInviteEmail('');
      setInvitePermission(PERMISSION_LEVELS.VIEWER);
      await loadSharedUsers();
      await loadActivityLog();
      toast.success(`Timeline shared with ${email}! They will receive a notification.`);
    } catch (error) {
      if (error.message?.includes('403') || error.message?.includes('permission denied')) {
        toast.error('Timeline sharing is not set up yet. Please run the database fix first.', { 
          duration: 6000 
        });
        console.log('🔒 To fix timeline sharing, run complete_rls_fix.sql in your Supabase Dashboard → SQL Editor');
      } else {
        toast.error(`Failed to share timeline: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (shareId, newPermission) => {
    setLoading(true);
    try {
      await userSharingAPI.updateUserPermission(shareId, newPermission, user.id);
      await loadSharedUsers();
      await loadActivityLog();
      toast.success('Permission updated successfully! User will be notified.');
    } catch (error) {
      if (error.message?.includes('403') || error.message?.includes('permission denied')) {
        toast.error('Timeline sharing is not set up yet. Please run the database fix first.', { 
          duration: 6000 
        });
        console.log('🔒 To fix timeline sharing, run complete_rls_fix.sql in your Supabase Dashboard → SQL Editor');
      } else {
        toast.error(`Failed to update permission: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (shareId) => {
    if (!window.confirm('Remove access for this user?')) return;

    setLoading(true);
    try {
      await userSharingAPI.removeUserAccess(shareId, user.id);
      await loadSharedUsers();
      await loadActivityLog();
      toast.success('User access removed');
    } catch (error) {
      toast.error(`Failed to remove access: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const options = {};
      if (linkPassword.trim()) {
        // Simple hash for demo - use bcrypt in production
        options.passwordHash = hashPassword(linkPassword.trim());
      }
      if (linkExpiration) {
        options.expiresAt = new Date(linkExpiration).toISOString();
      }

      await linkSharingAPI.createShareLink(
        timeline.id,
        newLinkPermission,
        user.id,
        options
      );

      setShowCreateLink(false);
      setLinkPassword('');
      setLinkExpiration('');
      setNewLinkPermission(PERMISSION_LEVELS.VIEWER);
      
      await loadShareLinks();
      await loadActivityLog();
      toast.success('Share link created');
    } catch (error) {
      toast.error(`Failed to create share link: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = (shareToken) => {
    const url = generateShareURL(shareToken);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleDeleteShareLink = async (linkId) => {
    if (!window.confirm('Delete this share link?')) return;

    setLoading(true);
    try {
      await linkSharingAPI.deleteShareLink(linkId, user.id);
      await loadShareLinks();
      await loadActivityLog();
      toast.success('Share link deleted');
    } catch (error) {
      toast.error(`Failed to delete share link: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Simple hash function for demo
  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !timeline) return null;

  const canManageSharing = hasPermission(timeline.permission_level, PERMISSION_LEVELS.ADMIN) || 
                          timeline.permission_level === PERMISSION_LEVELS.OWNER;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container timeline-share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share "{timeline.title}"</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="share-tabs">
          <button 
            className={`share-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            People
          </button>
          <button 
            className={`share-tab ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <Link size={16} />
            Links
          </button>
          <button 
            className={`share-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={16} />
            Activity
          </button>
        </div>

        <div className="modal-content">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="share-users-tab">
              {canManageSharing && (
                <form onSubmit={handleInviteUser} className="invite-user-form">
                  <div className="invite-input-group">
                    <div className="invite-email-wrapper">
                      <Mail size={16} />
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <select 
                      value={invitePermission}
                      onChange={(e) => setInvitePermission(e.target.value)}
                    >
                      <option value={PERMISSION_LEVELS.VIEWER}>Viewer</option>
                      <option value={PERMISSION_LEVELS.EDITOR}>Editor</option>
                      <option value={PERMISSION_LEVELS.ADMIN}>Admin</option>
                    </select>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                      <UserPlus size={16} />
                      Invite
                    </button>
                  </div>
                </form>
              )}

              <div className="shared-users-list">
                <div className="shared-user-item">
                  <div className="user-avatar">
                    <div className="avatar-placeholder">
                      {user.email?.charAt(0).toUpperCase() || 'O'}
                    </div>
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.email || 'You'}</div>
                    <div className="user-role">Owner</div>
                  </div>
                </div>

                {sharedUsers.map((share) => (
                  <div key={share.id} className="shared-user-item">
                    <div className="user-avatar">
                      <div className="avatar-placeholder">
                        {share.shared_with_email?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {share.shared_with_email}
                        {!share.shared_with_user_id && (
                          <span className="pending-badge">Pending</span>
                        )}
                      </div>
                      <div className="user-role">
                        {formatPermissionLevel(share.permission_level)}
                      </div>
                    </div>
                    {canManageSharing && (
                      <div className="user-actions">
                        <select
                          value={share.permission_level}
                          onChange={(e) => handleUpdatePermission(share.id, e.target.value)}
                          disabled={loading}
                        >
                          <option value={PERMISSION_LEVELS.VIEWER}>Viewer</option>
                          <option value={PERMISSION_LEVELS.EDITOR}>Editor</option>
                          <option value={PERMISSION_LEVELS.ADMIN}>Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveUser(share.id)}
                          disabled={loading}
                          className="btn-icon btn-danger"
                          title="Remove access"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="share-links-tab">
              {canManageSharing && (
                <>
                  <button
                    onClick={() => setShowCreateLink(true)}
                    className="btn btn-outline create-link-btn"
                  >
                    <Link size={16} />
                    Create share link
                  </button>

                  {showCreateLink && (
                    <form onSubmit={handleCreateShareLink} className="create-link-form">
                      <div className="form-group">
                        <label>Permission Level</label>
                        <select
                          value={newLinkPermission}
                          onChange={(e) => setNewLinkPermission(e.target.value)}
                        >
                          <option value={PERMISSION_LEVELS.VIEWER}>Viewer</option>
                          <option value={PERMISSION_LEVELS.EDITOR}>Editor</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Password (optional)</label>
                        <input
                          type="password"
                          placeholder="Leave empty for no password"
                          value={linkPassword}
                          onChange={(e) => setLinkPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Expiration (optional)</label>
                        <input
                          type="datetime-local"
                          value={linkExpiration}
                          onChange={(e) => setLinkExpiration(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-actions">
                        <button type="button" onClick={() => setShowCreateLink(false)} className="btn btn-outline">
                          Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                          Create Link
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              <div className="share-links-list">
                {shareLinks.map((link) => (
                  <div key={link.id} className="share-link-item">
                    <div className="link-icon">
                      <Link size={20} />
                    </div>
                    <div className="link-info">
                      <div className="link-details">
                        <span className="link-permission">
                          {formatPermissionLevel(link.permission_level)} Link
                        </span>
                        {link.password_hash && <Shield size={14} title="Password protected" />}
                        {link.expires_at && <Clock size={14} title={`Expires: ${formatDate(link.expires_at)}`} />}
                      </div>
                      <div className="link-stats">
                        Accessed {link.access_count} times
                        {link.expires_at && (
                          <span className="link-expiry">
                            • Expires {formatDate(link.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="link-actions">
                      <button
                        onClick={() => handleCopyShareLink(link.share_token)}
                        className="btn-icon"
                        title="Copy link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => window.open(generateShareURL(link.share_token), '_blank')}
                        className="btn-icon"
                        title="Open link"
                      >
                        <ExternalLink size={16} />
                      </button>
                      {canManageSharing && (
                        <button
                          onClick={() => handleDeleteShareLink(link.id)}
                          className="btn-icon btn-danger"
                          title="Delete link"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {shareLinks.length === 0 && (
                  <div className="empty-state">
                    <Link size={48} />
                    <p>No share links created yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="share-activity-tab">
              <div className="activity-list">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.action_type)}
                    </div>
                    <div className="activity-details">
                      <div className="activity-description">
                        {formatActivityDescription(activity)}
                      </div>
                      <div className="activity-time">
                        {formatDate(activity.created_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {activityLog.length === 0 && (
                  <div className="empty-state">
                    <Activity size={48} />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for activity display
const getActivityIcon = (actionType) => {
  switch (actionType) {
    case 'share_timeline': return <UserPlus size={16} />;
    case 'unshare_timeline': return <Trash2 size={16} />;
    case 'change_permission': return <Settings size={16} />;
    case 'create_share_link': return <Link size={16} />;
    case 'delete_share_link': return <Trash2 size={16} />;
    case 'access_via_link': return <ExternalLink size={16} />;
    case 'create_event': return <div className="activity-dot create" />;
    case 'edit_event': return <Edit size={16} />;
    case 'delete_event': return <Trash2 size={16} />;
    default: return <div className="activity-dot" />;
  }
};

const formatActivityDescription = (activity) => {
  const userEmail = activity.user?.email || 'Unknown user';
  
  switch (activity.action_type) {
    case 'share_timeline':
      return `${userEmail} shared timeline with ${activity.action_data.shared_with_email}`;
    case 'unshare_timeline':
      return `${userEmail} removed access for ${activity.action_data.shared_with_email}`;
    case 'change_permission':
      return `${userEmail} changed permissions to ${formatPermissionLevel(activity.action_data.new_permission)}`;
    case 'create_share_link':
      return `${userEmail} created a ${formatPermissionLevel(activity.action_data.permission_level)} share link`;
    case 'delete_share_link':
      return `${userEmail} deleted a share link`;
    case 'access_via_link':
      return `Someone accessed timeline via share link`;
    case 'create_event':
      return `${userEmail} created a new event`;
    case 'edit_event':
      return `${userEmail} edited an event`;
    case 'delete_event':
      return `${userEmail} deleted an event`;
    default:
      return `${userEmail} performed an action`;
  }
};

export default TimelineShareModal;