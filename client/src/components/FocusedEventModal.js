import React from 'react';
import { X, Image, Video, Music, File } from 'lucide-react';

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
          
          {/* Media Files Display */}
          {event.media && event.media.length > 0 && (
            <div className="focused-event-media mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.media.map((file, index) => (
                  <div key={index} className="media-item">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={file.url}
                          alt={file.name || 'Timeline media'}
                          className="w-full h-64 object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            console.error('Image failed to load:', file.url);
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          <Image size={14} className="inline mr-1" />
                          {file.name || 'Image'}
                        </div>
                      </div>
                    ) : file.type.startsWith('video/') ? (
                      <div className="relative">
                        <video
                          src={file.url}
                          controls
                          className="w-full h-64 object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          <Video size={14} className="inline mr-1" />
                          {file.name || 'Video'}
                        </div>
                      </div>
                    ) : file.type.startsWith('audio/') ? (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Music size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-700 font-medium">
                            {file.name || 'Audio file'}
                          </span>
                        </div>
                        <audio controls className="w-full">
                          <source src={file.url} type={file.type} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-700 font-medium">
                            {file.name || 'File'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legacy support for old imageUrl and videoUrl */}
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