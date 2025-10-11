# 🚀 Supabase Setup Guide

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com
2. Click **"Start your project"** (or **"New Project"** if you have an account)
3. Sign up with GitHub or Email
4. Click **"New project"**
5. Fill in:
   - **Name**: `ai-task-master`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
6. Click **"Create new project"** (takes ~2 minutes to set up)

## Step 2: Run the SQL Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"+ New query"**
3. Copy the entire contents of `backend/supabase-schema.sql`
4. Paste into the SQL editor
5. Click **"RUN"** (bottom right)
6. You should see: ✅ **Success. No rows returned**

## Step 3: Get Your API Keys

1. Click **"Settings"** (⚙️ icon in sidebar)
2. Click **"API"** under Project Settings
3. You'll see two important values:

   **Project URL** (looks like):
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key** (long string starting with `eyJ...`):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Update Backend .env File

Open `backend/.env` and update these lines:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
```

## Step 5: Restart the Backend

1. Stop the backend (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

You should see:
```
✅ Supabase initialized successfully
🚀 AI TASK MASTER SERVER STARTED 🚀
```

## Step 6: Test It!

1. Go to http://localhost:3000
2. Click **"Register"**
3. Create a new account
4. You're in! 🎉

## Verify Database

In Supabase dashboard:
1. Click **"Table Editor"**
2. Click **"users"** table
3. You should see your newly created user!

---

## Troubleshooting

**Problem**: "Database not configured" error
- Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
- Restart the backend server

**Problem**: SQL errors when running schema
- Make sure you're in the SQL Editor
- Copy the ENTIRE schema file
- Try running it again

**Problem**: Can't create account
- Check browser console for errors
- Verify backend is running on port 5000
- Check Supabase dashboard for any errors

---

## 🎯 What's Next?

Once connected, you can:
- ✅ Create and manage tasks
- ✅ Use AI to extract tasks from text
- ✅ Generate daily plans
- ✅ Get productivity analytics
- ✅ All data is securely stored in Supabase!

Enjoy your AI Task Master! 🚀
