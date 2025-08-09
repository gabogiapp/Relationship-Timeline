import React, { useState, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import AddEventModal from './AddEventModal';
import EditEventModal from './EditEventModal';
import TimelineItem from './TimelineItem';
import TimelineManager from '../models/TimelineManager';
import FocusedEventModal from './FocusedEventModal';
import FloatingActionButton from './FloatingActionButton';
import { db, isSupabaseAvailable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Timeline = () => {
  const { user } = useAuth();
  const [timelineManager] = useState(() => new TimelineManager());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [addType, setAddType] = useState(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user || !isSupabaseAvailable()) {
      setLoading(false);
      return;
    }

    try {
      const supabaseEvents = await db.getEvents(user.id);
      // Convert Supabase data format to our TimelineEvent format
      const convertedEvents = supabaseEvents.map(event => {
        // Combine date and time into a single Date object
        const combinedDateTime = new Date(`${event.event_date}T${event.event_time || '00:00:00'}`);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: combinedDateTime,
          category: event.category,
          color: '#3B82F6', // Default color since your table doesn't store this
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

    try {
      // Debug: Check user information
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      
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
        importance: 1, // Default importance
        location: '', // Default empty location
        tags: [] // Default empty tags array
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
        color: eventData.color, // Use the color from form data since table doesn't store it
        media: savedEvent.media_files || [],
        userId: savedEvent.user_id,
        createdAt: savedEvent.created_at
      });
      
      setEvents(timelineManager.getAllEvents());
      setShowAddModal(false);
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

    try {
      // Delete from Supabase
      await db.deleteEvent(eventId);
      
      // Remove from local manager
      timelineManager.deleteEvent(eventId);
      setEvents(timelineManager.getAllEvents());
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

  return (
    <div className="py-8">

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-6">Start building your timeline by adding your first event</p>
          <button
            onClick={() => setAddType('memory')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Add Your First Event
          </button>
        </div>
      ) : (
        <div className="timeline">
          {events.map((event) => (
            <TimelineItem
              key={event.id}
              event={event}
              onEdit={setEditingEvent}
              onDelete={handleDeleteEvent}
              onFocus={handleFocusEvent}
            />
          ))}
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
    </div>
  );
};

export default Timeline; 