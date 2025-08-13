/**
 * SHARED TIMELINE VIEW
 * ===================
 * This component handles viewing timelines via public share links.
 * It provides a read-only or limited-edit view depending on permissions.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Lock, 
  Eye, 
  Edit, 
  Share, 
  ArrowLeft,
  Users,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import TimelineItem from './TimelineItem';
import { linkSharingAPI, PERMISSION_LEVELS } from '../lib/timelineSharing';
import { db, isSupabaseAvailable } from '../lib/supabase';

const SharedTimelineView = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  
  const [timeline, setTimeline] = useState(null);
  const [events, setEvents] = useState([]);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (shareToken) {
      loadSharedTimeline();
    }
  }, [shareToken]);

  const loadSharedTimeline = async (passwordAttempt = null) => {
    try {
      setLoading(true);
      setError(null);

      const result = await linkSharingAPI.getTimelineViaLink(
        shareToken, 
        passwordAttempt || password
      );

      setTimeline(result.timeline);
      setPermission(result.permission);
      
      // Load timeline events
      await loadTimelineEvents(result.timeline.id);
      
      setPasswordRequired(false);
    } catch (error) {
      console.error('Error loading shared timeline:', error);
      
      if (error.message === 'Password required') {
        setPasswordRequired(true);
        setError(null);
      } else if (error.message === 'Invalid password') {
        setError('Incorrect password. Please try again.');
        setPasswordRequired(true);
      } else if (error.message.includes('expired')) {
        setError('This share link has expired.');
      } else if (error.message.includes('Invalid')) {
        setError('Invalid or expired share link.');
      } else {
        setError('Failed to load shared timeline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineEvents = async (timelineId) => {
    if (!isSupabaseAvailable()) {
      return;
    }

    try {
      // Load events for the specific timeline
      const { data, error } = await db.supabase
        .from('timeline_events')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false });

      if (error) throw error;

      // Convert to the expected format
      const convertedEvents = data.map(event => {
        const combinedDateTime = new Date(`${event.event_date}T${event.event_time || '00:00:00'}`);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: combinedDateTime,
          category: event.category,
          type: event.type || 'memory',
          color: event.color || '#10B981',
          media: event.media_files || [],
          userId: event.user_id,
          createdAt: event.created_at
        };
      });

      setEvents(convertedEvents);
    } catch (error) {
      console.error('Error loading timeline events:', error);
      toast.error('Failed to load timeline events');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    await loadSharedTimeline();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case PERMISSION_LEVELS.EDITOR:
        return <Edit size={16} />;
      case PERMISSION_LEVELS.VIEWER:
        return <Eye size={16} />;
      default:
        return <Eye size={16} />;
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case PERMISSION_LEVELS.EDITOR:
        return 'You can view and edit this timeline';
      case PERMISSION_LEVELS.VIEWER:
        return 'You can view this timeline';
      default:
        return 'Read-only access';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group events by month/year
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(event);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="shared-timeline-container">
        <div className="shared-timeline-loading">
          <div className="loading-spinner"></div>
          <p>Loading shared timeline...</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="shared-timeline-container">
        <div className="password-required">
          <div className="password-form-container">
            <div className="password-icon">
              <Lock size={48} />
            </div>
            <h2>Password Required</h2>
            <p>This timeline is protected with a password.</p>
            
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary">
                Access Timeline
              </button>
            </form>
            
            <button onClick={handleGoHome} className="btn btn-outline go-home-btn">
              <ArrowLeft size={16} />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-timeline-container">
        <div className="shared-timeline-error">
          <div className="error-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Unable to Load Timeline</h2>
          <p>{error}</p>
          <button onClick={handleGoHome} className="btn btn-primary">
            <ArrowLeft size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="shared-timeline-container">
        <div className="shared-timeline-error">
          <div className="error-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Timeline Not Found</h2>
          <p>The requested timeline could not be found.</p>
          <button onClick={handleGoHome} className="btn btn-primary">
            <ArrowLeft size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-timeline-container">
      {/* Header */}
      <div className="shared-timeline-header">
        <button onClick={handleGoHome} className="back-button">
          <ArrowLeft size={20} />
        </button>
        
        <div className="timeline-info">
          <div className="timeline-title-section">
            <div 
              className="timeline-color-indicator"
              style={{ backgroundColor: timeline.color }}
            />
            <div>
              <h1 className="timeline-title">{timeline.title}</h1>
              {timeline.description && (
                <p className="timeline-description">{timeline.description}</p>
              )}
            </div>
          </div>
          
          <div className="timeline-meta">
            <div className="permission-info">
              {getPermissionIcon()}
              <span>{getPermissionText()}</span>
            </div>
            <div className="share-info">
              <Users size={16} />
              <span>Shared timeline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="shared-timeline-content">
        {events.length === 0 ? (
          <div className="empty-timeline">
            <div className="empty-icon">
              <Calendar size={48} />
            </div>
            <h3>No memories yet</h3>
            <p>This timeline doesn't have any events yet.</p>
          </div>
        ) : (
          <div className="memory-timeline">
            <div className="memory-timeline-line"></div>
            
            {Object.entries(groupedEvents)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([monthYear, monthEvents]) => (
                <div key={monthYear} className="memory-month-group">
                  <div className="memory-month-header">
                    <div className="memory-month-badge">
                      {monthYear}
                    </div>
                  </div>

                  <div className="memory-month-events">
                    {monthEvents
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((event, index) => (
                        <TimelineItem
                          key={event.id}
                          event={event}
                          onEdit={null} // Disable editing in shared view
                          onDelete={null} // Disable deletion in shared view
                          onFocus={null} // Could enable focused view
                          index={index}
                          readOnly={permission === PERMISSION_LEVELS.VIEWER}
                        />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shared-timeline-footer">
        <div className="footer-content">
          <div className="shared-by">
            <Share size={16} />
            <span>Shared via timeline link</span>
          </div>
          <button onClick={handleGoHome} className="btn btn-outline">
            Create Your Own Timeline
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedTimelineView;