import React from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, Calendar, Clock, Tag } from 'lucide-react';

const TimelineItem = ({ event, onEdit, onDelete, onToggleExpansion, onFocus }) => {
  const handleClick = (e) => {
    // Only open focus modal if not clicking on actions or chevron
    if (
      e.target.closest('.timeline-actions') ||
      e.target.closest('.timeline-expand-indicator')
    ) {
      return;
    }
    if (onFocus) onFocus(event);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    onToggleExpansion(event.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(event.id);
  };

  return (
    <div className="timeline-item">
      <div 
        className="timeline-dot" 
        style={{ backgroundColor: event.color }}
      ></div>
      <div 
        className={`timeline-content ${event.isExpanded ? 'expanded' : ''}`}
        onClick={handleClick}
      >
        <div className="timeline-actions">
          <button
            onClick={handleEdit}
            className="timeline-action-btn edit"
            title="Edit event"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="timeline-action-btn delete"
            title="Delete event"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="timeline-header">
          <h3 className="timeline-title">{event.title}</h3>
          <div className="timeline-date">
            <Calendar size={16} />
            {event.formattedDate}
          </div>
        </div>
        {event.isExpanded && (
          <div className="timeline-details">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt="Timeline"
                style={{ maxWidth: '100%', borderRadius: '0.5rem', marginBottom: '0.5rem' }}
              />
            )}
            {event.videoUrl && (
              <div style={{ marginBottom: '0.5rem' }}>
                {event.videoUrl.includes('youtube') ? (
                  <iframe
                    width="100%"
                    height="200"
                    src={event.videoUrl.replace('watch?v=', 'embed/')}
                    title="Timeline Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls style={{ maxWidth: '100%', borderRadius: '0.5rem' }}>
                    <source src={event.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
            {event.description && (
              <p className="timeline-description">{event.description}</p>
            )}
            <div className="timeline-meta">
              <span><Clock size={14} />{event.formattedTime}</span>
              {event.category && (
                <span><Tag size={14} />{event.category}</span>
              )}
            </div>
          </div>
        )}
        <div className="timeline-expand-indicator" onClick={handleExpand}>
          {event.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem; 