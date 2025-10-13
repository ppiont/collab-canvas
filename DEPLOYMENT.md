# Deployment Guide - CollabCanvas

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository linked
- This project pushed to your GitHub repo

## Step 1: Initial Setup on Railway

### Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `collab-canvas` repository
5. Railway will auto-detect the project

### Verify Build Configuration
Railway should automatically detect:
- **Builder:** Nixpacks
- **Build Command:** `bun install && bun run build` (from railway.json)
- **Start Command:** `bun run build/index.js` (from railway.json)

## Step 2: Environment Variables (To Be Added Later)

After completing Task 0.3 and 0.4, add these environment variables in Railway:

```bash
PUBLIC_SUPABASE_URL=<from-supabase-project>
PUBLIC_SUPABASE_ANON_KEY=<from-supabase-project>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-project>
PUBLIC_PARTYKIT_HOST=<from-partykit-deploy>
PUBLIC_APP_URL=<your-railway-url>
```

## Step 3: Deploy

### Automatic Deployment
Every push to `main` branch will trigger automatic deployment on Railway.

### Manual Deployment
1. Go to your Railway project dashboard
2. Click "Deploy" in the top right
3. Select your latest commit

## Step 4: Get Your Public URL

1. In Railway dashboard, go to Settings → Networking
2. Click "Generate Domain"
3. Your app will be available at: `https://your-app-name.up.railway.app`

## Testing Deployment

After deployment completes:
1. Visit your Railway URL
2. You should see the CollabCanvas landing page
3. Status should show "Deployed" in Railway dashboard

## Current Status (Task 0.1)

✅ Project configured for Railway  
✅ Build succeeds locally  
✅ railway.json configured  
⏳ Awaiting Supabase setup (Task 0.3)  
⏳ Awaiting PartyKit setup (Task 0.4)

## Next Steps

1. Complete Task 0.2: Install dependencies
2. Complete Task 0.3: Set up Supabase and add environment variables to Railway
3. Complete Task 0.4: Deploy PartyKit room
4. Test full deployment with all services connected

