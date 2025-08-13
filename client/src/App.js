/**
 * CLEAN TIMELINE APP WITH GOOGLE DOCS STYLE SHARING
 * =================================================
 * This is a simplified version of the timeline app with clean sharing system
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { toast, Toaster } from 'react-hot-toast';
import { sharingService } from './services/sharingService';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Timeline from './components/Timeline';
import ShareModal from './components/ShareModal';
import TimelineBrowser from './components/TimelineBrowser';
import SetupGuide from './components/SetupGuide';
import PendingInvitations from './components/PendingInvitations';
import FloatingActionButton from './components/FloatingActionButton';
import { Calendar, Share, Search, Plus, Menu, User, AlertTriangle } from 'lucide-react';

/**
 * MAIN APP CONTENT COMPONENT
 */
const MainAppContent = () => {
  const { user, signOut } = useAuth();
  const [timelines, setTimelines] = useState({ own_timelines: [], shared_timelines: [] });
  const [activeTimelineId, setActiveTimelineId] = useState(null);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTimelineBrowserOpen, setIsTimelineBrowserOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [triggerAddMemory, setTriggerAddMemory] = useState(null);

  // Load user timelines on mount
  useEffect(() => {
    if (user) {
      loadTimelines();
    }
  }, [user]);

  // Update active timeline when activeTimelineId changes
  useEffect(() => {
    if (activeTimelineId && timelines) {
      const timeline = [...timelines.own_timelines, ...timelines.shared_timelines]
        .find(t => t.id === activeTimelineId);
      setActiveTimeline(timeline || null);
    }
  }, [activeTimelineId, timelines]);

  const loadTimelines = async () => {
    try {
      setLoading(true);
      const timelinesData = await sharingService.getUserTimelines(user.id);
      setTimelines(timelinesData);
      
      // Set first timeline as active if none selected
      if (!activeTimelineId && (timelinesData.own_timelines.length > 0 || timelinesData.shared_timelines.length > 0)) {
        const firstTimeline = timelinesData.own_timelines[0] || timelinesData.shared_timelines[0];
        setActiveTimelineId(firstTimeline.id);
      }
      
      // Database is already set up, so no need to show setup banner
    } catch (error) {
      console.error('Error loading timelines:', error);
      toast.error('Failed to load timelines');
      // Database is already set up, no need for setup banner
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineSelect = (timelineId) => {
    setActiveTimelineId(timelineId);
  };

  const handleTimelineUpdate = (timelineId, updates) => {
    setTimelines(prev => {
      const updateTimelineInList = (list) => 
        list.map(t => t.id === timelineId ? { ...t, ...updates } : t);
      
      return {
        own_timelines: updateTimelineInList(prev.own_timelines),
        shared_timelines: updateTimelineInList(prev.shared_timelines)
      };
    });
  };

  const handleCreateTimeline = async (title, description) => {
    try {
      const newTimeline = await sharingService.createTimeline(title, description, user.id);
      toast.success('Timeline created successfully!');
      await loadTimelines(); // Reload timelines
      setActiveTimelineId(newTimeline.id); // Set new timeline as active
      setIsCreateModalOpen(false);
      setShowSetupBanner(false); // Hide banner on successful creation
    } catch (error) {
      console.error('Error creating timeline:', error);
      // Database is already set up, so just show generic error
      toast.error('Failed to create timeline');
    }
  };

  // Keyboard shortcut for timeline browser
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsTimelineBrowserOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const canShare = activeTimeline && activeTimeline.user_permission === 'owner';

  const handleFabAddMemory = (eventType) => {
    setTriggerAddMemory({ eventType });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your timelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Memory Journal Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-memory-cream border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-medium text-foreground">Memories</span>
              </div>
              
              {/* Active Timeline Selector */}
              {activeTimeline && (
                <div className="hidden md:flex">
                  <button
                    onClick={() => setIsTimelineBrowserOpen(true)}
                    className="flex items-center space-x-3 px-4 py-2 bg-memory-peach hover:bg-memory-coral rounded-xl transition-colors max-w-sm shadow-sm"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activeTimeline.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeTimeline.memories_count || 0} memories • {activeTimeline.collaborators?.length + 1 || 1} total
                      </p>
                    </div>
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Timeline Browser - Mobile */}
              <button
                onClick={() => setIsTimelineBrowserOpen(true)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                title="Browse timelines (⌘K)"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Share Button */}
              {canShare && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Share className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Create Timeline */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-accent rounded-full transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">{user?.email?.split('@')[0]}</span>
                </button>
                
                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border-border border rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-card-foreground">{user?.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
                
                {/* Click outside to close */}
                {isUserMenuOpen && (
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Invitations */}
        <PendingInvitations 
          onTimelineSelect={(timeline) => {
            // Reload timelines to include the newly accepted timeline
            loadTimelines().then(() => {
              setActiveTimelineId(timeline.id);
            });
          }}
          onInvitationHandled={(action, invitation) => {
            // Reload timelines after invitation is handled
            loadTimelines();
          }}
        />
        
        {activeTimeline ? (
          <Timeline 
            timeline={activeTimeline}
            onMemoryAdd={() => loadTimelines()}
            fabTrigger={triggerAddMemory}
            onFabTriggerHandled={() => setTriggerAddMemory(null)}
          />
        ) : (
          <div className="text-center py-12">
            <div className="bg-card rounded-2xl shadow-sm p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-memory-peach rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-3">No Timeline Selected</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {timelines.own_timelines.length === 0 && timelines.shared_timelines.length === 0
                  ? "You don't have any memory collections yet. Create your first one to start capturing your precious moments!"
                  : "Select a memory collection from your library or create a new one."
                }
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Memory Collection</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        timeline={activeTimeline}
        onTimelineUpdate={handleTimelineUpdate}
      />

      <TimelineBrowser
        isOpen={isTimelineBrowserOpen}
        onClose={() => setIsTimelineBrowserOpen(false)}
        timelines={timelines}
        activeTimelineId={activeTimelineId}
        onTimelineSelect={handleTimelineSelect}
        onCreateNew={() => {
          setIsTimelineBrowserOpen(false);
          setIsCreateModalOpen(true);
        }}
      />

      <CreateTimelineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTimeline={handleCreateTimeline}
      />

      {/* Setup Guide Modal */}
      <SetupGuide
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      {/* Setup Banner */}
      {showSetupBanner && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-memory-peach border-border border rounded-2xl p-6 shadow-lg z-40">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Database Setup Required
              </p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Some features may not work until you set up the database schema.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsSetupGuideOpen(true)}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90 transition-opacity shadow-sm"
                >
                  Setup Now
                </button>
                <button
                  onClick={() => setShowSetupBanner(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button - Only show if we have an active timeline */}
      {activeTimeline && (
        <FloatingActionButton onSelectType={handleFabAddMemory} />
      )}
    </div>
  );
};

/**
 * SIMPLE CREATE TIMELINE MODAL
 */
const CreateTimelineModal = ({ isOpen, onClose, onCreateTimeline }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTimeline(title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-8">
        <h2 className="text-xl font-medium text-card-foreground mb-6">Create New Memory Collection</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Collection Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Amazing Journey"
              className="w-full px-4 py-3 bg-input-background border-border text-foreground border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what memories this collection will capture..."
              rows={3}
              className="w-full px-4 py-3 bg-input-background border-border text-foreground border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center space-x-2 shadow-sm"
            >
              {isCreating && (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isCreating ? 'Creating...' : 'Create Collection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * PRIVATE ROUTE COMPONENT
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * SHARED TIMELINE VIEW (for public links)
 */
const SharedTimelineView = () => {
  // This would handle public timeline viewing via share links
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shared Timeline</h2>
        <p className="text-gray-600">Shared timeline viewing will be implemented here</p>
      </div>
    </div>
  );
};

/**
 * MAIN APP COMPONENT
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#374151',
                color: '#fff',
                borderRadius: '8px',
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
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shared/:shareToken" element={<SharedTimelineView />} />
            
            {/* Private Routes */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <MainAppContent />
                </PrivateRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
