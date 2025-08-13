/**
 * SHARED TIMELINE NOTIFICATION
 * ============================
 * Shows a notification when user has new shared timelines
 * Appears at the top of the timeline view
 */

import React, { useState, useEffect } from 'react';
import { Users, X, ExternalLink } from 'lucide-react';
import { timelineAPI } from '../lib/timelineSharing';
import { useAuth } from '../contexts/AuthContext';
import './SharedTimelineNotification.css';

const SharedTimelineNotification = ({ onTimelineSelect }) => {
  const { user } = useAuth();
  const [sharedTimelines, setSharedTimelines] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      checkForSharedTimelines();
    }
  }, [user]);

  const checkForSharedTimelines = async () => {
    try {
      const timelines = await timelineAPI.getUserTimelines(user.id);
      const shared = timelines.filter(t => !t.is_owner);
      
      if (shared.length > 0) {
        setSharedTimelines(shared);
        
        // Check if user has seen these shared timelines before
        const seenSharedTimelineIds = JSON.parse(
          localStorage.getItem('seenSharedTimelines') || '[]'
        );
        
        const newSharedTimelines = shared.filter(
          t => !seenSharedTimelineIds.includes(t.id)
        );
        
        if (newSharedTimelines.length > 0 && !dismissed) {
          setShowNotification(true);
        }
      }
    } catch (error) {
      console.error('Error checking shared timelines:', error);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setDismissed(true);
    
    // Mark all current shared timelines as seen
    const sharedIds = sharedTimelines.map(t => t.id);
    localStorage.setItem('seenSharedTimelines', JSON.stringify(sharedIds));
  };

  const handleViewTimeline = (timeline) => {
    if (onTimelineSelect) {
      onTimelineSelect(timeline);
    }
    handleDismiss();
  };

  if (!showNotification || sharedTimelines.length === 0) {
    return null;
  }

  return (
    <div className="shared-timeline-notification">
      <div className="notification-content">
        <div className="notification-icon">
          <Users size={20} />
        </div>
        <div className="notification-text">
          <h3>New Shared Timelines!</h3>
          <p>
            {sharedTimelines.length === 1 
              ? `"${sharedTimelines[0].title}" has been shared with you.`
              : `${sharedTimelines.length} timelines have been shared with you.`
            }
          </p>
          <div className="shared-timeline-list">
            {sharedTimelines.slice(0, 3).map(timeline => (
              <button
                key={timeline.id}
                className="shared-timeline-item"
                onClick={() => handleViewTimeline(timeline)}
              >
                <div 
                  className="timeline-indicator"
                  style={{ backgroundColor: timeline.color }}
                />
                <span className="timeline-name">{timeline.title}</span>
                <ExternalLink size={14} />
              </button>
            ))}
            {sharedTimelines.length > 3 && (
              <div className="more-timelines">
                +{sharedTimelines.length - 3} more in your timeline selector
              </div>
            )}
          </div>
        </div>
        <button className="notification-dismiss" onClick={handleDismiss}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SharedTimelineNotification;