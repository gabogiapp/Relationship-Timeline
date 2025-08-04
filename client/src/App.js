import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Timeline from './components/Timeline';
import Journal from './components/Journal';
import Navbar from './components/Navbar';
import HamburgerMenu from './components/HamburgerMenu';
import './App.css';

// Import test functions
import { testSupabase, testAuthFlow, testDatabaseOperations, runAllTests } from './lib/testSupabase';
import { testMediaUpload, testStorageAccess } from './lib/testMediaUpload';

// Make test functions available globally for browser console
window.testSupabase = testSupabase;
window.testAuthFlow = testAuthFlow;
window.testDatabaseOperations = testDatabaseOperations;
window.runAllTests = runAllTests;
window.testMediaUpload = testMediaUpload;
window.testStorageAccess = testStorageAccess;

// Add a simple test function that can be called from console
window.testSupabaseSetup = async () => {
  console.log('🧪 Testing Supabase setup...');
  console.log('Available test functions:');
  console.log('  - testSupabase()');
  console.log('  - testAuthFlow(email, password)');
  console.log('  - testDatabaseOperations()');
  console.log('  - runAllTests()');
  
  try {
    const result = await testSupabase();
    if (result) {
      console.log('✅ Supabase is configured and working!');
    } else {
      console.log('❌ Supabase needs to be configured. Check SUPABASE_SETUP.md');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Navbar />
          <HamburgerMenu />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Timeline />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/journal" 
              element={
                <PrivateRoute>
                  <Journal />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 