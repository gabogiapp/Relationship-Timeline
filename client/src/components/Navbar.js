import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar } from 'lucide-react';
import NotificationCenter from './NotificationCenter_Simple';

const Navbar = ({ onTimelineSelect }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="memory-navbar">
      <div className="memory-navbar-content">
        {/* Logo Section */}
        <div className="memory-navbar-logo">
          <div className="memory-logo-icon">
            <Calendar size={18} />
          </div>
          <span className="memory-logo-text">Memories</span>
        </div>

        {/* Right Section */}
        <div className="memory-navbar-right">
          {/* Notifications */}
          <NotificationCenter onTimelineSelect={onTimelineSelect} />

          {/* User Profile */}
          <div className="memory-user-profile">
            <div className="memory-user-avatar">
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="memory-user-info">
              <div className="memory-user-name">{user?.username || 'User'}</div>
              <div className="memory-user-email">{user?.email || 'user@example.com'}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="memory-logout-button"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 