import React from 'react';
import { Edit, Trash2, Calendar, MapPin, Heart, Play, File, Video } from 'lucide-react';

const TimelineItem = ({ event, onEdit, onDelete, onFocus, index }) => {
  const handleClick = (e) => {
    // Only open focus modal if not clicking on actions
    if (e.target.closest('.memory-card-actions')) {
      return;
    }
    if (onFocus) onFocus(event);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(event.id);
  };

  const handleHeart = (e) => {
    e.stopPropagation();
    // TODO: Implement favorite functionality
  };

  // Get the first media file for preview
  const firstMedia = event.media && event.media.length > 0 ? event.media[0] : null;
  const hasLegacyMedia = event.imageUrl || event.videoUrl;

  // Format date
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Get memory color class and style based on event type and color
  const getMemoryColorClass = (eventType, color) => {
    // First check if we have a type-based mapping
    const typeColorMap = {
      'memory': 'memory-card-memory',
      'journal': 'memory-card-journal', 
      'emotion': 'memory-card-emotion',
      'milestone': 'memory-card-milestone',
      'goal': 'memory-card-goal'
    };
    
    if (typeColorMap[eventType]) {
      return typeColorMap[eventType];
    }
    
    // Fallback to color-based mapping
    const colorMap = {
      'coral': 'memory-card-coral',
      'peach': 'memory-card-peach',
      'lavender': 'memory-card-lavender',
      'mint': 'memory-card-mint',
      'sage': 'memory-card-sage',
      'cream': 'memory-card-cream'
    };
    return colorMap[color] || 'memory-card-memory';
  };

  // Get inline styles for hex colors
  const getMemoryColorStyle = (eventType, color) => {
    // If color is a hex value, apply it as inline style
    if (color && color.startsWith('#')) {
      return {
        borderLeft: `4px solid ${color}`,
        background: `linear-gradient(135deg, ${color}08, ${color}03)`
      };
    }
    return {};
  };

  // Create tags from category (if available)
  const tags = event.category ? [event.category] : [];

  return (
    <div className="memory-timeline-item">
      {/* Timeline dot */}
      <div className="memory-timeline-dot"></div>
      
      {/* Memory Card */}
      <div 
        className={`memory-card ${getMemoryColorClass(event.type || 'memory', event.color || 'peach')} ${index % 2 === 0 ? 'memory-card-left' : 'memory-card-right'}`}
        style={getMemoryColorStyle(event.type || 'memory', event.color)}
        onClick={handleClick}
      >
        {/* Card Header */}
        <div className="memory-card-header">
          <div className="memory-card-date-location">
            <div className="memory-card-date">
              <Calendar size={14} />
              {formattedDate}
            </div>
            {event.location && (
              <div className="memory-card-location">
                <MapPin size={14} />
                {event.location}
              </div>
            )}
          </div>
          
          <div className="memory-card-actions">
            <button
              onClick={handleHeart}
              className="memory-action-btn memory-heart-btn"
              title="Add to favorites"
            >
              <Heart size={16} />
            </button>
            <button
              onClick={handleEdit}
              className="memory-action-btn memory-edit-btn"
              title="Edit memory"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="memory-action-btn memory-delete-btn"
              title="Delete memory"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Card Title */}
        <h3 className="memory-card-title">{event.title}</h3>

        {/* Card Image */}
        {(firstMedia || hasLegacyMedia) && (
          <div className="memory-card-image-container">
            {firstMedia ? (
              firstMedia.type.startsWith('image/') ? (
                <img
                  src={firstMedia.url}
                  alt={firstMedia.name || 'Memory'}
                  className="memory-card-image"
                  onError={(e) => {
                    console.error('Image failed to load:', firstMedia.url);
                    e.target.style.display = 'none';
                  }}
                />
              ) : firstMedia.type.startsWith('video/') ? (
                <div className="memory-card-video-placeholder">
                  <Play size={32} />
                  <div className="memory-video-indicator">
                    <Video size={12} />
                  </div>
                </div>
              ) : (
                <div className="memory-card-file-placeholder">
                  <File size={28} />
                </div>
              )
            ) : event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt="Memory"
                className="memory-card-image"
              />
            ) : event.videoUrl ? (
              <div className="memory-card-video-placeholder">
                <Play size={32} />
                <div className="memory-video-indicator">
                  <Video size={12} />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Card Description */}
        <p className="memory-card-description">
          {event.description}
        </p>

        {/* Card Tags */}
        {tags.length > 0 && (
          <div className="memory-card-tags">
            {tags.slice(0, 3).map((tag, tagIndex) => (
              <span key={tagIndex} className="memory-card-tag">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="memory-card-tag-more">+{tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Progress dots (decorative) */}
        <div className="memory-card-dots">
          <div className="memory-dot active"></div>
          <div className="memory-dot"></div>
          <div className="memory-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem; 