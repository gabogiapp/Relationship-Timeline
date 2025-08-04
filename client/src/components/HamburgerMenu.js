import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, BookOpen } from 'lucide-react';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={24} className="text-gray-700" />
        ) : (
          <Menu size={24} className="text-gray-700" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={closeMenu}
          />
          
          {/* Menu Content */}
          <div className="fixed top-16 left-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48">
            <div className="py-2">
              <Link
                to="/"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                  isActive('/') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' : ''
                }`}
              >
                <Calendar size={20} />
                <span className="font-medium">Timeline</span>
              </Link>
              
              <Link
                to="/journal"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                  isActive('/journal') ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' : ''
                }`}
              >
                <BookOpen size={20} />
                <span className="font-medium">Journal</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HamburgerMenu;