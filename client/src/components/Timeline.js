import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Tag, Clock, User, Edit, Eye, Crown, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BeautifulMemoryModal from './BeautifulMemoryModal';

const Timeline = ({ timeline, onMemoryAdd, fabTrigger, onFabTriggerHandled }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [fabEventType, setFabEventType] = useState(null);

  useEffect(() => {
    if (timeline) {
      loadMemories();
    }
  }, [timeline]);

  // Handle FAB trigger
  useEffect(() => {
    if (fabTrigger) {
      setFabEventType(fabTrigger);
      setIsAddingMemory(true);
      onFabTriggerHandled();
    }
  }, [fabTrigger, onFabTriggerHandled]);

  const loadMemories = async () => {
    if (!timeline) return;
    
    try {
      setLoading(true);
      
      // Load timeline events
      const { data: events, error: eventsError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('timeline_id', timeline.id)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Load associated media files for all events
      if (events && events.length > 0) {
        console.log('Timeline.js: Loading media for', events.length, 'events');
        const eventIds = events.map(event => event.id);
        
        let mediaFiles = [];
        try {
          const { data, error: mediaError } = await supabase
            .from('media_files')
            .select('*')
            .in('event_id', eventIds);

          if (mediaError) {
            console.error('Error loading media files:', mediaError);
            console.warn('Proceeding without media files - they might not be set up yet');
            mediaFiles = [];
          } else {
            mediaFiles = data || [];
            console.log('Timeline.js: Loaded', mediaFiles.length, 'media files:', mediaFiles);
          }
        } catch (error) {
          console.error('Media files table access failed:', error);
          console.warn('Proceeding without media files');
          mediaFiles = [];
        }

        // Attach media files to their respective events
        const eventsWithMedia = events.map(event => {
          const eventMediaFiles = mediaFiles.filter(media => media.event_id === event.id);
          console.log(`Event ${event.id} (${event.title}):`, eventMediaFiles.length, 'media files');
          return {
            ...event,
            media_files: eventMediaFiles
          };
        });

        console.log('Timeline.js: Final events with media:', eventsWithMedia);
        setMemories(eventsWithMedia);
      } else {
        setMemories(events || []);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = timeline?.user_permission === 'owner' || timeline?.user_permission === 'editor';
  const canDelete = timeline?.user_permission === 'owner' || timeline?.user_permission === 'editor';

  const deleteMemory = async (memoryId, memoryTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${memoryTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting memory:', memoryId);
      
      // Try to delete media files if the table exists
      try {
        // First, get all media files for this event
        const { data: mediaFiles, error: mediaError } = await supabase
          .from('media_files')
          .select('file_url, file_name')
          .eq('event_id', memoryId);

        if (mediaError) {
          console.warn('Could not fetch media files for deletion:', mediaError);
        } else if (mediaFiles && mediaFiles.length > 0) {
          console.log('Found', mediaFiles.length, 'media files to delete');
          
          // Delete media files from database
          const { error: deleteMediaError } = await supabase
            .from('media_files')
            .delete()
            .eq('event_id', memoryId);

          if (deleteMediaError) {
            console.warn('Could not delete media files from database:', deleteMediaError);
          } else {
            console.log('Media files deleted successfully');
          }
        }
      } catch (mediaDeleteError) {
        console.warn('Media files deletion failed, continuing with event deletion:', mediaDeleteError);
      }

      // Delete the timeline event (this is the main operation)
      const { error: deleteEventError } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', memoryId);

      if (deleteEventError) {
        console.error('Error deleting memory:', deleteEventError);
        toast.error('Failed to delete memory');
        return;
      }

      toast.success('Memory deleted successfully');
      loadMemories(); // Refresh the timeline
    } catch (error) {
      console.error('Error in deleteMemory:', error);
      toast.error('Failed to delete memory');
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'owner': return Crown;
      case 'editor': return Edit;
      case 'viewer': return Eye;
      default: return User;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'owner': return 'text-yellow-600 bg-yellow-100';
      case 'editor': return 'text-green-600 bg-green-100';
      case 'viewer': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!timeline) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-memory-peach rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No Collection Selected</h3>
        <p className="text-muted-foreground">Select a memory collection to view your precious moments</p>
      </div>
    );
  }

  const PermissionIcon = getPermissionIcon(timeline.user_permission);
  const permissionColor = getPermissionColor(timeline.user_permission);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Timeline Header */}
      <div className="bg-card border-border rounded-2xl shadow-sm border p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-medium text-card-foreground mb-3">{timeline.title}</h1>
            {timeline.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{timeline.description}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-memory-peach rounded-full flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-foreground" />
                </div>
                <span>{memories.length} memories</span>
              </span>
              
              {timeline.collaborators && timeline.collaborators.length > 0 && (
                <span className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-memory-mint rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-foreground" />
                  </div>
                  <span>{timeline.collaborators.length + 1} people</span>
                </span>
              )}
              
              <span className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-memory-sage rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-foreground" />
                </div>
                <span>Updated {formatDate(timeline.updated_at)}</span>
              </span>
            </div>
          </div>
          
          {/* Permission Badge */}
          <div className="px-4 py-2 bg-memory-lavender text-foreground rounded-full text-sm font-medium flex items-center space-x-2 shadow-sm">
            <PermissionIcon className="w-4 h-4" />
            <span>{timeline.user_permission.charAt(0).toUpperCase() + timeline.user_permission.slice(1)}</span>
          </div>
        </div>
      </div>

      {/* Add Memory Button */}
      {canEdit && (
        <div className="mb-8">
          <button
            onClick={() => setIsAddingMemory(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Memory</span>
          </button>
        </div>
      )}

      {/* Memories List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="bg-card border-border text-center py-12 rounded-2xl shadow-sm border">
          <div className="w-16 h-16 bg-memory-peach rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-foreground" />
          </div>
          <h3 className="text-lg font-medium text-card-foreground mb-3">No Memories Yet</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed px-8">
            {canEdit 
              ? "Start capturing your precious moments and create beautiful memories that will last forever." 
              : "This memory collection is waiting for precious moments to be added."
            }
          </p>
          {canEdit && (
            <button
              onClick={() => setIsAddingMemory(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Memory</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-memory-peach transform -translate-x-0.5"></div>
          
          {/* Timeline entries */}
          <div className="space-y-12">
            {memories.map((memory, index) => {
              // Check if we need to show a month separator
              const currentDate = new Date(memory.event_date);
              const prevDate = index > 0 ? new Date(memories[index - 1].event_date) : null;
              const showMonthSeparator = !prevDate || 
                currentDate.getFullYear() !== prevDate.getFullYear() || 
                currentDate.getMonth() !== prevDate.getMonth();

              return (
                <div key={memory.id}>
                  {/* Month separator */}
                  {showMonthSeparator && (
                    <div className="relative flex justify-center mb-8">
                      <div className="bg-memory-peach text-foreground px-6 py-2 rounded-full text-sm font-medium shadow-sm">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                  
                  {/* Memory entry */}
                  <div className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 w-4 h-4 bg-memory-peach border-4 border-background rounded-full transform -translate-x-1/2 z-10"></div>
                    
                    {/* Memory card */}
                    <div className={`w-full max-w-lg ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                      <MemoryCard
                        memory={memory}
                        index={index}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onUpdate={loadMemories}
                        onDelete={deleteMemory}
                        isLeft={index % 2 === 0}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      <BeautifulMemoryModal
        isOpen={isAddingMemory}
        onClose={() => {
          setIsAddingMemory(false);
          setFabEventType(null);
        }}
        onAdd={async (eventData, files) => {
          try {
            console.log('Timeline.js: Received data:', { eventData, files, timeline, user });
            
            // Map form data to database schema (matching your actual schema)
            const dbEventData = {
              title: eventData.title,
              description: eventData.description,
              event_date: eventData.date,
              location: eventData.location || '',
              event_type: eventData.type,
              color: eventData.color,
              tags: eventData.category ? [eventData.category] : [],
              timeline_id: timeline.id,
              created_by: user.id
            };

            console.log('Timeline.js: Inserting event data:', dbEventData);

            // Insert the timeline event first
            const { data: newEvent, error } = await supabase
              .from('timeline_events')
              .insert([dbEventData])
              .select('*')
              .single();

            if (error) {
              console.error('Timeline.js: Supabase error:', error);
              throw error;
            }

            // If there are uploaded files, insert them into media_files table
            if (files && files.length > 0 && newEvent) {
              console.log('Timeline.js: Inserting', files.length, 'media files for event:', newEvent.id);
              
              const mediaInserts = files.map(file => ({
                event_id: newEvent.id,
                file_name: file.originalName || file.name || 'uploaded_file',
                file_url: file.url,
                file_type: file.type || 'image',
                file_size: file.size || 0
              }));

              console.log('Timeline.js: Media inserts:', mediaInserts);

              const { data: mediaData, error: mediaError } = await supabase
                .from('media_files')
                .insert(mediaInserts)
                .select('*');

              if (mediaError) {
                console.error('Error saving media files:', mediaError);
                toast.error('Media files could not be saved, but memory was created successfully');
                // Don't throw error here, event was saved successfully
              } else {
                console.log('Timeline.js: Media files saved successfully:', mediaData);
              }
            }

            toast.success('Memory added successfully!');
            loadMemories();
            if (onMemoryAdd) onMemoryAdd();
          } catch (error) {
            console.error('Error adding memory:', error);
            toast.error('Failed to add memory');
            throw error;
          }
        }}
        memoryType={fabEventType?.eventType || 'memory'}
      />
    </div>
  );
};

const MemoryCard = ({ memory, index, canEdit, onUpdate, canDelete, onDelete, isLeft = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // Alternate between different memory colors for visual variety
  const memoryColors = [
    'bg-memory-peach',
    'bg-memory-coral', 
    'bg-memory-lavender',
    'bg-memory-mint',
    'bg-memory-sage'
  ];
  const cardColorClass = memoryColors[index % memoryColors.length];

  return (
    <div className="relative">
      {/* Arrow pointing to timeline */}
      <div className={`absolute top-1/2 ${isLeft ? '-right-3' : '-left-3'} w-0 h-0 transform -translate-y-1/2 z-20`}>
        <div 
          className={`w-0 h-0 border-t-8 border-b-8 border-transparent ${
            isLeft ? 'border-l-8 border-l-memory-peach' : 'border-r-8 border-r-memory-peach'
          }`}
        ></div>
      </div>
      
      {/* Memory card */}
      <div className="bg-card border-border rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden hover:scale-105">
        {/* Subtle colored accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 ${cardColorClass} opacity-10 rounded-full -mr-10 -mt-10`}></div>
      {/* Header with Date and Location */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${cardColorClass} rounded-full flex items-center justify-center shadow-sm`}>
            <Calendar className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {formatDate(memory.event_date)}
            </p>
            {memory.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{memory.location}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Menu */}
        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="More options"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                {canDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(memory.id, memory.title);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete Memory</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Memory Title */}
      <h3 className="text-lg font-medium text-card-foreground mb-3 relative z-10">
        {memory.title}
      </h3>

      {/* Media */}
      {(memory.image_url || (memory.media_files && memory.media_files.length > 0)) && (
        <div className="mb-4 -mx-2">
          {memory.image_url && (
            <img
              src={memory.image_url}
              alt={memory.title}
              className="w-full rounded-xl object-cover shadow-sm"
              style={{ maxHeight: '300px' }}
              onError={(e) => {
                console.error('Failed to load image:', memory.image_url);
                e.target.style.display = 'none';
              }}
            />
          )}
          {memory.media_files && memory.media_files.length > 0 && (
            <div className="space-y-2">
              {memory.media_files.map((media, index) => (
                <div key={`${media.id}-${index}`} className="mb-2 relative">
                  {media.file_type && (media.file_type.includes('video') || media.file_url.includes('.mp4') || media.file_url.includes('.mov')) ? (
                    <video
                      src={media.file_url}
                      controls
                      className="w-full rounded-xl shadow-sm"
                      style={{ maxHeight: '300px' }}
                      onError={(e) => {
                        console.error('❌ Failed to load video:', media.file_url);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <>
                      <img
                        src={media.file_url}
                        alt={media.file_name || `${memory.title} - ${index + 1}`}
                        className="w-full rounded-xl object-cover shadow-sm"
                        style={{ maxHeight: '300px' }}
                        onLoad={() => {
                          console.log('✅ Image loaded successfully:', media.file_url);
                        }}
                        onError={(e) => {
                          console.error('❌ Failed to load image:', media.file_url);
                          console.error('Media object:', media);
                          console.error('Error event:', e);
                          e.target.style.display = 'none';
                          // Show error message
                          const errorDiv = e.target.nextSibling;
                          if (errorDiv && errorDiv.classList.contains('error-message')) {
                            errorDiv.style.display = 'block';
                          }
                        }}
                      />
                      <div className="error-message hidden bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <p className="text-red-600 text-sm">⚠️ Unable to load image</p>
                        <p className="text-red-500 text-xs mt-1">{media.file_name}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Debug info - remove this once working */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-50 rounded">
          <strong>Debug Info:</strong><br/>
          Media files: {memory.media_files ? memory.media_files.length : 'undefined'}<br/>
          {memory.media_files && memory.media_files.length > 0 && (
            <div>
              Files: {memory.media_files.map((f, i) => `${i+1}. ${f.file_name || 'unnamed'} (${f.file_url?.substring(0, 50)}...)`).join(', ')}
            </div>
          )}
          Has image_url: {memory.image_url ? 'Yes' : 'No'}<br/>
          Should show media: {(memory.image_url || (memory.media_files && memory.media_files.length > 0)) ? 'Yes' : 'No'}
        </div>
      )}

      {/* Description */}
      <div className={`mb-4 leading-relaxed relative z-10 ${!isExpanded && memory.description && memory.description.length > 200 ? 'line-clamp-3' : ''}`}>
        <p className="text-muted-foreground">{memory.description}</p>
        {memory.description && memory.description.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm mt-2 font-medium text-primary hover:opacity-80"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Tags */}
      {memory.tags && memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 relative z-10">
          {memory.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className={`inline-flex items-center space-x-1 px-3 py-1 ${cardColorClass} text-foreground rounded-full text-xs font-medium shadow-sm`}
            >
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};



const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export default Timeline;