import React, { useState, useEffect } from 'react';
import { Search, Calendar, Crown, Edit, Eye, Users, Clock, Plus, X } from 'lucide-react';

const TimelineBrowser = ({ isOpen, onClose, timelines, activeTimelineId, onTimelineSelect, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and categorize timelines
  const filteredOwnTimelines = (timelines?.own_timelines || []).filter(timeline =>
    timeline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    timeline.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedTimelines = (timelines?.shared_timelines || []).filter(timeline =>
    timeline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    timeline.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    timeline.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create searchable items
  const searchItems = [
    // Create new option
    {
      type: 'action',
      id: 'create-new',
      title: 'Create New Timeline',
      subtitle: 'Start a fresh collection of memories',
      icon: Plus
    },
    // Own timelines
    ...filteredOwnTimelines.map(timeline => ({
      type: 'timeline',
      timeline,
      category: 'Your Timelines'
    })),
    // Shared timelines
    ...filteredSharedTimelines.map(timeline => ({
      type: 'timeline',
      timeline,
      category: 'Shared with You'
    }))
  ];

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selectedItem = searchItems[selectedIndex];
        if (selectedItem?.type === 'action' && selectedItem.id === 'create-new') {
          onCreateNew();
          onClose();
        } else if (selectedItem?.type === 'timeline') {
          onTimelineSelect(selectedItem.timeline.id);
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, searchItems.length]);

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'owner': return Crown;
      case 'editor': return Edit;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'owner': return 'text-yellow-600 bg-yellow-100';
      case 'editor': return 'text-green-600 bg-green-100';
      case 'viewer': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search timelines or type to filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No timelines found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {searchItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                
                if (item.type === 'action') {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-r-2 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        onCreateNew();
                        onClose();
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        New
                      </div>
                    </div>
                  );
                }

                const timeline = item.timeline;
                const PermissionIcon = getPermissionIcon(timeline.user_permission);
                const permissionColor = getPermissionColor(timeline.user_permission);
                const isActive = timeline.id === activeTimelineId;

                return (
                  <div
                    key={timeline.id}
                    className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-r-2 border-blue-500' 
                        : isActive 
                          ? 'bg-gray-50' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      onTimelineSelect(timeline.id);
                      onClose();
                    }}
                  >
                    {/* Timeline Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>

                    {/* Timeline Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium truncate ${isActive ? 'text-blue-600' : ''}`}>
                          {timeline.title}
                        </p>
                        {isActive && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                        <span>{timeline.memories_count || 0} memories</span>
                        {timeline.collaborators && timeline.collaborators.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{timeline.collaborators.length + 1}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(timeline.updated_at)}</span>
                        </span>
                      </div>

                      {timeline.user_permission !== 'owner' && timeline.owner && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {timeline.owner.name || timeline.owner.email}
                        </p>
                      )}
                    </div>

                    {/* Permission Badge */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${permissionColor} flex items-center gap-1`}>
                      <PermissionIcon className="w-3 h-3" />
                      {timeline.user_permission.charAt(0).toUpperCase() + timeline.user_permission.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{searchItems.length} results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineBrowser;