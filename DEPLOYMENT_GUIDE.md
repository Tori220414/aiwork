# 🚀 AI Task Master - Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- Vercel account (sign up at vercel.com)
- Your Supabase credentials
- Your Gemini API key

---

## Step 1: Push to GitHub (5 minutes)

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-task-master.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway (5 minutes)

### 2.1 Create Railway Project
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your `ai-task-master` repository
5. Click **"Add variables"**

### 2.2 Add Environment Variables
In Railway, add these variables:

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET=<generate-a-random-secret-string>
NODE_ENV=production
PORT=5000
CORS_ORIGIN=*
```

**Where to find your keys:**
- Supabase URL & Key: Supabase Dashboard → Settings → API
- Gemini API Key: https://makersuite.google.com/app/apikey
- JWT_SECRET: Generate with `openssl rand -base64 32`

### 2.3 Configure Build
1. Click **"Settings"** tab
2. Set **Root Directory**: `backend`
3. Set **Start Command**: `npm start`
4. Click **"Deploy"**

### 2.4 Get Your Backend URL
- Once deployed, Railway will give you a URL like:
  `https://your-app.railway.app`
- **Copy this URL** - you'll need it for frontend!

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Update Frontend Environment
1. Open `frontend/.env.production`
2. Replace with your Railway backend URL:
   ```
   REACT_APP_API_URL=https://your-app.railway.app
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update production API URL"
   git push
   ```

### 3.2 Deploy to Vercel
1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add Environment Variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-app.railway.app`
6. Click **"Deploy"**

### 3.3 Get Your Frontend URL
- Vercel will give you a URL like:
  `https://your-app.vercel.app`

---

## Step 4: Update CORS (2 minutes)

### 4.1 Update Railway Environment Variable
1. Go back to Railway dashboard
2. Click **"Variables"**
3. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
4. Railway will automatically redeploy

---

## Step 5: Test Your Deployment (2 minutes)

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to register a new account
3. Login
4. Create a task
5. Test the calendar
6. Try AI features

---

## 🎉 You're Live!

Your app is now deployed and accessible worldwide!

### Your URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app
- **Database**: Supabase (already deployed)

---

## Optional: Custom Domain

### For Vercel (Frontend):
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS instructions

### For Railway (Backend):
1. Railway Dashboard → Settings → Domains
2. Add custom domain
3. Update CORS_ORIGIN in environment variables

---

## Monitoring & Logs

### Backend Logs (Railway):
- Railway Dashboard → Your Project → Deployments → View Logs

### Frontend Logs (Vercel):
- Vercel Dashboard → Your Project → Logs

### Database (Supabase):
- Supabase Dashboard → Logs

---

## Troubleshooting

### Frontend can't connect to backend:
- Check `REACT_APP_API_URL` in Vercel env vars
- Check CORS_ORIGIN in Railway matches your Vercel URL
- Redeploy both if needed

### Backend errors:
- Check Railway logs
- Verify all environment variables are set
- Check Supabase connection

### Database issues:
- Verify Supabase is not paused (free tier)
- Check Row Level Security policies
- Verify tables exist

---

## Cost Breakdown

- **Vercel (Frontend)**: FREE ✅
- **Railway (Backend)**: $5/month (FREE first month with credits)
- **Supabase (Database)**: FREE ✅
- **Gemini AI**: FREE ✅

**Total: ~$5/month** 🎉

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

---

## 🚀 Happy Deploying!
