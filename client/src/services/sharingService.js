// ===============================================
// FIXED SHARING SERVICE (Google Docs Style)
// ===============================================

import { supabase } from '../lib/supabase';

export class SharingService {
  // ===============================================
  // GET TIMELINES WITH ACCESS PERMISSIONS
  // ===============================================
  
  async getUserTimelines(userId) {
    try {
      // Get owned timelines
      const { data: ownTimelines, error: ownError } = await supabase
        .from('timelines')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

      if (ownError) {
        console.error('Error fetching own timelines:', ownError);
        return { own_timelines: [], shared_timelines: [] };
      }

      // Get memory counts for owned timelines
      const formattedOwnTimelines = [];
      for (const timeline of ownTimelines || []) {
        try {
          const { count } = await supabase
            .from('timeline_events')
            .select('*', { count: 'exact', head: true })
            .eq('timeline_id', timeline.id);
          
          formattedOwnTimelines.push({
            ...timeline,
            user_permission: 'owner',
            collaborators: [],
            memories_count: count || 0
          });
        } catch (error) {
          formattedOwnTimelines.push({
            ...timeline,
            user_permission: 'owner',
            collaborators: [],
            memories_count: 0
          });
        }
      }

      // Get shared timelines using the correct table
      let formattedSharedTimelines = [];
      try {
        // Get user's email for matching shares
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const { data: sharedData, error: sharedError } = await supabase
            .from('timeline_shares')
            .select(`
              *,
              timelines (*)
            `)
            .eq('shared_with_email', userEmail.toLowerCase())
            .eq('status', 'accepted')
            .eq('is_active', true);

          if (!sharedError && sharedData) {
            for (const share of sharedData) {
              if (share.timelines) {
                try {
                  const { count } = await supabase
                    .from('timeline_events')
                    .select('*', { count: 'exact', head: true })
                    .eq('timeline_id', share.timelines.id);

                  formattedSharedTimelines.push({
                    ...share.timelines,
                    user_permission: share.permission_level,
                    collaborators: [],
                    memories_count: count || 0,
                    share_id: share.id
                  });
                } catch (error) {
                  formattedSharedTimelines.push({
                    ...share.timelines,
                    user_permission: share.permission_level,
                    collaborators: [],
                    memories_count: 0,
                    share_id: share.id
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Sharing tables not available yet:', error);
      }

      return {
        own_timelines: formattedOwnTimelines,
        shared_timelines: formattedSharedTimelines
      };
    } catch (error) {
      console.error('Error fetching user timelines:', error);
      return { own_timelines: [], shared_timelines: [] };
    }
  }

  // ===============================================
  // SHARING METHODS
  // ===============================================

  async inviteUserToTimeline(timelineId, email, permission, invitedBy) {
    try {
      // Check if sharing tables exist
      const { error: tableCheckError } = await supabase
        .from('timeline_shares')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        throw new Error('Sharing system not available yet. Please apply the fix_sharing_system.sql file in your Supabase SQL editor first.');
      }

      // Check if user already has access
      const { data: existing } = await supabase
        .from('timeline_shares')
        .select('*')
        .eq('timeline_id', timelineId)
        .eq('shared_with_email', email.toLowerCase())
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('User already has access to this timeline');
        } else if (existing.status === 'pending') {
          // Update existing invitation
          const { data: updated, error } = await supabase
            .from('timeline_shares')
            .update({
              permission_level: permission,
              shared_by_user_id: invitedBy,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select('*')
            .single();

          if (error) throw error;
          return { ...updated, user: null, email: updated.shared_with_email };
        }
      }

      // Create new invitation
      const { data: newShare, error } = await supabase
        .from('timeline_shares')
        .insert({
          timeline_id: timelineId,
          shared_with_user_id: null, // Will be set when user accepts
          shared_with_email: email.toLowerCase(),
          permission_level: permission,
          status: 'pending',
          shared_by_user_id: invitedBy,
          is_active: true
        })
        .select('*')
        .single();

      if (error) throw error;
      return { ...newShare, user: null, email: newShare.shared_with_email };
    } catch (error) {
      console.error('Error inviting user to timeline:', error);
      throw error;
    }
  }

  async updateCollaboratorPermission(collaboratorId, newPermission) {
    try {
      const { error } = await supabase
        .from('timeline_shares')
        .update({ permission_level: newPermission })
        .eq('id', collaboratorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating collaborator permission:', error);
      throw error;
    }
  }

  async removeCollaborator(collaboratorId) {
    try {
      const { error } = await supabase
        .from('timeline_shares')
        .update({ is_active: false })
        .eq('id', collaboratorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  // ===============================================
  // COLLABORATOR MANAGEMENT
  // ===============================================

  async getTimelineCollaborators(timelineId) {
    try {
      const { data, error } = await supabase
        .from('timeline_shares')
        .select(`
          id,
          shared_with_email as email,
          shared_with_user_id as user_id,
          permission_level,
          status,
          created_at,
          shared_with_user_id (
            id,
            email
          )
        `)
        .eq('timeline_id', timelineId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(share => ({
        id: share.id,
        email: share.email,
        user_id: share.user_id,
        permission_level: share.permission_level,
        status: share.status,
        user: share.shared_with_user_id ? {
          id: share.shared_with_user_id.id,
          email: share.shared_with_user_id.email,
          name: share.shared_with_user_id.email.split('@')[0] // Simple name fallback
        } : null
      }));
    } catch (error) {
      console.error('Error getting timeline collaborators:', error);
      throw error;
    }
  }

  // ===============================================
  // INVITATION MANAGEMENT
  // ===============================================

  async getPendingInvitations(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_pending_invitations', { user_id_param: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  async acceptInvitation(shareId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('accept_timeline_invitation', { 
          share_id_param: shareId, 
          user_id_param: userId 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async declineInvitation(shareId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('decline_timeline_invitation', { 
          share_id_param: shareId, 
          user_id_param: userId 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  // ===============================================
  // PUBLIC SHARING
  // ===============================================

  async createPublicLink(timelineId, permission, userId) {
    try {
      const linkToken = this.generateLinkToken();
      
      // Create or update public link
      const { error: linkError } = await supabase
        .from('timeline_share_links')
        .upsert({
          timeline_id: timelineId,
          share_token: linkToken,
          permission_level: permission,
          is_active: true,
          created_by_user_id: userId
        });

      if (linkError) throw linkError;

      // Update timeline to mark as public
      const { error: timelineError } = await supabase
        .from('timelines')
        .update({ 
          is_public: true,
          public_link_token: linkToken
        })
        .eq('id', timelineId);

      if (timelineError) throw timelineError;

      return `${window.location.origin}/shared/${linkToken}`;
    } catch (error) {
      console.error('Error creating public link:', error);
      throw error;
    }
  }

  async disablePublicSharing(timelineId) {
    try {
      // Disable public link
      const { error: linkError } = await supabase
        .from('timeline_share_links')
        .update({ is_active: false })
        .eq('timeline_id', timelineId);

      if (linkError) throw linkError;

      // Update timeline
      const { error: timelineError } = await supabase
        .from('timelines')
        .update({ 
          is_public: false,
          public_link_token: null
        })
        .eq('id', timelineId);

      if (timelineError) throw timelineError;
    } catch (error) {
      console.error('Error disabling public sharing:', error);
      throw error;
    }
  }

  async getTimelineByPublicLink(linkToken) {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('timeline_share_links')
        .select(`
          *,
          timelines (
            *,
            owner:owner_id (id, email, name, avatar_url)
          )
        `)
        .eq('share_token', linkToken)
        .eq('is_active', true)
        .single();

      if (linkError) return null;

      // Get memory count
      const { count } = await supabase
        .from('timeline_events')
        .select('*', { count: 'exact', head: true })
        .eq('timeline_id', linkData.timelines.id);

      return {
        ...linkData.timelines,
        user_permission: linkData.permission_level,
        collaborators: [],
        memories_count: count || 0
      };
    } catch (error) {
      console.error('Error getting timeline by public link:', error);
      return null;
    }
  }

  // ===============================================
  // PERMISSION CHECKING
  // ===============================================

  async checkUserPermission(userId, timelineId) {
    try {
      // Check if owner
      const { data: timeline } = await supabase
        .from('timelines')
        .select('owner_id')
        .eq('id', timelineId)
        .single();

      if (timeline?.owner_id === userId) {
        return 'owner';
      }

      // Check collaborator permission
      const { data: collaborator } = await supabase
        .from('timeline_shares')
        .select('permission_level')
        .eq('timeline_id', timelineId)
        .eq('shared_with_user_id', userId)
        .eq('status', 'accepted')
        .eq('is_active', true)
        .single();

      return collaborator?.permission_level || 'none';
    } catch (error) {
      console.error('Error checking user permission:', error);
      return 'none';
    }
  }

  // ===============================================
  // CREATE TIMELINE
  // ===============================================

  async createTimeline(title, description, userId) {
    try {
      const { data: timeline, error } = await supabase
        .from('timelines')
        .insert({
          title,
          description,
          owner_id: userId
        })
        .select()
        .single();

      if (error) {
        if (error.message && error.message.includes('relation "timelines" does not exist')) {
          throw new Error('Database tables not set up yet. Please apply the fix_sharing_system.sql file in your Supabase SQL editor first.');
        }
        throw error;
      }
      return timeline;
    } catch (error) {
      console.error('Error creating timeline:', error);
      throw error;
    }
  }

  // ===============================================
  // UTILITIES
  // ===============================================

  generateLinkToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  canEdit(permission) {
    return ['owner', 'editor'].includes(permission);
  }

  canManageSharing(permission) {
    return permission === 'owner';
  }

  canView(permission) {
    return ['owner', 'editor', 'viewer'].includes(permission);
  }
}

export const sharingService = new SharingService();
