const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timeline-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Timeline Event Schema
const timelineEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  category: { type: String, default: 'general' },
  color: { type: String, default: '#3B82F6' },
  imageUrl: { type: String },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Timeline Routes

// Get all timeline events for a user
app.get('/api/timeline', authenticateToken, async (req, res) => {
  try {
    const events = await TimelineEvent.find({ userId: req.user.userId })
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new timeline event
app.post('/api/timeline', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, date, category, color } = req.body;

    const event = new TimelineEvent({
      userId: req.user.userId,
      title,
      description,
      date,
      category,
      color
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update timeline event
app.put('/api/timeline/:id', authenticateToken, async (req, res) => {
  try {
    const event = await TimelineEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete timeline event
app.delete('/api/timeline/:id', authenticateToken, async (req, res) => {
  try {
    const event = await TimelineEvent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Populate demo timeline events for the current user
app.post('/api/timeline/populate-demo', authenticateToken, async (req, res) => {
  try {
    const demoEvents = [
      {
        userId: req.user.userId,
        title: 'Graduated from University',
        description: 'Completed my degree in Computer Science with honors.',
        date: new Date('2022-05-15T10:00:00.000Z'),
        category: 'Education',
        color: '#3B82F6',
        imageUrl: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
        videoUrl: ''
      },
      {
        userId: req.user.userId,
        title: 'Started First Job',
        description: 'Began my career as a Software Developer at TechCorp.',
        date: new Date('2022-07-01T09:00:00.000Z'),
        category: 'Career',
        color: '#10B981',
        imageUrl: '',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      },
      {
        userId: req.user.userId,
        title: 'Moved to New City',
        description: 'Relocated to San Francisco for better career opportunities.',
        date: new Date('2022-08-20T14:00:00.000Z'),
        category: 'Personal',
        color: '#F59E0B',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        videoUrl: ''
      },
      {
        userId: req.user.userId,
        title: 'Completed First Project',
        description: 'Delivered my first major project - a full-stack web app.',
        date: new Date('2022-10-12T16:00:00.000Z'),
        category: 'Work',
        color: '#8B5CF6',
        imageUrl: '',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      {
        userId: req.user.userId,
        title: 'Got Promoted',
        description: 'Promoted to Senior Developer! Hard work pays off.',
        date: new Date('2023-01-15T11:00:00.000Z'),
        category: 'Career',
        color: '#EF4444',
        imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
        videoUrl: ''
      },
      {
        userId: req.user.userId,
        title: 'Bought First House',
        description: 'Purchased my first home! A huge step forward.',
        date: new Date('2023-03-08T13:00:00.000Z'),
        category: 'Personal',
        color: '#06B6D4',
        imageUrl: '',
        videoUrl: ''
      }
    ];
    await TimelineEvent.insertMany(demoEvents);
    res.status(201).json({ message: 'Demo timeline populated!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to populate demo timeline', error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 