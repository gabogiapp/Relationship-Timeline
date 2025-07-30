import { create } from 'zustand';
import { db, isSupabaseAvailable } from '../lib/supabase';

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Demo data for the timeline
const demoEvents = [
  {
    id: 'demo-1',
    title: 'First Coffee Date',
    description: 'Our first coffee date at the local café. We talked for hours and I knew this was something special. The way she smiled when talking about her dreams made my heart skip a beat.',
    date: '2024-01-15T18:00:00Z',
    category: 'Memory',
    type: 'memory',
    color: '#10B981',
    media: [],
    created_at: '2024-01-15T18:00:00Z',
    updated_at: '2024-01-15T18:00:00Z'
  },
  {
    id: 'demo-2',
    title: 'Moved In Together',
    description: 'Finally moved in together! This is a huge step in our relationship. Setting up our new home together has been both exciting and challenging. I love how we compromise and work as a team.',
    date: '2024-03-20T12:00:00Z',
    category: 'Milestone',
    type: 'milestone',
    color: '#8B5CF6',
    media: [],
    created_at: '2024-03-20T12:00:00Z',
    updated_at: '2024-03-20T12:00:00Z'
  },
  {
    id: 'demo-3',
    title: 'Beach Vacation',
    description: 'Amazing week at the beach! Perfect weather, great food, and the most beautiful sunsets. We discovered a hidden beach spot that became our favorite place. The sound of waves and her laughter will stay with me forever.',
    date: '2024-06-10T10:00:00Z',
    category: 'Memory',
    type: 'memory',
    color: '#10B981',
    media: [],
    created_at: '2024-06-10T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z'
  },
  {
    id: 'demo-4',
    title: 'First Fight & Makeup',
    description: 'We had our first real argument today. It was about something silly but it taught us how to communicate better. The makeup conversation was even more meaningful than the fight. We learned that we can disagree and still love each other.',
    date: '2024-02-08T20:00:00Z',
    category: 'Emotion',
    type: 'emotion',
    color: '#EC4899',
    media: [],
    created_at: '2024-02-08T20:00:00Z',
    updated_at: '2024-02-08T20:00:00Z'
  },
  {
    id: 'demo-5',
    title: 'Cooking Together',
    description: 'We tried cooking a new recipe together tonight. It was a disaster but we laughed so much! The kitchen was a mess but the memories we made were priceless. We decided to order pizza instead.',
    date: '2024-04-12T19:00:00Z',
    category: 'Memory',
    type: 'memory',
    color: '#10B981',
    media: [],
    created_at: '2024-04-12T19:00:00Z',
    updated_at: '2024-04-12T19:00:00Z'
  },
  {
    id: 'demo-6',
    title: 'Meeting the Parents',
    description: 'Today I met her parents for the first time. I was so nervous but they were incredibly welcoming. Her mom gave me the biggest hug and her dad told me stories about when she was little. I feel like I\'m part of the family now.',
    date: '2024-05-03T14:00:00Z',
    category: 'Milestone',
    type: 'milestone',
    color: '#8B5CF6',
    media: [],
    created_at: '2024-05-03T14:00:00Z',
    updated_at: '2024-05-03T14:00:00Z'
  },
  {
    id: 'demo-7',
    title: 'Late Night Conversations',
    description: 'We stayed up until 3 AM talking about everything - our dreams, fears, childhood memories, and future plans. These deep conversations are what I love most about our relationship. I feel so connected to her.',
    date: '2024-07-22T23:00:00Z',
    category: 'Journal',
    type: 'journal',
    color: '#3B82F6',
    media: [],
    created_at: '2024-07-22T23:00:00Z',
    updated_at: '2024-07-22T23:00:00Z'
  },
  {
    id: 'demo-8',
    title: 'Planning Our Future',
    description: 'We spent the evening planning our future together. Talking about where we want to live, career goals, and maybe starting a family someday. It feels amazing to have someone to dream with.',
    date: '2024-08-15T16:00:00Z',
    category: 'Goal',
    type: 'goal',
    color: '#F59E0B',
    media: [],
    created_at: '2024-08-15T16:00:00Z',
    updated_at: '2024-08-15T16:00:00Z'
  },
  {
    id: 'demo-9',
    title: 'Surprise Birthday Party',
    description: 'I threw her a surprise birthday party! The look on her face when she walked in was priceless. All our friends were there and we had the best time. She said it was the best birthday ever.',
    date: '2024-09-28T18:00:00Z',
    category: 'Memory',
    type: 'memory',
    color: '#10B981',
    media: [],
    created_at: '2024-09-28T18:00:00Z',
    updated_at: '2024-09-28T18:00:00Z'
  },
  {
    id: 'demo-10',
    title: 'Overcoming Challenges',
    description: 'We faced a difficult situation together today. It was hard but we supported each other through it. I realized how strong our relationship has become. We can handle anything together.',
    date: '2024-10-05T15:00:00Z',
    category: 'Emotion',
    type: 'emotion',
    color: '#EC4899',
    media: [],
    created_at: '2024-10-05T15:00:00Z',
    updated_at: '2024-10-05T15:00:00Z'
  },
  {
    id: 'demo-11',
    title: 'Holiday Traditions',
    description: 'We started our own holiday traditions this year. We decorated the tree together, made cookies, and watched our favorite movies. It feels like we\'re building our own little family.',
    date: '2024-12-20T17:00:00Z',
    category: 'Memory',
    type: 'memory',
    color: '#10B981',
    media: [],
    created_at: '2024-12-20T17:00:00Z',
    updated_at: '2024-12-20T17:00:00Z'
  },
  {
    id: 'demo-12',
    title: 'New Year\'s Resolutions',
    description: 'We made our New Year\'s resolutions together. We want to travel more, learn a new language together, and spend more quality time with each other. I\'m excited for what this year will bring.',
    date: '2025-01-01T00:00:00Z',
    category: 'Goal',
    type: 'goal',
    color: '#F59E0B',
    media: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Generate thousands of test events
const generateTestEvents = (count = 5000) => {
  const events = [];
  const categories = ['Memory', 'Milestone', 'Emotion', 'Journal', 'Goal'];
  const colors = ['#10B981', '#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B'];
  const titles = [
    'Morning Coffee', 'Evening Walk', 'Movie Night', 'Dinner Date', 'Weekend Trip',
    'Deep Conversation', 'Laughing Together', 'Cooking Adventure', 'Garden Work',
    'Book Reading', 'Music Session', 'Art Project', 'Game Night', 'Stargazing',
    'Beach Day', 'Mountain Hike', 'City Exploration', 'Quiet Evening', 'Dance Party',
    'Photo Session', 'Memory Lane', 'Future Planning', 'Dream Sharing', 'Goal Setting'
  ];
  
  const descriptions = [
    'A beautiful moment we shared together.',
    'Another day of growing closer to each other.',
    'These small moments make our relationship special.',
    'Every day with you is a new adventure.',
    'I love how we discover new things together.',
    'Our relationship keeps getting stronger.',
    'These memories will last forever.',
    'I appreciate every moment with you.',
    'We make the best team together.',
    'Life is better with you by my side.'
  ];

  for (let i = 0; i < count; i++) {
    const categoryIndex = i % categories.length;
    const colorIndex = i % colors.length;
    const titleIndex = i % titles.length;
    const descIndex = i % descriptions.length;
    
    // Generate dates spanning 3 years
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2026-01-01');
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    events.push({
      id: `test-${i + 1}`,
      title: `${titles[titleIndex]} #${i + 1}`,
      description: descriptions[descIndex],
      date: randomDate.toISOString(),
      category: categories[categoryIndex],
      type: categories[categoryIndex].toLowerCase(),
      color: colors[colorIndex],
      media: [],
      created_at: randomDate.toISOString(),
      updated_at: randomDate.toISOString()
    });
  }
  
  // Sort by date (newest first)
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const useTimelineStore = create((set, get) => ({
  // State
  events: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    dateRange: null,
    searchQuery: ''
  },
  pagination: {
    page: 1,
    limit: 50,
    hasMore: true
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Load test data (for testing purposes)
  loadTestData: () => {
    set({
      events: demoEvents,
      loading: false,
      error: null,
      pagination: { page: 1, limit: 50, hasMore: false }
    });
  },

  // Load thousands of test events for virtualization testing
  loadThousandsOfEvents: (count = 5000) => {
    const testEvents = generateTestEvents(count);
    set({
      events: testEvents,
      loading: false,
      error: null,
      pagination: { page: 1, limit: 50, hasMore: false }
    });
    console.log(`✅ Loaded ${count} test events for virtualization testing`);
  },

  // Fetch events with pagination and virtualization support
  fetchEvents: async (options = {}) => {
    const { page = 1, limit = 50, category, dateRange, searchQuery } = options;
    
    set({ loading: true, error: null });
    
    try {
      // Check if Supabase is available
      if (!isSupabaseAvailable()) {
        // Use test data when Supabase is not configured
        const testEvents = generateTestEvents(5000); // Generate 5000 test events
        const filteredEvents = testEvents.filter(event => {
          if (category && event.category !== category) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return event.title.toLowerCase().includes(query) || 
                   event.description.toLowerCase().includes(query);
          }
          return true;
        });
        
        set({
          events: filteredEvents,
          pagination: { page: 1, limit, hasMore: false },
          loading: false
        });
        
        return { data: filteredEvents, hasMore: false };
      }

      // Get current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Use the new db helper
      const events = await db.getEvents(currentUser.id, {
        limit,
        category
      });

      // Apply additional filters
      let filteredEvents = events;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEvents = events.filter(event => 
          event.title.toLowerCase().includes(query) || 
          event.description.toLowerCase().includes(query)
        );
      }
      
      if (dateRange?.start) {
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.event_date) >= new Date(dateRange.start)
        );
      }
      
      if (dateRange?.end) {
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.event_date) <= new Date(dateRange.end)
        );
      }

      // If no events found in database, use demo data
      if (!filteredEvents || filteredEvents.length === 0) {
        const demoFilteredEvents = demoEvents.filter(event => {
          if (category && event.category !== category) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return event.title.toLowerCase().includes(query) || 
                   event.description.toLowerCase().includes(query);
          }
          return true;
        });
        
        set({
          events: demoFilteredEvents,
          pagination: { page: 1, limit, hasMore: false },
          loading: false
        });
        
        return { data: demoFilteredEvents, hasMore: false };
      }

      const hasMore = filteredEvents.length === limit;
      
      set((state) => ({
        events: page === 1 ? filteredEvents : [...state.events, ...filteredEvents],
        pagination: { page, limit, hasMore },
        loading: false
      }));

      return { data: filteredEvents, hasMore };
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add new event
  addEvent: async (eventData) => {
    set({ loading: true, error: null });
    
    try {
      if (!isSupabaseAvailable()) {
        // Add to demo data
        const newEvent = {
          ...eventData,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({
          events: [newEvent, ...state.events],
          loading: false
        }));
        
        return newEvent;
      }

      // Get current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Add user_id to event data
      const eventWithUserId = {
        ...eventData,
        user_id: currentUser.id
      };

      // Use the new db helper
      const newEvent = await db.createEvent(eventWithUserId);

      // Refresh the events list to ensure we have the latest data
      await get().fetchEvents();

      return newEvent;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update event
  updateEvent: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      if (!isSupabaseAvailable()) {
        // Update demo data
        set((state) => ({
          events: state.events.map(event => 
            event.id === id ? { ...event, ...updates, updated_at: new Date().toISOString() } : event
          ),
          loading: false
        }));
        
        return get().events.find(event => event.id === id);
      }

      // Get current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Use the new db helper
      const updatedEvent = await db.updateEvent(id, updates);

      set((state) => ({
        events: state.events.map(event => 
          event.id === id ? updatedEvent : event
        ),
        loading: false
      }));

      return updatedEvent;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    
    try {
      if (!isSupabaseAvailable()) {
        // Remove from demo data
        set((state) => ({
          events: state.events.filter(event => event.id !== id),
          loading: false
        }));
        
        return true;
      }

      // Get current user
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Use the new db helper
      await db.deleteEvent(id);

      set((state) => ({
        events: state.events.filter(event => event.id !== id),
        loading: false
      }));

      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, pagination: { page: 1, limit: 50, hasMore: true } });
    get().fetchEvents({ page: 1, ...filters });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: { category: null, dateRange: null, searchQuery: '' } });
    get().fetchEvents({ page: 1 });
  },

  // Load more events (for infinite scroll)
  loadMore: () => {
    const { pagination, filters } = get();
    if (pagination.hasMore && !get().loading) {
      get().fetchEvents({
        page: pagination.page + 1,
        ...filters
      });
    }
  },

  // Reset store
  reset: () => {
    set({
      events: [],
      loading: false,
      error: null,
      filters: { category: null, dateRange: null, searchQuery: '' },
      pagination: { page: 1, limit: 50, hasMore: true }
    });
  }
}));

export default useTimelineStore; 