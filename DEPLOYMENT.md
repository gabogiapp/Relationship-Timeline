# Deployment Guide

## 🚀 Deploy to Render (Recommended)

### Prerequisites
1. [GitHub account](https://github.com)
2. [Render account](https://render.com) (free)
3. [Supabase account](https://supabase.com) (optional, works in demo mode)

### Step 1: Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `timeline-app` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)
5. Click "Create Web Service"

### Step 3: Configure Environment Variables (Optional)
If you want to use Supabase instead of demo mode:

1. In your Render dashboard, go to your service
2. Click "Environment" tab
3. Add these variables:
   ```
   NODE_ENV=production
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. The service will automatically redeploy

### Step 4: Update Supabase Settings
If using Supabase:
1. Go to your Supabase dashboard
2. Navigate to Authentication → Settings
3. Add your Render domain to "Site URL" and "Redirect URLs":
   - Site URL: `https://your-app.onrender.com`
   - Redirect URLs: `https://your-app.onrender.com/**`

## 🌐 Alternative: Deploy to Netlify

### Step 1: Build Settings
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Connect your GitHub repository
4. Set build settings:
   - Build command: `npm run install-client && npm run build`
   - Publish directory: `client/build`

### Step 2: Environment Variables
Add the same environment variables as above in Netlify's site settings.

## 🚂 Alternative: Deploy to Railway

### Step 1: Connect Repository
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your repository

### Step 2: Configure
Railway will automatically detect your Node.js app and deploy both frontend and backend.

## ⚡ Alternative: Deploy to Vercel

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect and deploy

## 📱 Demo Mode vs Production

### Demo Mode (No Setup Required)
- Works immediately after deployment
- Uses sample data
- No real authentication
- Perfect for showcasing the app

### Production Mode (Supabase Required)
- Real user authentication
- Persistent data storage
- File uploads to cloud storage
- Multi-user support

## 🔧 Troubleshooting

### Common Issues

1. **Build fails**: Make sure all dependencies are in `package.json`
2. **Environment variables not working**: Restart the deployment after adding them
3. **Supabase connection fails**: Check your URL and anon key
4. **CORS errors**: Add your domain to Supabase settings

### Debug Steps
1. Check deployment logs in your platform's dashboard
2. Test locally first: `npm run build && npm start`
3. Verify environment variables are set correctly

## 🎉 You're Live!

Once deployed, your timeline app will be accessible at:
- Render: `https://your-app.onrender.com`
- Netlify: `https://your-app.netlify.app`  
- Railway: `https://your-app.railway.app`
- Vercel: `https://your-app.vercel.app`

The app works perfectly in demo mode, so users can start using it immediately!