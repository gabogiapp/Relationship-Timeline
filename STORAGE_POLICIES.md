# Supabase Storage Policies for Timeline App

## Storage Bucket Setup

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Create a bucket named `timeline-media` if it doesn't exist
4. Set it to **Public** (this makes it easier to access files)

## Storage Policies

Run these SQL commands in your Supabase SQL editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'timeline-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow public access to view files (since bucket is public)
CREATE POLICY "Public access to media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'timeline-media');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'timeline-media' AND 
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'timeline-media' AND 
    auth.role() = 'authenticated'
  );
```

## Alternative: More Restrictive Policies

If you want more security, use these policies instead:

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

## Troubleshooting

If you're still getting 400 errors:

1. **Check bucket exists**: Make sure the `timeline-media` bucket exists in your Supabase dashboard
2. **Check bucket is public**: Set the bucket to public for easier access
3. **Check policies**: Run the SQL policies above
4. **Check authentication**: Make sure you're logged in when uploading
5. **Check file size**: Files must be under 50MB (Supabase default limit)

## Test the Setup

After applying the policies:

1. Go to your app and log in
2. Try uploading a small image file
3. Check the browser console for any errors
4. If successful, you should see the file in your Supabase storage dashboard 