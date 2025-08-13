/**
 * NOTIFICATION CENTER
 * ===================
 * Comprehensive notification system for timeline sharing with:
 * - Real-time notifications
 * - Notification management (read/unread, delete)
 * - Different notification types
 * - Toast integration
 * - Responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Users, 
  Shield, 
  ExternalLink,
  Clock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../lib/timelineSharing';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = ({ onTimelineSelect }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      setupRealtimeSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        notificationsAPI.unsubscribeFromNotifications(subscriptionRef.current);
      }
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const notificationData = await notificationsAPI.getUserNotifications(user.id, { limit: 20 });
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsAPI.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      notificationsAPI.unsubscribeFromNotifications(subscriptionRef.current);
    }

    subscriptionRef.current = notificationsAPI.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.success(newNotification.title, {
          duration: 4000,
          icon: '🔔',
          action: {
            label: 'View',
            onClick: () => setIsOpen(true),
          },
        });
      }
    );
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Update unread count
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setLoading(true);
    try {
      await notificationsAPI.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if notification was unread
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationAction = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.notification_type) {
      case 'timeline_shared':
        console.log('Handling shared timeline notification:', notification);
        // Get the timeline from the notification data and select it
        if (onTimelineSelect && notification.data.timeline_title) {
          const timelineData = {
            id: notification.timeline_id,
            title: notification.data.timeline_title,
            permission_level: notification.data.permission_level,
            is_owner: false,
            // Add more data from notification for debugging
            color: notification.data.color || '#10B981',
            description: notification.data.description || ''
          };
          console.log('Selecting timeline from notification:', timelineData);
          onTimelineSelect(timelineData);
          setIsOpen(false);
          // Show success toast
          toast.success(`Switched to "${timelineData.title}"`);
        }
        break;
      
      case 'permission_changed':
        // Could navigate to the timeline or show more details
        if (onTimelineSelect) {
          const timelineData = {
            id: notification.timeline_id,
            title: notification.data.timeline_title,
            permission_level: notification.data.new_permission,
            is_owner: false,
            color: notification.data.color || '#10B981',
            description: notification.data.description || ''
          };
          onTimelineSelect(timelineData);
          setIsOpen(false);
          toast.success(`Switched to "${timelineData.title}" with ${notification.data.new_permission} access`);
        }
        break;
        
      default:
        console.log('Unknown notification type:', notification.notification_type);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'timeline_shared':
        return <Users size={16} className="notification-type-icon" />;
      case 'permission_changed':
        return <Shield size={16} className="notification-type-icon" />;
      default:
        return <Bell size={16} className="notification-type-icon" />;
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

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} unread notifications`}
      >
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="btn-text"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn-icon"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={24} className="empty-icon" />
                <p>No notifications yet</p>
                <small>You'll see timeline sharing notifications here</small>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-icon">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="notification-body">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.is_read && <div className="unread-dot" />}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        <Clock size={12} />
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>

                    <div className="notification-actions">
                      <button
                        onClick={() => handleNotificationAction(notification)}
                        className="btn-icon btn-primary"
                        title="View timeline"
                      >
                        <ExternalLink size={14} />
                      </button>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="btn-icon"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="btn-icon btn-danger"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <small className="text-muted">
                Showing recent notifications
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;