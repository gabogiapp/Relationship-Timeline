# 🔧 Media Upload System Fix

This document explains the issues found and how to fix them.

## 🐛 Issues Found

### 1. **Database Schema Mismatch (CRITICAL)**
- **Problem**: Timeline.js was trying to insert `user_id` into `media_files` table
- **Cause**: The `media_files` table doesn't have a `user_id` column
- **Symptoms**: SQL errors when saving images, memories created without images

### 2. **Inconsistent RLS Policies** 
- **Problem**: RLS policies were overly complex and potentially conflicting
- **Cause**: Multiple policy files with different approaches
- **Symptoms**: Permission denied errors, inconsistent access

### 3. **Storage Bucket Configuration**
- **Problem**: Storage bucket might not exist or have wrong policies
- **Cause**: Missing initial setup
- **Symptoms**: File upload failures, storage errors

## ✅ Solutions Applied

### 1. **Fixed Timeline.js**
```javascript
// OLD (BROKEN):
const mediaInserts = files.map(file => ({
  event_id: newEvent.id,
  user_id: user.id,  // ❌ This column doesn't exist!
  file_name: file.originalName || file.name || 'uploaded_file',
  // ...
}));

// NEW (FIXED):
const mediaInserts = files.map(file => ({
  event_id: newEvent.id,  // ✅ Only valid columns
  file_name: file.originalName || file.name || 'uploaded_file',
  // ...
}));
```

### 2. **Created Comprehensive SQL Fix**
- Clean table recreation
- Proper RLS policies
- Storage bucket setup
- Helper functions

### 3. **Added Testing & Diagnostics**
- Test script to verify functionality
- Diagnostic tools to identify issues

## 🚀 How to Apply the Fix

### Step 1: Apply Database Changes
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the `complete_media_system_fix.sql` script

### Step 2: Restart Your App
```bash
# In your project directory
npm run dev
```

### Step 3: Test the Fix
1. Open your app in browser
2. Log in as a user
3. Try creating a memory with an image
4. Check browser console for any errors

### Step 4: Verify with Test Script (Optional)
1. Open browser dev tools
2. Paste the `test_media_upload.js` contents
3. Run `testMediaUpload()` in console

## 🔍 How to Verify It's Working

### ✅ Success Signs:
- Images upload without errors
- Console shows "Media files saved successfully"
- Images appear in your memories
- No SQL errors in browser console

### ❌ Still Having Issues? Check:
1. **Supabase Connection**: Check your `.env` file has correct URLs
2. **Authentication**: Make sure you're logged in
3. **Browser Console**: Look for specific error messages
4. **Network Tab**: Check if uploads are reaching Supabase
5. **Storage Bucket**: Verify it exists in Supabase dashboard

## 🆘 Troubleshooting Common Issues

### "Bucket not found" Error
```sql
-- Run in Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('timeline-media', 'timeline-media', true)
ON CONFLICT (id) DO NOTHING;
```

### "Permission denied" Errors  
- Make sure you're logged in
- Check RLS policies were applied correctly
- Verify user owns the timeline they're adding to

### Files Upload but Don't Save to Database
- Check browser console for SQL errors
- Verify `media_files` table structure is correct
- Make sure timeline event was created first

### Images Don't Display
- Check if file URLs are accessible
- Verify storage bucket is public
- Check image file types are supported

## 📋 Database Schema Reference

### `media_files` table:
```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Points:
- ✅ `event_id` links to timeline events
- ❌ No `user_id` column (this was the bug!)
- ✅ `file_url` stores the Supabase storage URL
- ✅ Proper timestamps and constraints

## 📞 Need More Help?

If you're still having issues after applying these fixes:

1. **Check the exact error message** in browser console
2. **Verify each step** was completed correctly
3. **Test with a simple image** (small JPEG/PNG)
4. **Check Supabase dashboard** for any errors in logs

The most common remaining issue is usually authentication or RLS policy problems, which the test script will help identify.