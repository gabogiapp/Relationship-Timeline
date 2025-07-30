const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    backend: 'Supabase',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Relationship Timeline API',
    version: '2.0.0',
    backend: 'Supabase',
    description: 'This server acts as a proxy for the React app. All data operations are handled by Supabase.',
    endpoints: {
      health: '/api/health',
      info: '/api/info'
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Backend: Supabase (No MongoDB required)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`ℹ️  API info: http://localhost:${PORT}/api/info`);
}); 