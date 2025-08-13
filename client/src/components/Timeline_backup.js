import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Share } from 'lucide-react';
import toast from 'react-hot-toast';
import AddEventModal from './AddEventModal';
import EditEventModal from './EditEventModal';
import TimelineItem from './TimelineItem';
import TimelineManager from '../models/TimelineManager';
import FocusedEventModal from './FocusedEventModal';
import FloatingActionButton from './FloatingActionButton';
import TimelineSelector from './TimelineSelector';
import TimelineShareModal from './TimelineShareModal';
import { db, isSupabaseAvailable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { timelineAPI, activityAPI, ACTIVITY_TYPES, PERMISSION_LEVELS, hasPermission } from '../lib/timelineSharing';

const Timeline = ({ selectedTimelineFromNotification, refreshTrigger }) => {
  const { user } = useAuth();
  const [timelineManager] = useState(() => new TimelineManager());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [addType, setAddType] = useState(null);
  
  // Timeline sharing state
  const [currentTimeline, setCurrentTimeline] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentTimeline]);

  // Handle timeline selection from notifications
  useEffect(() => {
    if (selectedTimelineFromNotification) {
      setCurrentTimeline(selectedTimelineFromNotification);
    }
  }, [selectedTimelineFromNotification]);

  const fetchEvents = async () => {
    if (!user || !isSupabaseAvailable()) {
      setLoading(false);
      return;
    }

    try {
      let supabaseEvents;
      
      if (currentTimeline) {
        // If a timeline is selected, get all events for that timeline
        // This includes events from other users in shared timelines
        supabaseEvents = await db.getTimelineEvents(currentTimeline.id);
      } else {
        // For backward compatibility, get user's events without timeline_id
        const allUserEvents = await db.getEvents(user.id);
        supabaseEvents = allUserEvents.filter(event => !event.timeline_id);
      }
      
      let filteredEvents = supabaseEvents;
      
      // Convert Supabase data format to our TimelineEvent format
      const convertedEvents = filteredEvents.map(event => {
        // Combine date and time into a single Date object
        const combinedDateTime = new Date(`${event.event_date}T${event.event_time || '00:00:00'}`);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: combinedDateTime,
          category: event.category,
          type: event.type || 'memory', // Use type from database or default to memory
          color: event.color || '#10B981', // Use color from database or default to green
          media: event.media_files || [],
          userId: event.user_id,
          createdAt: event.created_at
        };
      });
      const loadedEvents = timelineManager.loadFromAPI(convertedEvents);
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (eventData) => {
    if (!user || !isSupabaseAvailable()) {
      toast.error('Unable to save event. Please check your connection.');
      return;
    }

    // Check permission to add events (only if timeline sharing is active)
    if (currentTimeline && !hasPermission(currentTimeline.permission_level, PERMISSION_LEVELS.EDITOR)) {
      toast.error('You do not have permission to add events to this timeline.');
      return;
    }

    try {
      // Debug: Check user information
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      console.log('Current timeline:', currentTimeline);
      
      // Parse date and time from the datetime-local input
      const eventDateTime = new Date(eventData.date);
      
      // Prepare data for Supabase (matching your table structure)
      const supabaseEventData = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventDateTime.toISOString().split('T')[0], // Just the date part
        event_time: eventDateTime.toTimeString().split(' ')[0], // Just the time part
        category: eventData.category,
        media_files: eventData.media || [],
        user_id: user.id,
        timeline_id: currentTimeline?.id || null, // Associate with current timeline if available
        importance: 1, // Default importance
        location: eventData.location || '', // Use location from form
        tags: [], // Default empty tags array
        type: eventData.type || 'memory', // Include event type
        color: eventData.color || '#10B981' // Include event color
      };
      
      console.log('Supabase event data:', supabaseEventData);

      // Save to Supabase
      const savedEvent = await db.createEvent(supabaseEventData);
      
      // Add to local manager
      const combinedDateTime = new Date(`${savedEvent.event_date}T${savedEvent.event_time}`);
      const newEvent = timelineManager.addEvent({
        id: savedEvent.id,
        title: savedEvent.title,
        description: savedEvent.description,
        date: combinedDateTime,
        category: savedEvent.category,
        type: eventData.type || 'memory', // Include event type
        color: eventData.color, // Use the color from form data
        media: savedEvent.media_files || [],
        userId: savedEvent.user_id,
        createdAt: savedEvent.created_at
      });
      
      setEvents(timelineManager.getAllEvents());
      setShowAddModal(false);
      
      // Log activity (only if timeline sharing is active)
      if (currentTimeline) {
        try {
          await activityAPI.logActivity({
            timeline_id: currentTimeline.id,
            user_id: user.id,
            action_type: ACTIVITY_TYPES.CREATE_EVENT,
            action_data: {
              event_id: savedEvent.id,
              event_title: savedEvent.title,
              event_type: eventData.type || 'memory'
            },
            event_id: savedEvent.id
          });
        } catch (error) {
          console.error('Error logging activity:', error);
          // Don't show error to user for logging failures
        }
      }
      
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      console.error('Error details:', error.message);
      if (error.message?.includes('relation "timeline_events" does not exist')) {
        toast.error('Database not set up. Please run the SQL setup script in Supabase.');
      } else {
        toast.error(`Failed to add event: ${error.message}`);
      }
    }
  };

  const handleEditEvent = async (eventData) => {
    if (!user || !isSupabaseAvailable() || !editingEvent) {
      toast.error('Unable to update event. Please check your connection.');
      return;
    }

    // Check permission to edit events (only if timeline sharing is active)
    if (currentTimeline && !hasPermission(currentTimeline.permission_level, PERMISSION_LEVELS.EDITOR)) {
      toast.error('You do not have permission to edit events in this timeline.');
      return;
    }

    try {
      // Prepare data for Supabase
      const supabaseUpdateData = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.date,
        category: eventData.category,
        color: eventData.color,
        media: eventData.media || []
      };

      // Update in Supabase
      const updatedEvent = await db.updateEvent(editingEvent.id, supabaseUpdateData);
      
      // Update local manager
      const combinedDateTime = new Date(`${updatedEvent.event_date}T${updatedEvent.event_time}`);
      timelineManager.updateEvent(editingEvent.id, {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        date: combinedDateTime,
        category: updatedEvent.category,
        color: eventData.color, // Use color from form data
        media: updatedEvent.media_files || [],
        userId: updatedEvent.user_id
      });
      
      setEvents(timelineManager.getAllEvents());
      setEditingEvent(null);
      
      // Log activity (only if timeline sharing is active)
      if (currentTimeline) {
        try {
          await activityAPI.logActivity({
            timeline_id: currentTimeline.id,
            user_id: user.id,
            action_type: ACTIVITY_TYPES.EDIT_EVENT,
            action_data: {
              event_id: editingEvent.id,
              event_title: updatedEvent.title,
              changes: Object.keys(supabaseUpdateData)
            },
            event_id: editingEvent.id
          });
        } catch (error) {
          console.error('Error logging activity:', error);
          // Don't show error to user for logging failures
        }
      }
      
      toast.success('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error details:', error.message);
      toast.error(`Failed to update event: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    if (!user || !isSupabaseAvailable()) {
      toast.error('Unable to delete event. Please check your connection.');
      return;
    }

    // Check permission to delete events (only if timeline sharing is active)
    if (currentTimeline && !hasPermission(currentTimeline.permission_level, PERMISSION_LEVELS.EDITOR)) {
      toast.error('You do not have permission to delete events from this timeline.');
      return;
    }

    try {
      // Get event data before deletion for logging
      const eventToDelete = timelineManager.getEvent(eventId);
      
      // Delete from Supabase
      // Delete from Supabase
      await db.deleteEvent(eventId);
      
      // Remove from local manager
      timelineManager.deleteEvent(eventId);
      setEvents(timelineManager.getAllEvents());
      
      // Log activity (only if timeline sharing is active)
      if (currentTimeline && eventToDelete) {
        try {
          await activityAPI.logActivity({
            timeline_id: currentTimeline.id,
            user_id: user.id,
            action_type: ACTIVITY_TYPES.DELETE_EVENT,
            action_data: {
              event_id: eventId,
              event_title: eventToDelete.title,
              event_type: eventToDelete.type || 'memory'
            },
            event_id: eventId
          });
        } catch (error) {
          console.error('Error logging activity:', error);
          // Don't show error to user for logging failures
        }
      }
      
      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      console.error('Error details:', error.message);
      toast.error(`Failed to delete event: ${error.message}`);
    }
  };

  // Removed toggle expansion functionality - now clicking opens focused modal

  const handleFocusEvent = (event) => {
    setFocusedEvent(event);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group events by month/year for the Memory Journal layout
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(event);
    return acc;
  }, {});

  const canShare = currentTimeline && (
    currentTimeline.permission_level === PERMISSION_LEVELS.OWNER ||
    hasPermission(currentTimeline.permission_level, PERMISSION_LEVELS.ADMIN)
  );

  return (
    <div className="memory-timeline-container">
      {/* Timeline Header - only show if sharing system is available */}
      {isSupabaseAvailable() && (
        <div className="timeline-header">
          <div className="timeline-header-main">
            <TimelineSelector
              currentTimeline={currentTimeline}
              onTimelineChange={setCurrentTimeline}
              onCreateTimeline={(newTimeline) => {
                // Timeline selector will handle this
              }}
              refreshTrigger={refreshTrigger}
            />
            
            {currentTimeline && canShare && (
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-outline share-timeline-btn"
                title="Share timeline"
              >
                <Share size={16} />
                Share
              </button>
            )}
          </div>
          
          {currentTimeline && (
            <div className="timeline-description">
              {currentTimeline.description}
            </div>
          )}
        </div>
      )}

      {/* Show sharing notice if Supabase is not available */}
      {!isSupabaseAvailable() && (
        <div className="sharing-notice">
          <p><strong>Note:</strong> Timeline sharing features are not available. You can still add and manage your personal timeline events.</p>
        </div>
      )}

      {events.length === 0 ? (
        <div className="memory-empty-state">
          <div className="memory-empty-icon">
            <Calendar size={48} />
          </div>
          <h3 className="memory-empty-title">No memories yet</h3>
          <p className="memory-empty-description">Start capturing your precious moments!</p>
          <button
            onClick={() => setAddType('memory')}
            className="btn btn-primary memory-first-event-btn"
          >
            <Plus size={20} />
            Add Your First Memory
          </button>
        </div>
      ) : (
        <div className="memory-timeline">
          {/* Timeline line */}
          <div className="memory-timeline-line"></div>
          
          {/* Grouped events by month */}
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(b) - new Date(a)) // Sort by newest first
            .map(([monthYear, monthEvents]) => (
              <div key={monthYear} className="memory-month-group">
                {/* Month header */}
                <div className="memory-month-header">
                  <div className="memory-month-badge">
                    {monthYear}
                  </div>
                </div>

                {/* Events for this month */}
                <div className="memory-month-events">
                  {monthEvents
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((event, index) => (
                      <TimelineItem
                        key={event.id}
                        event={event}
                        onEdit={setEditingEvent}
                        onDelete={handleDeleteEvent}
                        onFocus={handleFocusEvent}
                        index={index}
                      />
                    ))}
                </div>
              </div>
          ))}
          
          {/* Scroll to top button */}
          <button className="memory-scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ↑
          </button>
        </div>
      )}

      {/* Floating Add Event Button (multi-slot) */}
      <FloatingActionButton
        onSelectType={(type) => setAddType(type)}
      />



      {addType && (
        <AddEventModal
          open={!!addType}
          onClose={() => setAddType(null)}
          initialType={addType}
          lockType={true}
          onAdd={handleAddEvent}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEdit={handleEditEvent}
        />
      )}

      <FocusedEventModal event={focusedEvent} onClose={() => setFocusedEvent(null)} />
      
      {/* Timeline Share Modal */}
      {showShareModal && currentTimeline && isSupabaseAvailable() && (
        <TimelineShareModal
          timeline={currentTimeline}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Timeline; 