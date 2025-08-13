---
description: Repository Information Overview
alwaysApply: true
---

# Relationship Timeline App Information

## Summary
An interactive timeline application built with React, Node.js, and Supabase. The app allows users to create, manage, and visualize relationship milestones with a beautiful UI and easy-to-use features. It includes user authentication, interactive timeline visualization, and event management capabilities.

## Structure
- **client/**: React frontend application
  - **src/**: Source code with components, contexts, and services
  - **public/**: Static assets and HTML template
  - **build/**: Production-ready build (generated)
- **server.js**: Express backend server (minimal, mainly serves React)
- **SQL files**: Database schema definitions for Supabase
- **Configuration files**: package.json, render.yaml for deployment

## Language & Runtime
**Language**: JavaScript
**Frontend Framework**: React 18
**Backend Runtime**: Node.js (v16+ required)
**Build System**: npm scripts
**Package Manager**: npm

## Dependencies

### Backend Dependencies
**Main Dependencies**:
- express: ^4.18.2 (Web server framework)
- cors: ^2.8.5 (Cross-origin resource sharing)
- dotenv: ^16.3.1 (Environment variable management)
- react-scripts: ^5.0.1 (React build tools)

**Development Dependencies**:
- nodemon: ^3.0.1 (Auto-restart server during development)

### Frontend Dependencies
**Main Dependencies**:
- react: ^18.2.0 (UI library)
- react-dom: ^18.2.0 (DOM rendering for React)
- react-router-dom: ^6.14.1 (Client-side routing)
- @supabase/supabase-js: ^2.52.1 (Supabase client)
- axios: ^1.4.0 (HTTP client)
- date-fns: ^2.30.0 (Date utilities)
- lucide-react: ^0.263.1 (Icon library)
- react-hot-toast: ^2.4.1 (Toast notifications)

## Database
**Type**: PostgreSQL (via Supabase)
**Schema**: 
- timelines: Stores timeline metadata
- timeline_events: Stores individual timeline events
- Row-level security policies for data protection
- SQL functions for data access

## Build & Installation
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client

# Development mode (two terminals needed)
npm run dev        # Start backend server on port 5001
npm run client     # Start React dev server on port 3000

# Production build
npm run build      # Creates optimized production build

# Start production server
NODE_ENV=production npm start  # Serves both API and React app on port 5001
```

## Deployment
**Platform**: Render (configured via render.yaml)
**Build Command**: npm run render-build
**Start Command**: npm start
**Environment Variables**:
- NODE_ENV: production
- PORT: 10000
- REACT_APP_SUPABASE_URL (set in Render dashboard)
- REACT_APP_SUPABASE_ANON_KEY (set in Render dashboard)

## Testing
**Framework**: Jest (via React Testing Library)
**Test Location**: client/src/components/\*.test.js (implied)
**Run Command**:
```bash
cd client
npm test
```

## Project Structure Details
**Frontend Structure**:
- **components/**: UI components (Timeline, TimelineItem, modals, etc.)
- **contexts/**: Global state management (AuthContext)
- **services/**: API calls to Supabase
- **lib/**: Utility functions
- **models/**: Data models

**Backend Structure**:
- Minimal Express server (server.js)
- Health check and info endpoints
- Static file serving for production build
- CORS configuration for development