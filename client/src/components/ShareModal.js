import React, { useState, useEffect } from 'react';
import { X, Copy, Link, Mail, Users, Crown, Edit, Eye, UserPlus, Globe, Lock } from 'lucide-react';
import { sharingService } from '../services/sharingService';
import { useAuth } from '../contexts/AuthContext';

const ShareModal = ({ isOpen, onClose, timeline, onTimelineUpdate }) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen && timeline) {
      loadTimelineSharing();
    }
  }, [isOpen, timeline]);

  const loadTimelineSharing = async () => {
    if (!timeline) return;
    
    setLoading(true);
    try {
      // Load collaborators from the sharing service
      try {
        const timelineCollaborators = await sharingService.getTimelineCollaborators(timeline.id);
        setCollaborators(timelineCollaborators || []);
      } catch (error) {
        console.warn('Could not load collaborators:', error);
        setCollaborators(timeline.collaborators || []);
      }
      
      // Check if public sharing is enabled
      if (timeline.is_public && timeline.public_link_token) {
        setPublicLinkEnabled(true);
        setPublicLink(`${window.location.origin}/shared/${timeline.public_link_token}`);
      }
    } catch (error) {
      console.error('Error loading timeline sharing:', error);
      showMessage('error', 'Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !timeline || !user) return;

    setIsInviting(true);
    try {
      const newCollaborator = await sharingService.inviteUserToTimeline(
        timeline.id,
        inviteEmail.trim(),
        invitePermission,
        user.id
      );

      setCollaborators(prev => [...prev, newCollaborator]);
      setInviteEmail('');
      showMessage('success', 'Invitation sent successfully!');
      
      // Update parent timeline
      if (onTimelineUpdate) {
        onTimelineUpdate(timeline.id, {
          collaborators: [...collaborators, newCollaborator]
        });
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdatePermission = async (collaboratorId, newPermission) => {
    try {
      await sharingService.updateCollaboratorPermission(collaboratorId, newPermission);
      
      setCollaborators(prev => 
        prev.map(c => 
          c.id === collaboratorId 
            ? { ...c, permission_level: newPermission }
            : c
        )
      );
      
      showMessage('success', 'Permission updated');
    } catch (error) {
      showMessage('error', 'Failed to update permission');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await sharingService.removeCollaborator(collaboratorId);
      
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      showMessage('success', 'User removed from timeline');
    } catch (error) {
      showMessage('error', 'Failed to remove user');
    }
  };

  const handleTogglePublicLink = async () => {
    if (!timeline || !user) return;

    try {
      if (publicLinkEnabled) {
        // Disable public sharing
        await sharingService.disablePublicSharing(timeline.id);
        setPublicLinkEnabled(false);
        setPublicLink('');
        showMessage('success', 'Public sharing disabled');
      } else {
        // Enable public sharing
        const link = await sharingService.createPublicLink(timeline.id, 'viewer', user.id);
        setPublicLinkEnabled(true);
        setPublicLink(link);
        showMessage('success', 'Public link created');
      }

      // Update parent timeline
      if (onTimelineUpdate) {
        onTimelineUpdate(timeline.id, {
          is_public: !publicLinkEnabled,
          public_link_token: !publicLinkEnabled ? publicLink.split('/').pop() : null
        });
      }
    } catch (error) {
      showMessage('error', 'Failed to update public sharing');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      showMessage('success', 'Link copied to clipboard!');
    } catch (error) {
      showMessage('error', 'Failed to copy link');
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'owner': return Crown;
      case 'editor': return Edit;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'owner': return 'text-yellow-600 bg-yellow-100';
      case 'editor': return 'text-green-600 bg-green-100';
      case 'viewer': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  const isOwner = timeline?.owner_id === user?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Link className="w-5 h-5" />
              Share "{timeline?.title}"
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Collaborate with others on this timeline
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Message */}
          {message.text && (
            <div className={`mx-6 mt-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Public Link Section */}
          {isOwner && (
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Anyone with the link
                  </h3>
                  <p className="text-sm text-gray-600">
                    Share with people outside your organization
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicLinkEnabled}
                    onChange={handleTogglePublicLink}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {publicLinkEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={publicLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Anyone with this link can view your timeline
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Invite People Section */}
          {isOwner && (
            <div className="p-6 border-b">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite people
              </h3>

              <form onSubmit={handleInviteUser} className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isInviting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isInviting ? 'Inviting...' : 'Invite'}
                </button>
              </form>
            </div>
          )}

          {/* People with Access */}
          <div className="p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              People with access
            </h3>

            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-yellow-800">
                      {timeline?.owner?.name?.charAt(0) || timeline?.owner?.email?.charAt(0) || 'O'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{timeline?.owner?.name || timeline?.owner?.email || 'Owner'}</p>
                    <p className="text-sm text-gray-600">{timeline?.owner?.email}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-sm font-medium rounded-full text-yellow-800 bg-yellow-100 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Owner
                </span>
              </div>

              {/* Collaborators */}
              {collaborators.map((collaborator) => {
                const PermissionIcon = getPermissionIcon(collaborator.permission_level);
                const permissionColor = getPermissionColor(collaborator.permission_level);

                return (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {collaborator.user?.name?.charAt(0) || collaborator.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {collaborator.user?.name || collaborator.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {collaborator.email}
                          {collaborator.status === 'pending' && (
                            <span className="ml-2 text-yellow-600">(Invitation pending)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={collaborator.permission_level}
                            onChange={(e) => handleUpdatePermission(collaborator.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove access"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${permissionColor} flex items-center gap-1`}>
                          <PermissionIcon className="w-3 h-3" />
                          {collaborator.permission_level.charAt(0).toUpperCase() + collaborator.permission_level.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {collaborators.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No collaborators yet</p>
                  {isOwner && <p className="text-sm">Invite people to start collaborating!</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;