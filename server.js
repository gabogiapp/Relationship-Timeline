/**
 * EXPRESS SERVER FOR RELATIONSHIP TIMELINE APP
 * ============================================
 * This is a simple Express.js server that serves as a proxy/host for the React app.
 * All data operations are handled directly by Supabase in the frontend.
 * 
 * PORT CONFIGURATION:
 * - Development: Backend runs on port 5001, React dev server on port 3000
 * - Production: Single port (5001) serves both backend API and React build files
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
// Use environment PORT (for deployment platforms) or fallback to 5001
const PORT = process.env.PORT || 5001;

// ===============================
// MIDDLEWARE CONFIGURATION
// ===============================

// Enable Cross-Origin Resource Sharing for frontend requests
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false // In production, only serve from same origin
    : ['http://localhost:3000', 'http://localhost:3001'] // Allow React dev server
}));

// Parse JSON request bodies (for API endpoints)
app.use(express.json({ limit: '10mb' }));

// ===============================
// API ENDPOINTS
// ===============================

/**
 * Health Check Endpoint
 * Used to verify server is running (useful for deployment monitoring)
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Relationship Timeline Server is running',
    backend: 'Supabase',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

/**
 * API Information Endpoint
 * Provides details about available endpoints and app info
 */
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Relationship Timeline API',
    version: '2.0.0',
    backend: 'Supabase',
    description: 'This server hosts the React app and provides proxy endpoints. All timeline data is managed by Supabase.',
    endpoints: {
      health: '/api/health - Server health check',
      info: '/api/info - API information',
      app: '/ - React Timeline Application'
    },
    features: [
      'User Authentication (Supabase Auth)',
      'Timeline Event Management',
      'Real-time Updates',
      'Responsive Design'
    ]
  });
});

// ===============================
// PRODUCTION STATIC FILE SERVING
// ===============================

/**
 * In production, serve React build files
 * This allows the app to work with a single server for both frontend and backend
 */
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build directory
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Handle React Router - send all non-API routes to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
} else {
  // Development mode - just show API info on root
  app.get('/', (req, res) => {
    res.json({
      message: 'Relationship Timeline API - Development Mode',
      frontend: 'Run "npm run client" to start React dev server on port 3000',
      backend: `Backend API running on port ${PORT}`,
      endpoints: ['/api/health', '/api/info']
    });
  });
}

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                RELATIONSHIP TIMELINE SERVER                ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ 🚀 Server Status: RUNNING                                 ║`);
  console.log(`║ 📡 Backend: Supabase                                       ║`);
  console.log(`║ 🌐 Port: ${PORT.toString().padEnd(51)}║`);
  console.log(`║ 🔗 Health Check: http://localhost:${PORT}/api/health${''.padEnd(18)}║`);
  console.log(`║ ℹ️  API Info: http://localhost:${PORT}/api/info${''.padEnd(22)}║`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`║ 🎯 App URL: http://localhost:${PORT}${''.padEnd(28)}║`);
  } else {
    console.log(`║ 🛠️  Development Mode: Start React with "npm run client"   ║`);
    console.log(`║ 🎯 Frontend will be: http://localhost:3000                ║`);
  }
  
  console.log('╚════════════════════════════════════════════════════════════╝');
}); 