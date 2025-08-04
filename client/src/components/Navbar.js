import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar-fixed">
      <div className="navbar-content">
        <div className="navbar-left">
          <h1 className="text-xl font-bold text-gray-900">Timeline App</h1>
        </div>
        
        <div className="navbar-right-absolute">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={20} />
            <span className="font-medium">{user?.username}</span>
          </div>
          
          <button
            onClick={logout}
            className="btn btn-secondary"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 