class TimelineEvent {
  constructor(data = {}) {
    this.id = data._id || data.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = data.title || '';
    this.description = data.description || '';
    this.date = new Date(data.date || Date.now());
    this.category = data.category || '';
    this.color = data.color || '#3B82F6';
    this.imageUrl = data.imageUrl || '';
    this.videoUrl = data.videoUrl || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.userId = data.userId || null;
  }

  // Getters
  get formattedDate() {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get formattedTime() {
    return this.date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get isExpanded() {
    return this._expanded || false;
  }

  // Setters
  set isExpanded(value) {
    this._expanded = Boolean(value);
  }

  // Methods
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    return this.isExpanded;
  }

  update(data) {
    Object.assign(this, data);
    if (data.date) {
      this.date = new Date(data.date);
    }
    if (data.imageUrl !== undefined) {
      this.imageUrl = data.imageUrl;
    }
    if (data.videoUrl !== undefined) {
      this.videoUrl = data.videoUrl;
    }
    return this;
  }

  toJSON() {
    return {
      _id: this.id,
      title: this.title,
      description: this.description,
      date: this.date.toISOString(),
      category: this.category,
      color: this.color,
      imageUrl: this.imageUrl,
      videoUrl: this.videoUrl,
      createdAt: this.createdAt.toISOString(),
      userId: this.userId
    };
  }

  static fromJSON(data) {
    return new TimelineEvent(data);
  }

  static createSampleEvents() {
    return [
      new TimelineEvent({
        _id: 'sample1',
        title: 'Graduated from University',
        description: 'Successfully completed my degree in Computer Science with honors. This was a major milestone in my academic journey.',
        date: '2023-05-15T10:00:00.000Z',
        color: '#3B82F6',
        category: 'Education',
        imageUrl: '',
        videoUrl: ''
      }),
      new TimelineEvent({
        _id: 'sample2',
        title: 'Started First Job',
        description: 'Began my career as a Software Developer at TechCorp. Excited to start this new chapter and apply my skills in a real-world environment.',
        date: '2023-07-01T09:00:00.000Z',
        color: '#10B981',
        category: 'Career',
        imageUrl: '',
        videoUrl: ''
      }),
      new TimelineEvent({
        _id: 'sample3',
        title: 'Moved to New City',
        description: 'Relocated to San Francisco for better career opportunities. The city is amazing and I\'m loving the tech culture here.',
        date: '2023-08-20T14:00:00.000Z',
        color: '#F59E0B',
        category: 'Personal',
        imageUrl: '',
        videoUrl: ''
      }),
      new TimelineEvent({
        _id: 'sample4',
        title: 'Completed First Project',
        description: 'Successfully delivered my first major project - a full-stack web application. The team was impressed with the results.',
        date: '2023-10-12T16:00:00.000Z',
        color: '#8B5CF6',
        category: 'Work',
        imageUrl: '',
        videoUrl: ''
      }),
      new TimelineEvent({
        _id: 'sample5',
        title: 'Got Promoted',
        description: 'Promoted to Senior Developer! This recognition of my hard work and contributions to the team means a lot.',
        date: '2024-01-15T11:00:00.000Z',
        color: '#EF4444',
        category: 'Career',
        imageUrl: '',
        videoUrl: ''
      }),
      new TimelineEvent({
        _id: 'sample6',
        title: 'Bought First House',
        description: 'Purchased my first home! It\'s a beautiful 3-bedroom house with a great backyard. This is a huge step towards building wealth.',
        date: '2024-03-08T13:00:00.000Z',
        color: '#06B6D4',
        category: 'Personal',
        imageUrl: '',
        videoUrl: ''
      })
    ];
  }
}

export default TimelineEvent; 