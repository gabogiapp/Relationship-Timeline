# Timeline App - Tech Improvements Setup Guide

This guide will help you set up the improved timeline application with all the new features.

## 🚀 New Features

- **Supabase Integration**: Better data modeling and authentication
- **Zustand State Management**: Global state management for better performance
- **Virtualized Timeline**: Smooth scrolling for large datasets
- **Media Storage**: File uploads with compression and thumbnails
- **Enhanced Authentication**: Supabase Auth with email confirmation

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier available)

## 🛠️ Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Note down your project URL and anon key

### 2. Set Up Database Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create timeline_events table
CREATE TABLE timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT,
  type TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  media JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their events
CREATE POLICY "Users can view own events" ON timeline_events
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own events
CREATE POLICY "Users can insert own events" ON timeline_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own events
CREATE POLICY "Users can update own events" ON timeline_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own events
CREATE POLICY "Users can delete own events" ON timeline_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_timeline_events_updated_at 
  BEFORE UPDATE ON timeline_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Set Up Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `timeline-media`
3. Set it to public (for easy access to media files)
4. Add this storage policy:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'timeline-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow public access to media files
CREATE POLICY "Public access to media" ON storage.objects
  FOR SELECT USING (bucket_id = 'timeline-media');
```

### 4. Configure Environment Variables

1. Copy `client/env.example` to `client/.env`
2. Update the values with your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
```

### 6. Start the Application

```bash
# From the root directory
npm run dev
```

This will start both the server and client in development mode.

## 🔧 Configuration Options

### Authentication Settings

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL
3. Set up email templates if desired
4. Enable email confirmations (recommended)

### Storage Settings

1. Go to Storage > Settings
2. Configure CORS if needed
3. Set up file size limits (default is 50MB)

## 🎯 Features Overview

### State Management (Zustand)
- Global timeline state
- Pagination support
- Filtering and search
- Optimistic updates

### Virtualization
- Smooth scrolling for large datasets
- Dynamic height calculation
- Infinite scroll loading
- Performance optimized rendering

### Media Storage
- Image compression
- Video thumbnails
- File validation
- Multiple file uploads
- Public URL generation

### Authentication
- Email/password authentication
- Email confirmation
- Password reset
- Session management
- Row-level security

## 🚀 Performance Improvements

1. **Virtualized Rendering**: Only renders visible timeline items
2. **Image Compression**: Automatic compression before upload
3. **Lazy Loading**: Load more events as user scrolls
4. **Optimistic Updates**: Immediate UI feedback
5. **Caching**: Supabase handles caching automatically

## 🔒 Security Features

1. **Row Level Security**: Users can only access their own data
2. **File Validation**: Prevents malicious file uploads
3. **Authentication**: Secure user sessions
4. **CORS Protection**: Configured for your domain

## 📱 Usage

1. **Register/Login**: Create an account or sign in
2. **Add Events**: Use the floating action button to add different types of events
3. **Upload Media**: Attach images, videos, or audio files
4. **Search & Filter**: Use the search bar and filters to find specific events
5. **View Timeline**: Scroll through your timeline with smooth performance

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**: Check your environment variables
2. **Media Upload Fails**: Verify storage bucket permissions
3. **Authentication Issues**: Check Supabase auth settings
4. **Performance Issues**: Ensure virtualization is working properly

### Debug Mode

Add this to your `.env` file for detailed logging:
```env
REACT_APP_DEBUG=true
```

## 📈 Next Steps

- Add more event types
- Implement sharing features
- Add export functionality
- Create mobile app
- Add analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 