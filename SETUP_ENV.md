# Environment Setup Guide

## Step 1: Create Environment File

Create a `.env` file in the `client` directory with the following content:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Development server proxy
REACT_APP_API_URL=http://localhost:5001
```

## Step 2: Get Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the placeholder values in your `.env` file

## Step 3: Test Your Setup

After creating the `.env` file and adding your credentials:

1. Restart your React app: `cd client && npm start`
2. Open the browser console
3. Run: `testSupabaseSetup()`

This will test if your Supabase connection is working properly.

## Available Test Functions

Once the app is loaded, you can use these functions in the browser console:

- `testSupabase()` - Test basic connection
- `testAuthFlow(email, password)` - Test authentication
- `testDatabaseOperations()` - Test database operations
- `runAllTests()` - Run all tests
- `testSupabaseSetup()` - Quick setup test

## Troubleshooting

- **"Supabase is not configured"**: Check your `.env` file and restart the app
- **Connection errors**: Verify your URL and anon key are correct
- **Database errors**: Make sure you've set up the database tables in Supabase 