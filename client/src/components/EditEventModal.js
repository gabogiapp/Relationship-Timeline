import React, { useState, useEffect, useRef } from 'react';
import { X, Palette, Upload, Image, File, Trash2, Video, Music } from 'lucide-react';
import MediaService from '../services/mediaService';

const EditEventModal = ({ event, onClose, onEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: '',
    color: '#3B82F6'
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const mediaService = new MediaService();

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: new Date(event.date).toISOString().slice(0, 16),
        category: event.category || '',
        color: event.color || '#3B82F6'
      });
      // Initialize uploaded files from existing media
      setUploadedFiles(event.media || []);
    }
  }, [event]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        mediaService.validateFile(file);
        
        // Compress image if needed
        const processedFile = await mediaService.compressImage(file);
        
        // Generate a temporary event ID for upload
        const tempEventId = `temp_${Date.now()}`;
        
        // Upload file
        const uploadResult = await mediaService.uploadFile(processedFile, tempEventId);
        
        return {
          ...uploadResult,
          originalName: file.name,
          tempEventId
        };
      });
      
      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedResults]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    // Include uploaded files in the event data
    const eventData = {
      ...formData,
      media: uploadedFiles.map(file => ({
        url: file.url,
        path: file.path,
        type: file.type,
        name: file.originalName || file.name
      }))
    };
    
    onEdit(eventData);
  };

  if (!event) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Enter event description (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Work, Personal, Travel"
            />
          </div>

          {/* File Upload Section */}
          <div className="form-group">
            <label className="form-label">Media Files</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 mx-auto text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Choose Files'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Supports images, videos, and audio files (max 10MB each)
              </p>
            </div>
            
            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      {file.type && file.type.startsWith('image/') ? (
                        <Image size={16} className="text-blue-500" />
                      ) : file.type && file.type.startsWith('video/') ? (
                        <Video size={16} className="text-purple-500" />
                      ) : file.type && file.type.startsWith('audio/') ? (
                        <Music size={16} className="text-green-500" />
                      ) : (
                        <File size={16} className="text-gray-500" />
                      )}
                      <span className="text-xs truncate flex-1">
                        {file.originalName || file.name || 'File'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                style={{ backgroundColor: formData.color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <Palette size={16} />
                Choose Color
              </button>
            </div>
            
            {showColorPicker && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setFormData({ ...formData, color });
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              Update Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal; 