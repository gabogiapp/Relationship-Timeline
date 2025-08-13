/**
 * SIMPLE NOTIFICATION CENTER - FALLBACK VERSION
 * ==============================================
 * A simplified notification center that doesn't require additional database tables.
 * This prevents 406 errors when the full notification system isn't set up.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = ({ onTimelineSelect }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f3f4f6';
          e.target.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#6b7280';
        }}
      >
        <Bell size={20} />
      </button>

      {isOpen && (
        <div 
          className="notification-dropdown"
          style={{
            position: 'absolute',
            right: '0',
            top: '100%',
            marginTop: '8px',
            width: '320px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            overflow: 'hidden'
          }}
        >
          <div 
            className="notification-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}
          >
            <h3 style={{ 
              margin: '0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#111827'
            }}>
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div 
            className="notification-list"
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#6b7280'
            }}
          >
            <Bell size={24} style={{ 
              margin: '0 auto 12px', 
              opacity: 0.3,
              display: 'block'
            }} />
            <p style={{ 
              margin: '0 0 8px', 
              fontSize: '14px',
              color: '#374151'
            }}>
              No notifications yet
            </p>
            <small style={{ 
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Timeline sharing notifications will appear here when the full notification system is set up
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;