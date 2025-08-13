/**
 * TIMELINE SELECTOR COMPONENT
 * ===========================
 * This component provides a dropdown/sidebar for users to:
 * - Switch between their own timelines
 * - View shared timelines
 * - Create new timelines
 * - Access timeline sharing options
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  Share, 
  Users, 
  Lock, 
  Globe,
  Calendar,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { timelineAPI, hasPermission, PERMISSION_LEVELS } from '../lib/timelineSharing';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import TimelineShareModal from './TimelineShareModal';

const TimelineSelector = ({ 
  currentTimeline, 
  onTimelineChange, 
  onCreateTimeline,
  refreshTrigger 
}) => {
  const { user } = useAuth();
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTimeline, setShareTimeline] = useState(null);
  
  // Create timeline form state
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDescription, setNewTimelineDescription] = useState('');
  const [newTimelineColor, setNewTimelineColor] = useState('#10B981');

  // Use ref to store debounce timer and loading state
  const debounceTimer = React.useRef(null);
  const lastLoadReason = React.useRef('');

  // Debounced loading function to prevent multiple simultaneous calls
  const debouncedLoadTimelines = React.useCallback((reason = 'unknown') => {
    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't start a new timer if the same reason is already pending
    if (lastLoadReason.current === reason) {
      return;
    }

    lastLoadReason.current = reason;

    // Set a new debounce timer
    debounceTimer.current = setTimeout(() => {
      console.log(`Loading timelines triggered by: ${reason}`);
      loadTimelines();
      lastLoadReason.current = '';
      debounceTimer.current = null;
    }, 150); // 150ms debounce
  }, []);

  useEffect(() => {
    if (user) {
      debouncedLoadTimelines('user login');
    }
    // Cleanup debounce on unmount or user change
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [user]);

  // Refresh timelines when refreshTrigger changes (e.g., from notifications)
  useEffect(() => {
    if (user && refreshTrigger > 0) {
      console.log('Refreshing timelines due to trigger:', refreshTrigger);
      debouncedLoadTimelines('refresh trigger');
    }
  }, [refreshTrigger, user, debouncedLoadTimelines]);

  // Refresh timelines when component becomes visible (helps catch newly shared timelines)
  useEffect(() => {
    const handleFocus = () => {
      if (user && document.visibilityState === 'visible') {
        debouncedLoadTimelines('page focus');
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [user, debouncedLoadTimelines]);

  const loadTimelines = async () => {
    try {
      setLoading(true);
      
      // Check if sharing system is available
      if (!isSupabaseAvailable()) {
        console.log('Timeline sharing not available, using legacy mode');
        setTimelines([]);
        setLoading(false);
        return;
      }
      
      console.log('Loading timelines for user:', user.id);
      
      // Ensure user has a default timeline and get all timelines
      const [defaultTimeline, userTimelines] = await Promise.all([
        timelineAPI.ensureDefaultTimeline(user.id),
        timelineAPI.getUserTimelines(user.id)
      ]);
      
      console.log('Loaded timelines:', userTimelines.length);
      console.log('Owned timelines:', userTimelines.filter(t => t.is_owner).length);
      console.log('Shared timelines:', userTimelines.filter(t => !t.is_owner).length);
      
      setTimelines(userTimelines);
      
      // If no current timeline is selected, select the default one
      if (!currentTimeline) {
        if (defaultTimeline) {
          console.log('Selecting default timeline:', defaultTimeline.title);
          onTimelineChange(defaultTimeline);
        } else if (userTimelines.length > 0) {
          console.log('Selecting first timeline:', userTimelines[0].title);
          // Fallback to first available timeline
          onTimelineChange(userTimelines[0]);
        }
      }
    } catch (error) {
      console.error('Error loading timelines:', error);
      // Don't show error toast if Supabase isn't available
      if (isSupabaseAvailable()) {
        toast.error('Failed to load timelines');
      }
      setTimelines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimeline = async (e) => {
    e.preventDefault();
    if (!newTimelineTitle.trim()) return;

    try {
      const timelineData = {
        title: newTimelineTitle.trim(),
        description: newTimelineDescription.trim(),
        owner_id: user.id,
        color: newTimelineColor,
        is_private: true,
        settings: {}
      };

      const newTimeline = await timelineAPI.createTimeline(timelineData);
      
      // Add to local state
      setTimelines(prev => [{ 
        ...newTimeline, 
        permission_level: PERMISSION_LEVELS.OWNER,
        is_owner: true 
      }, ...prev]);
      
      // Select the new timeline
      onTimelineChange({
        ...newTimeline,
        permission_level: PERMISSION_LEVELS.OWNER,
        is_owner: true
      });

      // Reset form
      setNewTimelineTitle('');
      setNewTimelineDescription('');
      setNewTimelineColor('#10B981');
      setShowCreateForm(false);
      setShowDropdown(false);
      
      toast.success('Timeline created successfully!');
      
      if (onCreateTimeline) {
        onCreateTimeline(newTimeline);
      }
    } catch (error) {
      console.error('Error creating timeline:', error);
      toast.error('Failed to create timeline');
    }
  };

  const handleDeleteTimeline = async (timeline) => {
    if (!window.confirm(`Are you sure you want to delete "${timeline.title}"?`)) {
      return;
    }

    try {
      await timelineAPI.deleteTimeline(timeline.id);
      setTimelines(prev => prev.filter(t => t.id !== timeline.id));
      
      // If deleted timeline was current, switch to another one
      if (currentTimeline?.id === timeline.id) {
        const remaining = timelines.filter(t => t.id !== timeline.id);
        if (remaining.length > 0) {
          onTimelineChange(remaining[0]);
        } else {
          onTimelineChange(null);
        }
      }
      
      toast.success('Timeline deleted successfully');
    } catch (error) {
      console.error('Error deleting timeline:', error);
      toast.error('Failed to delete timeline');
    }
  };

  const handleShare = (timeline) => {
    setShareTimeline(timeline);
    setShowShareModal(true);
    setShowDropdown(false);
  };

  const getTimelineIcon = (timeline) => {
    if (timeline.is_owner) {
      return timeline.is_private ? <Lock size={14} /> : <Globe size={14} />;
    }
    return <Users size={14} />;
  };

  const formatPermissionBadge = (timeline) => {
    if (timeline.is_owner) return null;
    
    const colors = {
      [PERMISSION_LEVELS.ADMIN]: '#dc2626',
      [PERMISSION_LEVELS.EDITOR]: '#2563eb',
      [PERMISSION_LEVELS.VIEWER]: '#6b7280'
    };

    return (
      <span 
        className="permission-badge"
        style={{ backgroundColor: colors[timeline.permission_level] || '#6b7280' }}
      >
        {timeline.permission_level}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="timeline-selector loading">
        <div className="timeline-selector-button">
          <div className="loading-placeholder"></div>
        </div>
      </div>
    );
  }

  const colors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', 
    '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'
  ];

  return (
    <div className="timeline-selector">
      <button 
        className="timeline-selector-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="current-timeline">
          <div 
            className="timeline-indicator"
            style={{ backgroundColor: currentTimeline?.color || '#10B981' }}
          />
          <div className="timeline-info">
            <div className="timeline-name">
              {currentTimeline?.title || 'Select Timeline'}
            </div>
            {currentTimeline && (
              <div className="timeline-meta">
                {getTimelineIcon(currentTimeline)}
                {formatPermissionBadge(currentTimeline)}
              </div>
            )}
          </div>
        </div>
        <ChevronDown size={20} className={`dropdown-icon ${showDropdown ? 'open' : ''}`} />
      </button>

      {showDropdown && (
        <div className="timeline-dropdown">
          {/* My Timelines */}
          <div className="dropdown-section">
            <div className="section-header">My Timelines</div>
            {timelines.filter(t => t.is_owner).map(timeline => (
              <div 
                key={timeline.id} 
                className={`timeline-option ${currentTimeline?.id === timeline.id ? 'active' : ''}`}
              >
                <button
                  onClick={() => {
                    onTimelineChange(timeline);
                    setShowDropdown(false);
                  }}
                  className="timeline-option-button"
                >
                  <div 
                    className="timeline-indicator"
                    style={{ backgroundColor: timeline.color }}
                  />
                  <div className="timeline-details">
                    <div className="timeline-name">{timeline.title}</div>
                    <div className="timeline-description">
                      {timeline.description || 'No description'}
                    </div>
                  </div>
                  {getTimelineIcon(timeline)}
                </button>
                <div className="timeline-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(timeline);
                    }}
                    className="action-button"
                    title="Share timeline"
                  >
                    <Share size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTimeline(timeline);
                    }}
                    className="action-button delete"
                    title="Delete timeline"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Shared with Me */}
          {timelines.filter(t => !t.is_owner).length > 0 && (
            <div className="dropdown-section">
              <div className="section-header">Shared with Me</div>
              {timelines.filter(t => !t.is_owner).map(timeline => (
                <div 
                  key={timeline.id} 
                  className={`timeline-option ${currentTimeline?.id === timeline.id ? 'active' : ''}`}
                >
                  <button
                    onClick={() => {
                      onTimelineChange(timeline);
                      setShowDropdown(false);
                    }}
                    className="timeline-option-button"
                  >
                    <div 
                      className="timeline-indicator"
                      style={{ backgroundColor: timeline.color }}
                    />
                    <div className="timeline-details">
                      <div className="timeline-name">{timeline.title}</div>
                      <div className="timeline-description">
                        Shared by {timeline.owner_email || 'Unknown'}
                      </div>
                    </div>
                    <div className="timeline-badges">
                      {getTimelineIcon(timeline)}
                      {formatPermissionBadge(timeline)}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Debug/Refresh Button */}
          <div className="dropdown-section">
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                loadTimelines();
              }}
              className="create-timeline-button"
              style={{ backgroundColor: '#f59e0b', marginBottom: '8px' }}
            >
              🔄 Refresh Timelines (Debug)
            </button>
          </div>

          {/* Create New Timeline */}
          <div className="dropdown-section">
            {showCreateForm ? (
              <form onSubmit={handleCreateTimeline} className="create-timeline-form">
                <input
                  type="text"
                  placeholder="Timeline title"
                  value={newTimelineTitle}
                  onChange={(e) => setNewTimelineTitle(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTimelineDescription}
                  onChange={(e) => setNewTimelineDescription(e.target.value)}
                />
                <div className="color-picker">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${newTimelineColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTimelineColor(color)}
                    />
                  ))}
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="create-timeline-button"
              >
                <Plus size={16} />
                Create New Timeline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="timeline-dropdown-backdrop"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && shareTimeline && (
        <TimelineShareModal
          timeline={shareTimeline}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareTimeline(null);
          }}
        />
      )}
    </div>
  );
};

export default TimelineSelector;