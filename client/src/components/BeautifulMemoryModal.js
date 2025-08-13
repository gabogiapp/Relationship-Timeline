import React, { useState, useRef } from 'react';
import { X, Upload, MapPin, Calendar, Plus, Camera, BookOpen, Smile, Star, Target, Trash2 } from 'lucide-react';
import MediaService from '../services/mediaService';

const memoryTypeConfig = {
  memory: {
    icon: Camera,
    title: 'Capture Memory',
    subtitle: 'Preserve a special moment',
    buttonText: 'Save Memory'
  },
  journal: {
    icon: BookOpen,
    title: 'Journal Entry',
    subtitle: 'Document your thoughts',
    buttonText: 'Save Entry'
  },
  emotion: {
    icon: Smile,
    title: 'Record Emotion',
    subtitle: 'Capture how you feel',
    buttonText: 'Save Emotion'
  },
  milestone: {
    icon: Star,
    title: 'Milestone',
    subtitle: 'Celebrate achievements',
    buttonText: 'Save Milestone'
  },
  goal: {
    icon: Target,
    title: 'Set Goal',
    subtitle: 'Define your aspirations',
    buttonText: 'Save Goal'
  }
};

const colorThemes = [
  { name: 'orange', value: '#ea580c', bg: 'bg-orange-300' },
  { name: 'coral', value: '#f87171', bg: 'bg-red-300' },
  { name: 'purple', value: '#a855f7', bg: 'bg-purple-300' },
  { name: 'mint', value: '#10b981', bg: 'bg-emerald-300' },
  { name: 'sage', value: '#84cc16', bg: 'bg-lime-300' },
];

const BeautifulMemoryModal = ({ isOpen, onClose, onAdd, memoryType = 'memory' }) => {
  const config = memoryTypeConfig[memoryType] || memoryTypeConfig.memory;
  const IconComponent = config.icon;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    tags: '',
    color: colorThemes[0].value
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionUploadedFiles, setSessionUploadedFiles] = useState([]); // Track files uploaded in this session
  const fileInputRef = useRef();
  const mediaService = new MediaService();

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
          tempEventId,
          filePath: uploadResult.path // Store file path for potential deletion
        };
      });
      
      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedResults]);
      setSessionUploadedFiles(prev => [...prev, ...uploadedResults]); // Track for cleanup
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        category: formData.tags,
        type: memoryType,
        color: formData.color
      };

      console.log('BeautifulMemoryModal: Submitting data:', { eventData, uploadedFiles });

      await onAdd(eventData, uploadedFiles);
      
      // Success! Clear session tracking since files are now saved
      setSessionUploadedFiles([]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        tags: '',
        color: colorThemes[0].value
      });
      setUploadedFiles([]);
      onClose();
    } catch (error) {
      console.error('Error adding memory:', error);
      alert(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup function to delete uploaded files when cancelling
  const cleanupSessionFiles = async () => {
    if (sessionUploadedFiles.length > 0) {
      console.log('Cleaning up', sessionUploadedFiles.length, 'uploaded files...');
      try {
        const deletePromises = sessionUploadedFiles.map(file => 
          mediaService.deleteFile(file.filePath).catch(error => 
            console.error('Failed to delete file:', file.filePath, error)
          )
        );
        await Promise.all(deletePromises);
        console.log('Cleanup completed');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  };

  // Handle modal close with cleanup
  const handleClose = async () => {
    await cleanupSessionFiles();
    setSessionUploadedFiles([]);
    setUploadedFiles([]);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      tags: '',
      color: colorThemes[0].value
    });
    onClose();
  };

  // Remove individual file
  const handleRemoveFile = async (fileIndex) => {
    const fileToRemove = uploadedFiles[fileIndex];
    
    // Remove from storage
    try {
      await mediaService.deleteFile(fileToRemove.filePath);
      console.log('File deleted successfully:', fileToRemove.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Continue with removal from state even if deletion failed
    }

    // Remove from state arrays
    setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
    setSessionUploadedFiles(prev => prev.filter(file => file.filePath !== fileToRemove.filePath));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconComponent size={24} className="text-orange-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            {config.title}
          </h2>
          <p className="text-sm text-gray-500">
            {config.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photo (optional)
            </label>
            <div 
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-green-700 font-medium">{file.originalName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 text-center">
                    Click + to add more files
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Click to upload a photo</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                </>
              )}
              {uploading && (
                <div className="mt-2">
                  <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give it a memorable title..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What makes this place special?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Date and Location */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-10"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where was this?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-10"
                />
                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Add a tag..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
              />
              <Plus size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Theme
            </label>
            <div className="flex space-x-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: theme.value }))}
                  className={`w-10 h-10 rounded-full ${theme.bg} border-2 transition-all ${
                    formData.color === theme.value 
                      ? 'border-gray-400 scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim()}
              className="flex-1 py-3 bg-orange-400 text-white font-medium rounded-full hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving...' : config.buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeautifulMemoryModal;