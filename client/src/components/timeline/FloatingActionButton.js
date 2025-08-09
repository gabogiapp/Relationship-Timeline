import React, { useState, useRef, useEffect } from 'react';
import { Plus, BookOpen, Smile, Award, Target, Image } from 'lucide-react';

const eventTypes = [
  { label: 'Memory', value: 'memory', color: '#10B981', icon: Image },
  { label: 'Journal', value: 'journal', color: '#3B82F6', icon: BookOpen },
  { label: 'Emotion', value: 'emotion', color: '#EC4899', icon: Smile },
  { label: 'Milestone', value: 'milestone', color: '#8B5CF6', icon: Award },
  { label: 'Goal', value: 'goal', color: '#F59E0B', icon: Target },
];

const BUTTON_HEIGHT = 48; // px
const GAP = 8; // px

const FloatingActionButton = ({ onSelectType }) => {
  const [expanded, setExpanded] = useState(false);
  const tubeRef = useRef(null);

  // Calculate tube height dynamically
  const visibleCount = expanded ? eventTypes.length : 0;
  const tubeHeight = expanded
  ? (BUTTON_HEIGHT + GAP) * (eventTypes.length - 1) + BUTTON_HEIGHT
  : 0;


  useEffect(() => {
    if (tubeRef.current) {
      tubeRef.current.style.height = tubeHeight + 'px';
    }
  }, [tubeHeight]);

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div
        className={`fab-tube${expanded ? ' fab-tube-expanded' : ''}`}
        ref={tubeRef}
        style={{
          position: 'absolute',
          bottom: 56 + 12, // 56px main fab + 12px gap
          right: 0,
          width: 64,
          height: tubeHeight,
          background: 'rgba(243, 244, 246, 0.95)',
          borderRadius: '2rem',
          boxShadow: '0 8px 32px rgba(30, 41, 59, 0.10)',
          display: 'block',
          padding: 0,
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.18s',
          zIndex: 1100,
          overflow: 'hidden',
          position: 'relative', // <-- ADD THIS
        }}
      >
        {eventTypes.map((type, idx) => {
          const Icon = type.icon;
          const bottomOffset = idx * (BUTTON_HEIGHT + GAP); // position from bottom up
          return (
            <button
              key={type.value}
              className={`fab-slot${expanded ? ' fab-slot-animate' : ''}`}
              style={{
                position: 'absolute',
                bottom: bottomOffset,
                backgroundColor: type.color,
                width: '90%',
                height: BUTTON_HEIGHT,
                left: '5%',
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                transitionDelay: expanded ? `${idx * 60 + 80}ms` : '0ms',
                transform: expanded ? 'scale(1)' : 'scale(0.5)',
                opacity: expanded ? 1 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
              }}
              title={type.label}
              onClick={() => {
                setExpanded(false);
                onSelectType(type.value);
              }}
            >
              <Icon size={22} />
            </button>
          );
        })}
      </div>
      <button
        className="fab"
        aria-label={expanded ? 'Close event type menu' : 'Add new event'}
        style={{ zIndex: 1200, transition: 'transform 0.2s', transform: expanded ? 'rotate(45deg)' : 'none' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default FloatingActionButton; 