import React, { useState } from 'react';
import { Plus, X, Camera, BookOpen, Smile, Star, Target } from 'lucide-react';

const memoryTypes = [
  { 
    label: 'Memory', 
    value: 'memory', 
    color: '#ff8a80', // Coral/pink for memories
    icon: Camera,
    description: 'Capture a moment'
  },
  { 
    label: 'Emotion', 
    value: 'emotion', 
    color: '#ce93d8', // Purple for emotions
    icon: Smile,
    description: 'Record feelings'
  },
  { 
    label: 'Journal', 
    value: 'journal', 
    color: '#a5d6a7', // Mint green for journals
    icon: BookOpen,
    description: 'Write thoughts'
  },
  { 
    label: 'Milestone', 
    value: 'milestone', 
    color: '#ffcc80', // Orange for milestones
    icon: Star,
    description: 'Log an achievement'
  },
  { 
    label: 'Goal', 
    value: 'goal', 
    color: '#c8e6c9', // Sage green for goals
    icon: Target,
    description: 'Set a target'
  },
];

const FloatingActionButton = ({ onSelectType }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleTypeSelect = (type) => {
    setExpanded(false);
    onSelectType(type);
  };

  return (
    <div className="memory-fab-container">
      {/* Action buttons tube */}
      {expanded && (
        <div className="memory-fab-tube">
          {memoryTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <div key={type.value} className="memory-fab-action-wrapper">
                {/* Tooltip */}
                <div className="memory-fab-tooltip">
                  <div className="memory-fab-tooltip-title">{type.label}</div>
                  <div className="memory-fab-tooltip-desc">{type.description}</div>
                </div>
                
                {/* Action Button */}
                <button
                  onClick={() => handleTypeSelect(type.value)}
                  className="memory-fab-action"
                  style={{ 
                    backgroundColor: type.color,
                    animationDelay: `${index * 80}ms`
                  }}
                  title={type.label}
                >
                  <Icon size={20} className="memory-fab-action-icon" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={handleToggle}
        className={`memory-fab-main ${expanded ? 'memory-fab-main-expanded' : ''}`}
        aria-label={expanded ? 'Close menu' : 'Add new memory'}
      >
        {/* Ripple effect */}
        {expanded && <div className="memory-fab-ripple"></div>}
        
        {/* Icon */}
        <div className={`memory-fab-icon ${expanded ? 'memory-fab-icon-rotated' : ''}`}>
          {expanded ? <X size={24} /> : <Plus size={24} />}
        </div>
      </button>
    </div>
  );
};

export default FloatingActionButton; 