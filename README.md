# Timeline App

A modern, interactive timeline application built with React, Node.js, and MongoDB. Create, manage, and visualize your personal timeline with beautiful UI and easy-to-use features.

## Features

- 🔐 **User Authentication**: Secure sign up and login with JWT
- 📅 **Interactive Timeline**: Beautiful timeline visualization with color-coded events
- ➕ **Easy Event Management**: Add, edit, and delete timeline events
- 🎨 **Customizable Events**: Choose colors and categories for your events
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔒 **User Privacy**: Each user's timeline is private and secure

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

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

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   npm run client
   ```
   The React app will run on `http://localhost:3000`

### Production Mode

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
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