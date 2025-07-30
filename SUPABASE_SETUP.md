# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `relationship-timeline` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Configure Environment Variables

Create a `.env` file in the `client` directory with:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Development server proxy
REACT_APP_API_URL=http://localhost:5001
```

Replace `your-project-id` and `your-anon-key-here` with your actual values.

## 4. Set Up Database Tables

Run the following SQL in your Supabase SQL Editor:

### Users Table
```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for users to insert their own data
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Timeline Events Table
```sql
-- Create timeline_events table
CREATE TABLE public.timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  category TEXT,
  importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  media_files JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own events
CREATE POLICY "Users can manage own events" ON public.timeline_events
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_timeline_events_user_date ON public.timeline_events(user_id, event_date DESC);
CREATE INDEX idx_timeline_events_category ON public.timeline_events(category);
```

### Media Files Table
```sql
-- Create media_files table
CREATE TABLE public.media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own media files
CREATE POLICY "Users can manage own media files" ON public.media_files
  FOR ALL USING (auth.uid() = user_id);
```

## 5. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it `timeline-media`
4. Make it **Private** (not public)
5. Click **Create bucket**

### Storage Policies
Run this SQL to set up storage policies:

```sql
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'timeline-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'timeline-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'timeline-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'timeline-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your site URL (for development: `http://localhost:3000`)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/`

## 7. Test Your Setup

1. Start your React app: `npm start`
2. Check the browser console for any Supabase connection errors
3. Try to sign up/sign in to test authentication

## 8. Environment Variables Reference

Make sure your `.env` file contains:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting

- **Connection errors**: Double-check your URL and anon key
- **RLS errors**: Make sure you're authenticated and policies are set up correctly
- **Storage errors**: Verify bucket exists and policies are configured
- **CORS errors**: Check your site URL configuration in Supabase dashboard

## Next Steps

After completing this setup:
1. Test authentication flow
2. Test creating/reading timeline events
3. Test file upload functionality
4. Deploy your app and update production URLs in Supabase dashboard 