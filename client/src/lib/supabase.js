import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseAnonKey.includes('your-anon-key');

// Create Supabase client with additional options
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Database table names
export const TABLES = {
  EVENTS: 'timeline_events',
  USERS: 'users',
  MEDIA: 'media_files'
};

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return isSupabaseConfigured && supabase !== null;
};

// Authentication helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    if (!isSupabaseAvailable()) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    if (!isSupabaseAvailable()) {
      return null;
    }
    
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Get timeline events for a user
  getEvents: async (userId, options = {}) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.category) {
      query = query.eq('category', options.category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create a new timeline event
  createEvent: async (eventData) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert([eventData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a timeline event
  updateEvent: async (eventId, updates) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a timeline event
  deleteEvent: async (eventId) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
  }
};

// Storage helpers
export const storage = {
  // Upload a file to storage
  uploadFile: async (file, userId, eventId = null) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const fileName = `${userId}/${eventId || 'temp'}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('timeline-media')
      .upload(fileName, file);
    
    if (error) throw error;
    return data;
  },

  // Get public URL for a file
  getPublicUrl: (path) => {
    if (!isSupabaseAvailable()) {
      return null;
    }
    
    const { data } = supabase.storage
      .from('timeline-media')
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Delete a file from storage
  deleteFile: async (path) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase is not configured');
    }
    
    const { error } = await supabase.storage
      .from('timeline-media')
      .remove([path]);
    
    if (error) throw error;
  }
}; 