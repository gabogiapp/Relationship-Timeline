import React, { useState, useRef } from 'react';
import { X, Upload, Image, File, Trash2, Camera, BookOpen, Smile, Star, Target, MapPin, Calendar } from 'lucide-react';
import MediaService from '../services/mediaService';

const eventTypes = [
  { label: 'Memory', value: 'memory', color: '#ea580c', icon: Camera, description: 'Preserve a special moment' },
  { label: 'Journal', value: 'journal', color: '#2563eb', icon: BookOpen, description: 'Document your thoughts' },
  { label: 'Emotion', value: 'emotion', color: '#dc2626', icon: Smile, description: 'Record how you feel' },
  { label: 'Milestone', value: 'milestone', color: '#9333ea', icon: Star, description: 'Celebrate achievements' },
  { label: 'Goal', value: 'goal', color: '#059669', icon: Target, description: 'Set your aspirations' },
];

const colorThemes = [
  { name: 'orange', value: '#ea580c', class: 'clean-color-orange' },
  { name: 'red', value: '#dc2626', class: 'clean-color-red' },
  { name: 'purple', value: '#9333ea', class: 'clean-color-purple' },
  { name: 'green', value: '#059669', class: 'clean-color-green' },
  { name: 'blue', value: '#2563eb', class: 'clean-color-blue' },
  { name: 'gray', value: '#6b7280', class: 'clean-color-gray' },
];

const AddEventModal = ({ onClose, onAdd, initialType, lockType }) => {
  // Find the event type object for initialType
  const initialTypeObj = eventTypes.find(t => t.value === initialType) || eventTypes[0];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    category: '',
    location: '',
    type: initialTypeObj.value,
    color: initialTypeObj.color
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const mediaService = new MediaService();

  // Handle form changes - colors are automatic based on type
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type' && lockType) return;
    if (name === 'type') {
      const selectedType = eventTypes.find(t => t.value === value);
      setFormData(prev => ({
        ...prev,
        type: value,
        color: selectedType ? selectedType.color : prev.color
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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

  const handleSubmit = async (e) => {
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
        name: file.originalName
      }))
    };
    
    try {
      await onAdd(eventData);
      onClose(); // Close the modal after successful add
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  const currentTypeObj = eventTypes.find(t => t.value === formData.type) || eventTypes[0];
  const IconComponent = currentTypeObj.icon;

  return (
    <div className="clean-modal-overlay">
      <div className="clean-modal-content">
        <button className="clean-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        
        {/* Header */}
        <div className="clean-modal-header">
          <div className="clean-modal-icon">
            <IconComponent size={24} />
          </div>
          <h2 className="clean-modal-title">
            {formData.type === 'journal' ? 'Create Journal Entry' : 
             formData.type === 'emotion' ? 'Record Emotion' :
             formData.type === 'milestone' ? 'Log Milestone' :
             formData.type === 'goal' ? 'Set Goal' : 'Capture Memory'}
          </h2>
          <p className="clean-modal-subtitle">{currentTypeObj.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="clean-modal-form">
          {/* Photo Upload Section */}
          <div className="clean-upload-section">
            <label className="clean-form-label">Photo (optional)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*,audio/*"
              style={{ display: 'none' }}
            />
            
            <div 
              className="clean-upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} className="clean-upload-icon" />
              <p className="clean-upload-text">
                {uploading ? 'Uploading...' : 'Click to upload a photo'}
              </p>
              <p className="clean-upload-hint">PNG, JPG up to 10MB</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="clean-uploaded-files">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="clean-uploaded-file">
                    <Image size={14} />
                    <span className="clean-file-name">{file.originalName}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="clean-file-remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="clean-form-group">
            <label className="clean-form-label">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="clean-form-input"
              placeholder="Give it a memorable title..."
              required
            />
          </div>

          {/* Description */}
          <div className="clean-form-group">
            <label className="clean-form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="clean-form-textarea"
              rows="3"
              placeholder="What made this moment special?"
            />
          </div>

          {/* Date and Location Row */}
          <div className="clean-form-row">
            <div className="clean-form-group">
              <label className="clean-form-label">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date.slice(0, 10)}
                onChange={(e) => handleChange({
                  target: { name: 'date', value: e.target.value + 'T' + (formData.date.slice(11) || '12:00') }
                })}
                className="clean-form-input"
                required
              />
            </div>
            <div className="clean-form-group">
              <label className="clean-form-label">Location (optional)</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="clean-form-input"
                placeholder="Where was this?"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="clean-form-group">
            <label className="clean-form-label">Tags</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="clean-form-input"
              placeholder="Add a tag..."
            />
          </div>

          {/* Color Theme */}
          <div className="clean-color-theme">
            <label className="clean-form-label">Color Theme</label>
            <div className="clean-color-options">
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  className={`clean-color-option ${theme.class} ${formData.color === theme.value ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, color: theme.value }))}
                  aria-label={`Select ${theme.name} theme`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="clean-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="clean-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clean-btn-primary"
              style={{ backgroundColor: formData.color }}
            >
              Save {currentTypeObj.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;