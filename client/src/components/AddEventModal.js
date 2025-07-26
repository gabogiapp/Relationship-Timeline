import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';

const eventTypes = [
  { label: 'Memory', value: 'memory', color: '#10B981' }, // green
  { label: 'Journal', value: 'journal', color: '#3B82F6' }, // blue
  { label: 'Emotion', value: 'emotion', color: '#EC4899' }, // pink
  { label: 'Milestone', value: 'milestone', color: '#8B5CF6' }, // purple
  { label: 'Goal', value: 'goal', color: '#F59E0B' }, // yellow
];

const AddEventModal = ({ onClose, onAdd, initialType, lockType }) => {
  // Find the event type object for initialType
  const initialTypeObj = eventTypes.find(t => t.value === initialType) || eventTypes[0];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    category: '',
    type: initialTypeObj.value,
    color: initialTypeObj.color
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorOverridden, setColorOverridden] = useState(false);

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // If lockType, do not allow changing type
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type' && lockType) return;
    if (name === 'type') {
      const selectedType = eventTypes.find(t => t.value === value);
      setFormData(prev => ({
        ...prev,
        type: value,
        color: colorOverridden ? prev.color : (selectedType ? selectedType.color : prev.color)
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleColorPick = (color) => {
    setFormData({ ...formData, color });
    setColorOverridden(true);
    setShowColorPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Event Type Dropdown or Label */}
          <div className="form-group">
            <label htmlFor="type" className="form-label">
              Event Type *
            </label>
            {lockType ? (
              <div className="input" style={{ background: '#f3f4f6', color: initialTypeObj.color, fontWeight: 600 }}>
                {initialTypeObj.label}
              </div>
            ) : (
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
                required
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
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
                    onClick={() => handleColorPick(color)}
                  />
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Default color is based on event type. You can override it.
            </div>
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
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal; 