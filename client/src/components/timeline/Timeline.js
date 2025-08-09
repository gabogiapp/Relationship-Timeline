import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import AddEventModal from '../modals/AddEventModal';
import EditEventModal from '../modals/EditEventModal';
import TimelineItem from './TimelineItem';
import TimelineManager from '../../models/TimelineManager';
import FocusedEventModal from '../modals/FocusedEventModal';
import FloatingActionButton from './FloatingActionButton';

const Timeline = () => {
  const [timelineManager] = useState(() => new TimelineManager());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [addType, setAddType] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/timeline');
      const loadedEvents = timelineManager.loadFromAPI(response.data);
      setEvents(loadedEvents);
    } catch (error) {
      // If API fails, use sample data for testing
      console.log('Using sample data for testing');
      const sampleEvents = timelineManager.loadSampleEvents();
      setEvents(sampleEvents);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      // Extract media files from eventData
      const { media, ...eventWithoutMedia } = eventData;
      
      // Create the event (with or without media)
      const newEvent = timelineManager.addEvent({
        ...eventWithoutMedia,
        id: `event_${Date.now()}`,
        media: media || []
      });
      
      setEvents(timelineManager.getAllEvents());
      setShowAddModal(false);
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const handleEditEvent = async (eventData) => {
    try {
      const response = await axios.put(`/api/timeline/${editingEvent.id}`, eventData);
      timelineManager.updateEvent(editingEvent.id, response.data);
      setEvents(timelineManager.getAllEvents());
      setEditingEvent(null);
      toast.success('Event updated successfully!');
    } catch (error) {
      // For testing, update sample data
      timelineManager.updateEvent(editingEvent.id, eventData);
      setEvents(timelineManager.getAllEvents());
      setEditingEvent(null);
      toast.success('Event updated successfully! (Demo mode)');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`/api/timeline/${eventId}`);
      timelineManager.deleteEvent(eventId);
      setEvents(timelineManager.getAllEvents());
      toast.success('Event deleted successfully!');
    } catch (error) {
      // For testing, remove from sample data
      timelineManager.deleteEvent(eventId);
      setEvents(timelineManager.getAllEvents());
      toast.success('Event deleted successfully! (Demo mode)');
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Timeline</h1>
          <p className="text-gray-600">
            {events.length === 0 
              ? "Start building your timeline by adding your first event"
              : `${timelineManager.getEventCount()} event${timelineManager.getEventCount() === 1 ? '' : 's'} in your timeline`
            }
          </p>
        </div>
        {/* Removed main Add Event button from here */}
      </div>

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

      {/* Demo mode indicator */}
      {events.some(event => event.id.startsWith('sample')) && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
            <Sparkles size={16} />
            Demo Mode - Using sample data
          </div>
        </div>
      )}

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