# Journals Setup Guide

This guide will help you set up the journals functionality for your timeline app.

## 1. Database Setup

### Create the Journals Table

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `JOURNALS_SETUP.sql`
4. Click **Run** to execute the SQL

This will create:
- A `journals` table to store journal metadata
- Row Level Security policies for user data protection
- Database indexes for better performance

## 2. Storage Setup

### Create the Journals Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it `journals`
4. Make it **Private** (not public)
5. Click **Create bucket**

### Set Up Storage Policies

The storage policies are already included in the `JOURNALS_SETUP.sql` file, but make sure they're applied:

1. Go to **Storage** → **Policies** in your Supabase dashboard
2. Verify that the following policies exist for the `journals` bucket:
   - "Users can upload own journal files"
   - "Users can view own journal files"
   - "Users can update own journal files"
   - "Users can delete own journal files"

## 3. Features

The journals functionality includes:

### Upload Capabilities
- **Supported file types**: TXT, PDF, DOC, DOCX
- **File size limit**: 5MB per file
- **Secure storage**: Files are stored in user-specific folders
- **Automatic metadata**: File size, type, and upload date are tracked

### Management Features
- **View all journals**: See a list of all uploaded journals
- **Download journals**: Download files to your local device
- **Delete journals**: Remove journals from storage and database
- **File information**: View file size, type, and upload date

### User Experience
- **Hamburger menu**: Easy navigation between Timeline and Journal pages
- **Responsive design**: Works on desktop and mobile devices
- **Loading states**: Visual feedback during uploads and operations
- **Error handling**: Clear error messages for failed operations
- **Success notifications**: Toast notifications for successful operations

## 4. Usage

### Navigation
- Click the hamburger menu (☰) in the top-left corner
- Select "Journal" to go to the journals page
- Select "Timeline" to return to the main timeline

### Uploading Journals
1. Click the "Upload Journal" button
2. Select a file (TXT, PDF, DOC, or DOCX)
3. Wait for the upload to complete
4. The journal will appear in your list

### Managing Journals
- **Download**: Click the download icon (⬇️) next to any journal
- **Delete**: Click the trash icon (🗑️) to remove a journal
- **View details**: See file information like size, type, and upload date

## 5. Security

The journals system includes several security features:

- **User isolation**: Users can only access their own journals
- **Row Level Security**: Database-level protection against unauthorized access
- **Storage policies**: File-level security in Supabase storage
- **File validation**: Server-side validation of file types and sizes
- **Secure URLs**: Files are served through secure Supabase URLs

## 6. Troubleshooting

### Common Issues

**"Failed to upload journal"**
- Check your internet connection
- Verify the file is under 5MB
- Ensure the file type is supported (TXT, PDF, DOC, DOCX)
- Check that the `journals` storage bucket exists

**"Failed to load journals"**
- Verify you're logged in
- Check that the `journals` table exists in your database
- Ensure RLS policies are properly configured

**"Failed to delete journal"**
- Check your internet connection
- Verify you have permission to delete the file
- Check that storage policies are configured correctly

### Database Verification

To verify your setup, run this query in the SQL Editor:

```sql
-- Check if journals table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'journals'
);

-- Check if storage bucket exists
SELECT name FROM storage.buckets WHERE name = 'journals';
```

## 7. Next Steps

After completing the setup:
1. Test uploading a journal file
2. Test downloading a journal file
3. Test deleting a journal file
4. Verify the hamburger menu navigation works
5. Test on different devices and screen sizes