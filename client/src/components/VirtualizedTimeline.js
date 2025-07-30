import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import useTimelineStore from '../stores/timelineStore';
import TimelineItem from './TimelineItem';
import { Loader2 } from 'lucide-react';

const VirtualizedTimeline = ({ onEdit, onDelete }) => {
  const {
    events,
    loading,
    error,
    pagination,
    fetchEvents,
    loadMore
  } = useTimelineStore();

  const containerRef = useRef();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  // Fetch initial data
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle scroll to update visible range
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const itemHeight = 200; // Approximate height of each timeline item
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2); // 2 items above
    const end = Math.min(events.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 2); // 2 items below
    
    setVisibleRange({ start, end });
  }, [events.length]);

  // Handle event expansion
  const handleToggleExpansion = useCallback((eventId) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);

  // Get visible events
  const visibleEvents = useMemo(() => {
    return events.slice(visibleRange.start, visibleRange.end).map((event, index) => ({
      ...event,
      isExpanded: expandedEvents.has(event.id)
    }));
  }, [events, visibleRange, expandedEvents]);

  // Calculate total height for scroll container
  const totalHeight = events.length * 200; // Approximate height per item

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <h3 className="text-xl font-semibold mb-2">Error loading events</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-gray-400">Start adding memories to your timeline!</p>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto"
          onScroll={handleScroll}
          style={{ 
            position: 'relative',
            height: '100%'
          }}
        >
          {/* Spacer for scroll height */}
          <div style={{ height: `${visibleRange.start * 200}px` }} />
          
          {/* Visible timeline items */}
          <div className="timeline">
            {visibleEvents.map((event, index) => (
              <TimelineItem 
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleExpansion={handleToggleExpansion}
              />
            ))}
          </div>
          
          {/* Spacer for remaining height */}
          <div style={{ height: `${(events.length - visibleRange.end) * 200}px` }} />
          
          {/* Loading indicator */}
          {loading && events.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualizedTimeline; 