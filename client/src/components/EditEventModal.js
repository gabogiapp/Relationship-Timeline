import React, { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';

const EditEventModal = ({ event, onClose, onEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: '',
    color: '#3B82F6'
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

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
    }
  }, [event]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    onEdit(formData);
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

          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl || ''}
              onChange={handleChange}
              className="input"
              placeholder="Paste an image URL"
            />
          </div>
          <div className="form-group">
            <label htmlFor="videoUrl" className="form-label">Video URL (YouTube, MP4, etc.)</label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl || ''}
              onChange={handleChange}
              className="input"
              placeholder="Paste a video URL"
            />
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