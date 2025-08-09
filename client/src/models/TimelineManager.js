import TimelineEvent from './TimelineEvent';

class TimelineManager {
  constructor() {
    // Use Map for O(1) lookup by ID
    this.events = new Map();
    // Use Set for unique categories
    this.categories = new Set();
    // Sorted array for chronological display
    this._sortedEvents = [];
    this._isDirty = true; // Flag to track if sorting is needed
  }

  // Add event
  addEvent(eventData) {
    const event = eventData instanceof TimelineEvent ? eventData : new TimelineEvent(eventData);
    this.events.set(event.id, event);
    if (event.category) {
      this.categories.add(event.category);
    }
    this._isDirty = true;
    return event;
  }

  // Get event by ID
  getEvent(id) {
    return this.events.get(id);
  }

  // Update event
  updateEvent(id, data) {
    const event = this.events.get(id);
    if (event) {
      event.update(data);
      if (data.category) {
        this.categories.add(data.category);
      }
      this._isDirty = true;
      return event;
    }
    return null;
  }

  // Delete event
  deleteEvent(id) {
    const event = this.events.get(id);
    if (event) {
      this.events.delete(id);
      this._isDirty = true;
      return true;
    }
    return false;
  }

  // Get all events (sorted)
  getAllEvents() {
    if (this._isDirty) {
      this._sortedEvents = Array.from(this.events.values())
        .sort((a, b) => a.date - b.date);
      this._isDirty = false;
    }
    return this._sortedEvents;
  }

  // Get events by category
  getEventsByCategory(category) {
    return this.getAllEvents().filter(event => event.category === category);
  }

  // Get events by date range
  getEventsByDateRange(startDate, endDate) {
    return this.getAllEvents().filter(event => 
      event.date >= startDate && event.date <= endDate
    );
  }

  // Get categories
  getCategories() {
    return Array.from(this.categories).sort();
  }

  // Get event count
  getEventCount() {
    return this.events.size;
  }

  // Clear all events
  clear() {
    this.events.clear();
    this.categories.clear();
    this._sortedEvents = [];
    this._isDirty = false;
  }

  // Load events from API data
  loadFromAPI(apiData) {
    this.clear();
    apiData.forEach(eventData => {
      this.addEvent(eventData);
    });
    return this.getAllEvents();
  }



  // Export to JSON
  toJSON() {
    return Array.from(this.events.values()).map(event => event.toJSON());
  }

  // Import from JSON
  fromJSON(jsonData) {
    this.clear();
    jsonData.forEach(eventData => {
      this.addEvent(eventData);
    });
    return this.getAllEvents();
  }

  // Search events
  searchEvents(query) {
    const searchTerm = query.toLowerCase();
    return this.getAllEvents().filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.category.toLowerCase().includes(searchTerm)
    );
  }

  // Get events for a specific year
  getEventsByYear(year) {
    return this.getAllEvents().filter(event => 
      event.date.getFullYear() === year
    );
  }

  // Get events for a specific month
  getEventsByMonth(year, month) {
    return this.getAllEvents().filter(event => 
      event.date.getFullYear() === year && 
      event.date.getMonth() === month
    );
  }

  // Toggle event expansion
  toggleEventExpansion(id) {
    const event = this.events.get(id);
    if (event) {
      return event.toggleExpanded();
    }
    return false;
  }

  // Expand all events
  expandAll() {
    this.events.forEach(event => {
      event.isExpanded = true;
    });
  }

  // Collapse all events
  collapseAll() {
    this.events.forEach(event => {
      event.isExpanded = false;
    });
  }
}

export default TimelineManager; 