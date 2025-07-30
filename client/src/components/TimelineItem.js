import React from 'react';
import { Edit, Trash2, Calendar, Clock, Tag, Image, Video, Play, File } from 'lucide-react';

const TimelineItem = ({ event, onEdit, onDelete, onFocus }) => {
  const handleClick = (e) => {
    // Only open focus modal if not clicking on actions
    if (e.target.closest('.timeline-actions')) {
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

  // Get the first media file for preview
  const firstMedia = event.media && event.media.length > 0 ? event.media[0] : null;
  const hasLegacyMedia = event.imageUrl || event.videoUrl;

  return (
    <div className="timeline-item">
      <div 
        className="timeline-dot" 
        style={{ backgroundColor: event.color }}
      ></div>
      <div 
        className="timeline-content cursor-pointer hover:bg-gray-50 transition-colors"
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
        
                 <div className="flex gap-6">
           {/* Media Preview */}
           {(firstMedia || hasLegacyMedia) && (
             <div className="flex-shrink-0">
               <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 relative shadow-md">
                {firstMedia ? (
                  firstMedia.type.startsWith('image/') ? (
                    <img
                      src={firstMedia.url}
                      alt={firstMedia.name || 'Timeline media'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', firstMedia.url);
                        e.target.style.display = 'none';
                      }}
                    />
                                     ) : firstMedia.type.startsWith('video/') ? (
                     <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                       <Play size={32} className="text-gray-600" />
                       <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                         <Video size={12} className="inline mr-1" />
                       </div>
                     </div>
                   ) : (
                     <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                       <File size={28} className="text-gray-600" />
                     </div>
                   )
                ) : event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt="Timeline"
                    className="w-full h-full object-cover"
                  />
                                 ) : event.videoUrl ? (
                   <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                     <Play size={32} className="text-gray-600" />
                     <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                       <Video size={12} className="inline mr-1" />
                     </div>
                   </div>
                ) : null}
              </div>
            </div>
          )}
          
          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="timeline-header">
              <h3 className="timeline-title">{event.title}</h3>
              <div className="timeline-date">
                <Calendar size={16} />
                {event.formattedDate}
              </div>
            </div>
            
            {/* Show category if available */}
            {event.category && (
              <div className="flex items-center gap-1 mt-1">
                <Tag size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">{event.category}</span>
              </div>
            )}
            
            {/* Show media count indicator */}
            {event.media && event.media.length > 1 && (
              <div className="flex items-center gap-1 mt-1">
                <Image size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">+{event.media.length - 1} more</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem; 