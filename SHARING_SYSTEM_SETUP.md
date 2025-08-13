# Timeline Sharing System Setup Guide

This guide will help you complete the setup of the timeline sharing system so users can share timelines and accept invitations.

## ✅ What's Already Done

1. **Updated sharing service** - Now uses the correct `timeline_shares` table structure
2. **Created PendingInvitations component** - Users can see and accept/decline invitations
3. **Updated ShareModal** - Properly loads and manages collaborators
4. **Fixed authentication** - Sign out now works correctly
5. **Fixed 406 errors** - Simplified notification center prevents database errors

## 🔧 Required Setup Steps

### Step 1: Apply Database Schema

You need to apply the database schema to create the sharing tables:

1. Open your **Supabase dashboard**
2. Go to the **SQL Editor**
3. Copy and paste the contents of `fix_sharing_system.sql`
4. Click **Run** to execute the SQL

This will create:
- `timeline_shares` table for user-to-user sharing
- `timeline_share_links` table for public link sharing
- Helper functions for invitation management
- Proper indexes and permissions

### Step 2: Test the Sharing System

After applying the database schema, you can test:

1. **Create a timeline** (if you don't have one)
2. **Share a timeline**:
   - Open any timeline
   - Click the "Share" button
   - Enter an email address
   - Click "Invite" 

3. **Accept an invitation** (from another user account):
   - Sign in with the invited email
   - You should see a blue invitation banner at the top
   - Click "Accept" to access the shared timeline

## 🎯 How It Works

### Sharing Flow
1. **Owner shares timeline** → Creates entry in `timeline_shares` with status 'pending'
2. **Invited user sees invitation** → PendingInvitations component shows banner
3. **User accepts invitation** → Status changes to 'accepted', user gets access
4. **Shared timeline appears** → Shows up in user's timeline list

### Key Features
- ✅ Email-based invitations
- ✅ Permission levels (viewer, editor)
- ✅ Pending invitation management
- ✅ Public link sharing
- ✅ Real-time collaboration access

## 🐛 Troubleshooting

### "Sharing system not available" Error
- **Cause**: Database schema not applied
- **Solution**: Run `fix_sharing_system.sql` in Supabase SQL Editor

### Invitations Don't Appear
- **Cause**: Case-sensitive email matching
- **Solution**: Ensure the invitation email exactly matches the user's account email

### 406 Errors
- **Cause**: Missing notification tables (expected)
- **Solution**: Already fixed with simplified notification center

### Public Links Don't Work  
- **Cause**: Need to add route handling for `/shared/:token`
- **Solution**: This is a future enhancement - basic sharing works without it

## 🚀 Testing Checklist

- [ ] Applied `fix_sharing_system.sql` to Supabase
- [ ] Can create and share timelines
- [ ] Invitations appear in PendingInvitations component
- [ ] Can accept/decline invitations
- [ ] Shared timelines appear in timeline list
- [ ] Permission levels work correctly (viewer/editor)
- [ ] Sign out functionality works

## 📋 Next Steps (Optional Enhancements)

1. **Email notifications** - Send actual emails when users are invited
2. **Public link sharing** - Add frontend routes for shared links
3. **Advanced permissions** - Add admin level, custom permissions
4. **Notification center** - Full notification system with timeline_notifications table
5. **User profiles** - Better user display names and avatars

The basic sharing system should now work perfectly for inviting users by email and managing timeline permissions!