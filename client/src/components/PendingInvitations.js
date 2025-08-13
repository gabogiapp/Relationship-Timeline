/**
 * PENDING INVITATIONS COMPONENT
 * =============================
 * Shows pending timeline invitations that users can accept or decline
 * Displays as a modal or notification area
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Check, 
  X, 
  Users, 
  Clock, 
  Eye, 
  Edit,
  Crown,
  AlertCircle
} from 'lucide-react';
import { sharingService } from '../services/sharingService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PendingInvitations = ({ onTimelineSelect, onInvitationHandled }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState(null);

  useEffect(() => {
    if (user) {
      loadPendingInvitations();
    }
  }, [user]);

  const loadPendingInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const pendingInvitations = await sharingService.getPendingInvitations(user.id);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      // Don't show error toast for this as it might be expected if tables don't exist
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    setProcessingInvitation(invitation.share_id);
    try {
      await sharingService.acceptInvitation(invitation.share_id, user.id);
      
      // Remove from pending list
      setInvitations(prev => prev.filter(inv => inv.share_id !== invitation.share_id));
      
      // Show success message
      toast.success(`You now have access to "${invitation.timeline_title}"!`, {
        duration: 4000,
        icon: '🎉',
      });

      // Notify parent component
      if (onInvitationHandled) {
        onInvitationHandled('accepted', invitation);
      }

      // Optionally switch to the timeline
      if (onTimelineSelect) {
        const timelineData = {
          id: invitation.timeline_id,
          title: invitation.timeline_title,
          description: invitation.timeline_description,
          permission_level: invitation.permission_level,
          is_owner: false,
          color: '#10B981' // Default color
        };
        onTimelineSelect(timelineData);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    setProcessingInvitation(invitation.share_id);
    try {
      await sharingService.declineInvitation(invitation.share_id, user.id);
      
      // Remove from pending list
      setInvitations(prev => prev.filter(inv => inv.share_id !== invitation.share_id));
      
      toast.success('Invitation declined');

      // Notify parent component
      if (onInvitationHandled) {
        onInvitationHandled('declined', invitation);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="pending-invitations-loading">
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading invitations...</span>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no invitations
  }

  return (
    <div className="pending-invitations">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">
              Timeline Invitations ({invitations.length})
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              You have been invited to collaborate on {invitations.length === 1 ? 'a timeline' : 'some timelines'}. 
              Accept to start viewing and contributing!
            </p>
            
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const PermissionIcon = getPermissionIcon(invitation.permission_level);
                const permissionColor = getPermissionColor(invitation.permission_level);
                const isProcessing = processingInvitation === invitation.share_id;

                return (
                  <div 
                    key={invitation.share_id} 
                    className="bg-white border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {invitation.timeline_title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${permissionColor} flex items-center gap-1`}>
                            <PermissionIcon className="w-3 h-3" />
                            {invitation.permission_level}
                          </span>
                        </div>
                        
                        {invitation.timeline_description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {invitation.timeline_description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Shared by {invitation.shared_by_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(invitation.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          {isProcessing ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Accept
                        </button>
                        
                        <button
                          onClick={() => handleDeclineInvitation(invitation)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingInvitations;
