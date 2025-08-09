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

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Timeline from './components/Timeline';
import Navbar from './components/Navbar';
import './App.css';

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
          
          {/* Navigation bar - shows on all pages */}
          <Navbar />
          
          {/* Route definitions */}
          <Routes>
            {/* Public Routes - accessible without authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private Routes - require authentication */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Timeline />
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