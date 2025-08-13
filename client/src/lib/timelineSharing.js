/**
 * TIMELINE SHARING SYSTEM API
 * ===========================
 * This module provides all the API functions and utilities for timeline sharing functionality.
 * It includes user sharing, link sharing, permission management, and activity logging.
 */

import { supabase, isSupabaseAvailable } from './supabase';
import toast from 'react-hot-toast';

// Permission levels constants
export const PERMISSION_LEVELS = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Activity types constants
export const ACTIVITY_TYPES = {
  CREATE_EVENT: 'create_event',
  EDIT_EVENT: 'edit_event',
  DELETE_EVENT: 'delete_event',
  SHARE_TIMELINE: 'share_timeline',
  UNSHARE_TIMELINE: 'unshare_timeline',
  CHANGE_PERMISSION: 'change_permission',
  CREATE_SHARE_LINK: 'create_share_link',
  DELETE_SHARE_LINK: 'delete_share_link',
  ACCESS_VIA_LINK: 'access_via_link'
};

/**
 * PERMISSION UTILITIES
 * ====================
 */

// Check if a permission level includes another level
export const hasPermission = (userPermission, requiredPermission) => {
  if (!userPermission) return false;
  
  const hierarchy = {
    [PERMISSION_LEVELS.VIEWER]: 1,
    [PERMISSION_LEVELS.EDITOR]: 2,
    [PERMISSION_LEVELS.ADMIN]: 3,
    [PERMISSION_LEVELS.OWNER]: 4
  };
  
  return hierarchy[userPermission] >= hierarchy[requiredPermission];
};

// Format permission level for display
export const formatPermissionLevel = (permission) => {
  switch (permission) {
    case PERMISSION_LEVELS.OWNER: return 'Owner';
    case PERMISSION_LEVELS.ADMIN: return 'Admin';
    case PERMISSION_LEVELS.EDITOR: return 'Editor';
    case PERMISSION_LEVELS.VIEWER: return 'Viewer';
    default: return 'Unknown';
  }
};

/**
 * TIMELINE MANAGEMENT API
 * =======================
 */

