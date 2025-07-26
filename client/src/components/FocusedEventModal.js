import React from 'react';
import { X } from 'lucide-react';

const FocusedEventModal = ({ event, onClose }) => {
  if (!event) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={28} />
        </button>
        <div className="focused-event-details">
          <h2 className="focused-event-title">{event.title}</h2>
          <div className="focused-event-date">{event.formattedDate} {event.formattedTime}</div>
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt="Timeline"
              className="focused-event-image"
            />
          )}
          {event.videoUrl && (
            <div className="focused-event-video">
              {event.videoUrl.includes('youtube') ? (
                <iframe
                  width="100%"
                  height="320"
                  src={event.videoUrl.replace('watch?v=', 'embed/')}
                  title="Timeline Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls className="focused-event-video-player">
                  <source src={event.videoUrl} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          {event.description && (
            <p className="focused-event-description">{event.description}</p>
          )}
          {event.category && (
            <span className="focused-event-category">{event.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusedEventModal; 