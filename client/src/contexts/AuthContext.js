import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { auth, isSupabaseAvailable } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is available
  useEffect(() => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        toast.success('Welcome back!');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { user } = await auth.signIn(email, password);
      setUser(user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const register = async (email, password, userData = {}) => {
    try {
      const { user } = await auth.signUp(email, password, userData);
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        toast.success('Registration successful! Please check your email to verify your account.');
        return true;
      } else {
        toast.success('Registration successful! Please check your email to verify your account.');
        return true;
      }
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 