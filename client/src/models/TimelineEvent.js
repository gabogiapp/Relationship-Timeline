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
    this.media = data.media || []; // Add media property
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
    if (data.media !== undefined) {
      this.media = data.media;
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
      media: this.media, // Add media to JSON output
      createdAt: this.createdAt.toISOString(),
      userId: this.userId
    };
  }

  static fromJSON(data) {
    return new TimelineEvent(data);
  }


}

export default TimelineEvent; 