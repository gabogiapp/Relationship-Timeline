# 💕 Relationship Timeline App

A modern, interactive timeline application built with **React**, **Node.js**, and **Supabase**. Create, manage, and visualize your relationship milestones with a beautiful UI and easy-to-use features.

## ✨ Features

- 🔐 **User Authentication**: Secure sign up and login with Supabase Auth
- 📅 **Interactive Timeline**: Beautiful timeline visualization with color-coded events
- ➕ **Easy Event Management**: Add, edit, and delete timeline events with rich descriptions
- 🎨 **Customizable Events**: Choose colors and categories for your special moments
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🔒 **User Privacy**: Each user's timeline is completely private and secure
- ⚡ **Real-time Updates**: Changes sync instantly across all devices
- 🌐 **Cloud-based**: All data stored securely in Supabase cloud

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework (serves React app in production)
- **Supabase** - Database and Authentication (replaces MongoDB + JWT)
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **date-fns** - Date formatting and manipulation
- **Lucide React** - Beautiful, consistent icons
- **React Hot Toast** - Elegant notifications
- **Supabase Client** - Real-time database operations

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Supabase account** - [Sign up free](https://supabase.com)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timeline-app
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/timeline-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

   **Note**: Replace the MongoDB URI with your own connection string if using MongoDB Atlas.

5. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   mongod
   ```

## 🚀 Running the Application

### Development Mode (Recommended for coding)

**Two servers running simultaneously:**

1. **Start the backend server** (Terminal 1):
   ```bash
   npm run dev
   ```
   - Server runs on `http://localhost:5001`
   - Provides API endpoints and serves static files in production

2. **Start the React development server** (Terminal 2):
   ```bash
   npm run client
   ```
   - React app runs on `http://localhost:3000`
   - Hot reloading for instant updates during development
   - Automatically proxies API calls to backend server

**Visit `http://localhost:3000` to use the app in development mode.**

### Production Mode (For deployment)

**Single server serves everything:**

1. **Build the React app for production**
   ```bash
   npm run build
   ```
   - Creates optimized production build in `client/build/`

2. **Start the production server**
   ```bash
   NODE_ENV=production npm start
   ```
   - Single server on port 5001 serves both API and React app
   - Visit `http://localhost:5001` to use the production version

### Quick Start (One command)
```bash
# Install all dependencies and start development servers
npm install && npm run install-client && npm run dev & npm run client
```

## Usage

1. **Create an Account**: Visit the app and click "Sign up" to create a new account
2. **Add Events**: Click "Add Event" to create new timeline entries
3. **Customize**: Choose colors and categories for your events
4. **Manage**: Edit or delete events using the action buttons
5. **View**: Your timeline will display events chronologically

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Timeline Events
- `GET /api/timeline` - Get all events for authenticated user
- `POST /api/timeline` - Create a new event
- `PUT /api/timeline/:id` - Update an event
- `DELETE /api/timeline/:id` - Delete an event

## Project Structure

```
timeline-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
│   └── package.json
├── server.js              # Express server
├── package.json           # Backend dependencies
└── README.md
```

## Features in Detail

### Timeline Visualization
- Events are displayed in chronological order
- Alternating left/right layout for better readability
- Color-coded dots for easy event identification
- Responsive design that adapts to mobile screens

### Event Management
- **Add Events**: Modal form with title, description, date/time, category, and color
- **Edit Events**: Click the edit icon to modify existing events
- **Delete Events**: Click the delete icon with confirmation dialog
- **Color Coding**: Choose from 8 predefined colors for event categorization

### User Experience
- **Toast Notifications**: Success and error messages
- **Loading States**: Spinner animations during API calls
- **Form Validation**: Client-side and server-side validation
- **Responsive Design**: Works on all device sizes

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **User Isolation**: Users can only access their own timeline events

## Deployment

### Heroku Deployment

1. **Create a Heroku app**
   ```bash
   heroku create your-timeline-app
   ```

2. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Other Platforms

The app can be deployed to any platform that supports Node.js:
- Vercel
- Netlify
- DigitalOcean
- AWS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Timeline Building! 🎉** 