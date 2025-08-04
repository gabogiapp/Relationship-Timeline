-- Journals Table Setup
-- Run this SQL in your Supabase SQL Editor

-- Create journals table
CREATE TABLE public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own journals
CREATE POLICY "Users can manage own journals" ON public.journals
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_journals_user_created ON public.journals(user_id, created_at DESC);

-- Create journals storage bucket (if it doesn't exist)
-- Note: You may need to create this manually in the Supabase dashboard
-- Go to Storage → Create bucket → Name: "journals" → Private

-- Storage policies for journals bucket
-- Run these after creating the "journals" bucket in the dashboard

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own journal files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'journals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own journal files
CREATE POLICY "Users can view own journal files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own journal files
CREATE POLICY "Users can update own journal files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'journals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own journal files
CREATE POLICY "Users can delete own journal files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'journals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );