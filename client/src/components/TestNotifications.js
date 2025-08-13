/**
 * TEST NOTIFICATIONS COMPONENT
 * ============================
 * This is a test component to verify the notification system is working.
 * You can use this to manually test notifications and sharing.
 * Remove this file once you've verified everything works.
 */

import React, { useState, useEffect } from 'react';
import { notificationsAPI, timelineAPI, userSharingAPI } from '../lib/timelineSharing';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TestNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [testEmail, setTestEmail] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState('');

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadTimelines();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadTimelines = async () => {
    try {
      const data = await timelineAPI.getUserTimelines(user.id);
      setTimelines(data);
    } catch (error) {
      console.error('Error loading timelines:', error);
    }
  };

  const handleTestShare = async () => {
    if (!testEmail || !selectedTimeline) {
      toast.error('Please enter an email and select a timeline');
      return;
    }

    try {
      await userSharingAPI.shareWithUser(
        selectedTimeline,
        testEmail,
        'viewer',
        user.id
      );
      toast.success('Test share created! Check if notification appears.');
    } catch (error) {
      toast.error(`Test share failed: ${error.message}`);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const notificationIds = notifications.map(n => n.id);
      if (notificationIds.length > 0) {
        await notificationsAPI.deleteMultiple(notificationIds);
        await loadNotifications();
        toast.success('All notifications cleared');
      }
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🧪 Notification System Test</h2>
      <p><strong>User:</strong> {user?.email}</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Test Sharing (Creates Notifications)</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Email to share with:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email address"
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Timeline to share:</label>
          <select
            value={selectedTimeline}
            onChange={(e) => setSelectedTimeline(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          >
            <option value="">Select timeline</option>
            {timelines.filter(t => t.is_owner).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        
        <button onClick={handleTestShare} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Share
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Current Notifications ({notifications.length})</h3>
        <button onClick={loadNotifications} style={{ marginRight: '10px', padding: '5px 10px' }}>
          Refresh
        </button>
        <button onClick={handleClearNotifications} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Clear All
        </button>
        
        <div style={{ marginTop: '10px' }}>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} style={{ 
                padding: '10px', 
                margin: '5px 0', 
                backgroundColor: notification.is_read ? '#f9f9f9' : '#fff3cd',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <small>Type: {notification.notification_type} | Read: {notification.is_read ? 'Yes' : 'No'}</small>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Your Timelines</h3>
        {timelines.map(timeline => (
          <div key={timeline.id} style={{ padding: '5px 0' }}>
            <strong>{timeline.title}</strong> - {timeline.is_owner ? 'Owner' : timeline.permission_level}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <h4>How to test:</h4>
        <ol>
          <li>Make sure you've run the notifications_migration.sql in Supabase</li>
          <li>Enter an email address (can be the same as yours for testing)</li>
          <li>Select one of your timelines</li>
          <li>Click "Test Share"</li>
          <li>Check the notification center in the navbar (bell icon)</li>
          <li>The notification should appear in real-time if you're on the same browser</li>
        </ol>
      </div>
    </div>
  );
};

export default TestNotifications;