export const timelineAPI = {
  // Get all timelines for a user (owned + shared)
  async getUserTimelines(userId) {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, returning empty timelines');
      return [];
    }

    try {
      // First, link any email invitations to this user account
      await this.linkEmailInvitations(userId);

      // Try to use the helper function first
      const { data, error } = await supabase
        .rpc('get_user_timelines', { user_uuid: userId });
      
      if (error) {
        console.log('RPC function not available, using direct query');
        throw error;
      }
      return data || [];
    } catch (error) {
      console.log('Error with RPC, trying direct query:', error);
      
      // Enhanced fallback that includes shared timelines
      try {
        // Get user's email for linking invitations
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email;

        console.log('Fetching timelines for user:', userId, 'email:', userEmail);

        // Get owned timelines
        const { data: ownedTimelines, error: ownedError } = await supabase
          .from('timelines')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: true });
        
        if (ownedError) {
          console.error('Error fetching owned timelines:', ownedError);
          throw ownedError;
        }

        console.log('Owned timelines found:', ownedTimelines?.length || 0);
        
        // Get shared timelines (both by user_id and email)
        console.log('Querying shared timelines for:', { userId, userEmail });
        
        let sharedTimelines = [];
        let sharedError = null;

        try {
          // Try a combined query with OR condition
          console.log('Trying combined query with OR condition...');
          let combinedQuery = supabase
            .from('timeline_shares')
            .select(`
              *,
              timelines (*)
            `)
            .eq('is_active', true);

          // Use OR condition for both user_id and email if email exists
          if (userEmail) {
            combinedQuery = combinedQuery.or(`shared_with_user_id.eq.${userId},shared_with_email.eq.${userEmail}`);
          } else {
            combinedQuery = combinedQuery.eq('shared_with_user_id', userId);
          }

          const { data: combinedResults, error: combinedError } = await combinedQuery;

          if (combinedError) {
            console.error('Combined query failed:', combinedError);
            
            // Fallback: try separate queries
            console.log('Trying separate queries as fallback...');
            
            // Try by user_id
            const { data: sharedByUserId, error: userIdError } = await supabase
              .from('timeline_shares')
              .select(`
                *,
                timelines (*)
              `)
              .eq('is_active', true)
              .eq('shared_with_user_id', userId);

            if (userIdError) {
              console.error('Error querying by user_id:', userIdError);
              sharedError = userIdError;
            } else {
              sharedTimelines = sharedByUserId || [];
              console.log('Shared timelines by user_id:', sharedTimelines.length);
            }

            // Try by email if available
            if (userEmail) {
              const { data: sharedByEmail, error: emailError } = await supabase
                .from('timeline_shares')
                .select(`
                  *,
                  timelines (*)
                `)
                .eq('is_active', true)
                .eq('shared_with_email', userEmail);

              if (emailError) {
                console.error('Error querying by email:', emailError);
                if (!sharedError) sharedError = emailError;
              } else {
                const emailResults = sharedByEmail || [];
                console.log('Shared timelines by email:', emailResults.length);
                // Combine results, avoiding duplicates
                const existingIds = new Set(sharedTimelines.map(s => s.id));
                const newResults = emailResults.filter(s => !existingIds.has(s.id));
                sharedTimelines = [...sharedTimelines, ...newResults];
              }
            }
          } else {
            sharedTimelines = combinedResults || [];
            console.log('Combined query successful, found:', sharedTimelines.length);
          }
        } catch (error) {
          console.error('Error in shared timeline query:', error);
          sharedError = error;
        }
        
        if (sharedError && sharedTimelines.length === 0) {
          console.error('Error getting shared timelines:', sharedError);
          // Continue with just owned timelines
        } else {
          console.log('Shared timelines found:', sharedTimelines?.length || 0);
        }

        // Format owned timelines
        const owned = (ownedTimelines || []).map(timeline => ({
          ...timeline,
          permission_level: PERMISSION_LEVELS.OWNER,
          is_owner: true
        }));

        // Format shared timelines
        const shared = (sharedTimelines || []).map(share => ({
          ...share.timelines,
          permission_level: share.permission_level,
          is_owner: false,
          share_id: share.id,
          shared_by_user_id: share.shared_by_user_id,
          owner_email: 'Shared Timeline' // Simplified for now
        }));

        console.log('Final timelines:', { owned: owned.length, shared: shared.length });
        
        return [...owned, ...shared];
      } catch (fallbackError) {
        console.error('Direct query also failed:', fallbackError);
        return [];
      }
    }
  },

  // Link email invitations to user account when they sign in
  async linkEmailInvitations(userId) {
    if (!isSupabaseAvailable()) return;

    try {
      // Get user's email
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      
      console.log('Linking email invitations for:', { userId, userEmail });
      
      if (!userEmail) return;

      // First check what invitations exist for this email
      const { data: existingInvitations, error: checkError } = await supabase
        .from('timeline_shares')
        .select('*')
        .eq('shared_with_email', userEmail.toLowerCase())
        .is('shared_with_user_id', null);

      // Handle RLS blocking the query
      if (checkError) {
        console.log('RLS blocked email invitation query (this is normal):', checkError.message);
        
        // If RLS blocks the SELECT query, try updating directly
        // This will only succeed if there are actually records to update
        try {
          const { data, error: updateError } = await supabase
            .from('timeline_shares')
            .update({ shared_with_user_id: userId })
            .eq('shared_with_email', userEmail.toLowerCase())
            .is('shared_with_user_id', null)
            .select();

          if (updateError) {
            console.log('No email invitations to link (RLS protected)');
          } else if (data && data.length > 0) {
            console.log(`✅ Linked ${data.length} email invitations to user account`);
          } else {
            console.log('No email invitations found to link');
          }
        } catch (directError) {
          console.log('Direct update also blocked by RLS (no invitations to link)');
        }
        return;
      }

      console.log('Found email invitations to link:', existingInvitations?.length || 0);

      if (existingInvitations && existingInvitations.length > 0) {
        // Update timeline_shares records that match this email but don't have user_id
        const { data, error } = await supabase
          .from('timeline_shares')
          .update({ shared_with_user_id: userId })
          .eq('shared_with_email', userEmail.toLowerCase())
          .is('shared_with_user_id', null)
          .select();

        if (error) {
          console.error('Error linking email invitations:', error);
        } else if (data && data.length > 0) {
          console.log(`✅ Linked ${data.length} email invitations to user account`);
        }
      }
    } catch (error) {
      console.log('Email invitation linking failed (this is normal if no invitations exist):', error.message);
    }
  },

  // Ensure user has a default timeline (creates one if none exists)
  async ensureDefaultTimeline(userId) {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      // Check if user already has timelines using simple query
      const { data: existingTimelines, error: checkError } = await supabase
        .from('timelines')
        .select('*')
        .eq('owner_id', userId)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing timelines:', checkError);
        return null;
      }
      
      if (existingTimelines && existingTimelines.length > 0) {
        // Return the first timeline
        return {
          ...existingTimelines[0],
          permission_level: PERMISSION_LEVELS.OWNER,
          is_owner: true
        };
      }
      
      // Create a default timeline
      console.log('Creating default timeline for user:', userId);
      const defaultTimelineData = {
        title: 'My Timeline',
        description: 'My personal timeline of memories and moments',
        owner_id: userId,
        is_private: true,
        color: '#10B981',
        settings: {}
      };

      try {
        const newTimeline = await this.createTimeline(defaultTimelineData);
        return {
          ...newTimeline,
          permission_level: PERMISSION_LEVELS.OWNER,
          is_owner: true
        };
      } catch (createError) {
        console.error('Error creating default timeline:', createError);
        return null;
      }
    } catch (error) {
      console.error('Error ensuring default timeline:', error);
      return null;
    }
  },

  // Create a new timeline
  async createTimeline(timelineData) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timelines')
      .insert([timelineData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update timeline
  async updateTimeline(timelineId, updates) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timelines')
      .update(updates)
      .eq('id', timelineId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete timeline
  async deleteTimeline(timelineId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('timelines')
      .delete()
      .eq('id', timelineId);

    if (error) throw error;
  }
};

/**
 * USER SHARING API
 * ================
 */

export const userSharingAPI = {
  // Share timeline with a user by email
  async shareWithUser(timelineId, email, permissionLevel, sharedByUserId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const normalizedEmail = email.toLowerCase();
    
    try {
      // First, check if a share already exists (active or inactive)
      const { data: existingShare, error: checkError } = await supabase
        .from('timeline_shares')
        .select('*')
        .eq('timeline_id', timelineId)
        .eq('shared_with_email', normalizedEmail)
        .single();

      if (existingShare) {
        // Update existing share to make it active
        console.log('Updating existing share:', existingShare.id);
        const { data, error } = await supabase
          .from('timeline_shares')
          .update({
            permission_level: permissionLevel,
            shared_by_user_id: sharedByUserId,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingShare.id)
          .select();
          
        if (error) throw error;
        return data[0];
      } else {
        // Create new share
        console.log('Creating new share for:', normalizedEmail);
        const shareData = {
          timeline_id: timelineId,
          shared_with_email: normalizedEmail,
          permission_level: permissionLevel,
          shared_by_user_id: sharedByUserId,
          is_active: true
        };

        const { data, error } = await supabase
          .from('timeline_shares')
          .insert([shareData])
          .select();

        if (error) throw error;
        return data[0];
      }
    } catch (error) {
      console.log('Error checking existing share:', error);
      
      // Handle various error cases more gracefully
      if (
        error.code === 'PGRST116' || // Not found
        error.message?.includes('406') || // Not Acceptable (RLS blocking)
        error.message?.includes('PGRST301') || // RLS policy violation
        !error.code // Generic supabase errors
      ) {
        console.log('Share check failed, attempting to create new share directly');
        
        // Try to create a new share directly (RLS should allow INSERT for timeline owners)
        try {
          const shareData = {
            timeline_id: timelineId,
            shared_with_email: normalizedEmail,
            permission_level: permissionLevel,
            shared_by_user_id: sharedByUserId,
            is_active: true
          };

          const { data, error: insertError } = await supabase
            .from('timeline_shares')
            .insert([shareData])
            .select();

          if (insertError) {
            // If INSERT also fails, check if it's because the record already exists
            if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
              console.log('Share already exists, trying to update it');
              
              // Get all shares for this timeline (should work for timeline owners)
              const { data: allShares, error: allError } = await supabase
                .from('timeline_shares')
                .select('*')
                .eq('timeline_id', timelineId);
                
              if (allError) throw insertError; // If we can't even get the shares, give up
              
              const existingByEmail = allShares.find(s => s.shared_with_email === normalizedEmail);
              if (existingByEmail) {
                // Update the existing share
                const { data: updateData, error: updateError } = await supabase
                  .from('timeline_shares')
                  .update({
                    permission_level: permissionLevel,
                    shared_by_user_id: sharedByUserId,
                    is_active: true,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingByEmail.id)
                  .select();
                  
                if (updateError) throw updateError;
                return updateData[0];
              }
            }
            throw insertError;
          }
          
          return data[0];
        } catch (directError) {
          console.error('Direct share creation also failed:', directError);
          throw directError;
        }
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  },

  // Get all users shared with a timeline
  async getTimelineUsers(timelineId) {
    if (!isSupabaseAvailable()) {
      return [];
    }

    const { data, error } = await supabase
      .from('timeline_shares')
      .select('*')
      .eq('timeline_id', timelineId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update user permission
  async updateUserPermission(shareId, newPermission, updatedByUserId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timeline_shares')
      .update({ permission_level: newPermission })
      .eq('id', shareId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Remove user access (soft delete by setting is_active to false)
  async removeUserAccess(shareId, removedByUserId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    console.log('Removing user access for share ID:', shareId);

    const { data, error } = await supabase
      .from('timeline_shares')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', shareId)
      .select();

    if (error) {
      console.error('Error removing user access:', error);
      throw error;
    }

    console.log('Successfully deactivated share:', data[0]);
    return data[0];
  },

  // Permanently delete a share (use with caution)
  async permanentlyDeleteShare(shareId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    console.log('Permanently deleting share ID:', shareId);

    const { error } = await supabase
      .from('timeline_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Error permanently deleting share:', error);
      throw error;
    }

    console.log('Successfully deleted share permanently');
  }
};

/**
 * LINK SHARING API
 * ================
 */

export const linkSharingAPI = {
  // Create a share link
  async createShareLink(timelineId, permissionLevel, createdByUserId, options = {}) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const shareToken = generateShareToken();
    const linkData = {
      timeline_id: timelineId,
      share_token: shareToken,
      permission_level: permissionLevel,
      created_by_user_id: createdByUserId,
      expires_at: options.expiresAt || null,
      password_hash: options.passwordHash || null,
      is_active: true,
      access_count: 0
    };

    const { data, error } = await supabase
      .from('timeline_share_links')
      .insert([linkData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all share links for a timeline
  async getTimelineShareLinks(timelineId) {
    if (!isSupabaseAvailable()) {
      return [];
    }

    const { data, error } = await supabase
      .from('timeline_share_links')
      .select('*')
      .eq('timeline_id', timelineId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get timeline via share link
  async getTimelineViaLink(shareToken, password = null) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    // Get the share link
    const { data: linkData, error: linkError } = await supabase
      .from('timeline_share_links')
      .select(`
        *,
        timelines (*)
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (linkError) {
      if (linkError.code === 'PGRST116') {
        throw new Error('Invalid share link');
      }
      throw linkError;
    }

    // Check expiration
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }

    // Check password if required
    if (linkData.password_hash) {
      if (!password) {
        throw new Error('Password required');
      }
      
      // Simple password check (use proper bcrypt in production)
      const hashedPassword = hashPassword(password);
      if (hashedPassword !== linkData.password_hash) {
        throw new Error('Invalid password');
      }
    }

    // Increment access count
    try {
      await supabase
        .from('timeline_share_links')
        .update({ access_count: linkData.access_count + 1 })
        .eq('id', linkData.id);
    } catch (error) {
      console.error('Error updating access count:', error);
      // Don't fail the whole request for this
    }

    return {
      timeline: linkData.timelines,
      permission: linkData.permission_level
    };
  },

  // Delete share link
  async deleteShareLink(linkId, deletedByUserId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('timeline_share_links')
      .update({ is_active: false })
      .eq('id', linkId);

    if (error) throw error;
  }
};

/**
 * ACTIVITY LOGGING API
 * ====================
 */

export const activityAPI = {
  // Log an activity
  async logActivity(activityData) {
    if (!isSupabaseAvailable()) {
      return; // Silently fail if database not available
    }

    try {
      const { error } = await supabase
        .from('timeline_activity_log')
        .insert([activityData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for logging failures
    }
  },

  // Get timeline activity
  async getTimelineActivity(timelineId, limit = 50) {
    if (!isSupabaseAvailable()) {
      return [];
    }

    const { data, error } = await supabase
      .from('timeline_activity_log')
      .select('*')
      .eq('timeline_id', timelineId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};

/**
 * UTILITY FUNCTIONS
 * =================
 */

// Generate a random share token
function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple password hashing (use bcrypt in production)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Generate share URL
export const generateShareURL = (shareToken) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareToken}`;
};

/**
 * NOTIFICATIONS API
 * =================
 */

export const notificationsAPI = {
  // Get all notifications for a user
  async getUserNotifications(userId, options = {}) {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      let query = supabase
        .from('timeline_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  },

  // Get unread notification count
  async getUnreadCount(userId) {
    if (!isSupabaseAvailable()) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('timeline_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timeline_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timeline_notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .select();

    if (error) throw error;
    return data;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('timeline_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    return data;
  },

  // Delete notification
  async deleteNotification(notificationId) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('timeline_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Delete multiple notifications
  async deleteMultiple(notificationIds) {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('timeline_notifications')
      .delete()
      .in('id', notificationIds);

    if (error) throw error;
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId, callback) {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      const subscription = supabase
        .channel('timeline-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'timeline_notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('New notification received:', payload.new);
          callback(payload.new);
        })
        .subscribe();

      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return null;
    }
  },

  // Unsubscribe from real-time notifications
  unsubscribeFromNotifications(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};

// Check if user has permission on timeline
export const checkTimelinePermission = async (timelineId, userId, requiredPermission) => {
  if (!isSupabaseAvailable()) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_timeline_permission', {
        timeline_uuid: timelineId,
        user_uuid: userId
      });

    if (error) throw error;
    return hasPermission(data, requiredPermission);
  } catch (error) {
    console.error('Error checking timeline permission:', error);
    return false;
  }
};

export default {
  PERMISSION_LEVELS,
  ACTIVITY_TYPES,
  hasPermission,
  formatPermissionLevel,
  timelineAPI,
  userSharingAPI,
  linkSharingAPI,
  activityAPI,
  notificationsAPI,
  generateShareURL,
  checkTimelinePermission
};