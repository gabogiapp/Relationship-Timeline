/**
 * MAIN APPLICATION COMPONENT
 * =========================
 * This is the root component of the Relationship Timeline App.
 * 
 * ARCHITECTURE:
 * - Uses React Router for navigation between pages
 * - AuthProvider manages user authentication state globally
 * - PrivateRoute protects authenticated pages
 * - Toast notifications for user feedback
 * 
 * ROUTES:
 * - /login: User login page (public)
 * - /register: User registration page (public)
 * - /: Main timeline page (private - requires authentication)
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Timeline from './components/Timeline';
import SharedTimelineView from './components/SharedTimelineView';
import Navbar from './components/Navbar';
import TimelineDebug from './components/TimelineDebug';
import './App.css';
import './components/TimelineShareModal.css';
import './components/TimelineSelector.css';
import './components/SharedTimelineView.css';
import './components/NotificationCenter.css';

/**
 * MAIN APP CONTENT COMPONENT
 * =========================
 * Manages shared state between Navbar and Timeline components
 * including timeline selection from notifications
 */
const MainAppContent = () => {
  const [selectedTimelineFromNotification, setSelectedTimelineFromNotification] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTimelineSelectFromNotification = (timeline) => {
    console.log('Timeline selected from notification:', timeline);
    setSelectedTimelineFromNotification(timeline);
    // Trigger a refresh of timelines to ensure newly shared timelines appear
    setRefreshTrigger(prev => prev + 1);
    // Auto-clear after a short delay to prevent repeated selections
    setTimeout(() => {
      setSelectedTimelineFromNotification(null);
    }, 500);
  };

  return (
    <>
      <Navbar onTimelineSelect={handleTimelineSelectFromNotification} />
      <Timeline 
        selectedTimelineFromNotification={selectedTimelineFromNotification}
        refreshTrigger={refreshTrigger} 
      />
    </>
  );
};

/**
 * PRIVATE ROUTE COMPONENT
 * =====================
 * This component protects routes that require authentication.
 * If user is not authenticated, redirects to login page.
 * Shows loading spinner while authentication status is being checked.
 * 
 * @param {React.ReactNode} children - The component to render if authenticated
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your timeline...</p>
      </div>
    );
  }
  
  // If authenticated, show the protected component
  // If not authenticated, redirect to login
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * MAIN APP COMPONENT
 * ================
 * Sets up the entire application structure with:
 * - Global authentication context
 * - Routing system
 * - Global UI components (navbar, notifications)
 * - Route definitions
 */
function App() {
  return (
    <AuthProvider>
      {/* Router manages navigation between different pages */}
      <Router>
        <div className="App">
          {/* Global toast notifications for success/error messages */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          {/* Route definitions */}
          <Routes>
            {/* Public Routes - accessible without authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Shared Timeline Route - public access via share link */}
            <Route path="/shared/:shareToken" element={<SharedTimelineView />} />
            
            {/* Debug Route - temporary for troubleshooting */}
            <Route 
              path="/debug" 
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <TimelineDebug />
                  </div>
                </PrivateRoute>
              } 
            />

            {/* Private Routes - require authentication */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <MainAppContent />
                </PrivateRoute>
              } 
            />
            
            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 