# Final Outlook Calendar Setup Checklist

## ✅ What You Have:

- **Azure App Registration Created**
  - Client ID: `eb85eada-4442-446b-8df7-0a8316e49532`
  - Client Secret: `1a929af0-c389-40dc-90d9-4876cb169efb`
  - Redirect URIs configured in Azure Portal

- **All Code Deployed**
  - Backend with calendar routes ✅
  - Frontend with callback handler ✅
  - Error logging improvements ✅

---

## 🔧 Step 1: Add Railway Environment Variables

**Go to:** Railway Dashboard → Your Project → Backend Service → Variables Tab

**Click "Raw Editor" and add these three variables:**

```bash
OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
OUTLOOK_CLIENT_SECRET=1a929af0-c389-40dc-90d9-4876cb169efb
OUTLOOK_REDIRECT_URI=https://aiwork-sooty.vercel.app/auth/outlook/callback
```

**After adding:**
- Click **"Update Variables"**
- Railway will automatically redeploy (takes ~2-3 minutes)
- ✅ Backend will now have Outlook credentials

---

## 🔧 Step 2: Add Vercel Environment Variable

**Go to:** Vercel Dashboard → aiwork-sooty → Settings → Environment Variables

**Add this variable:**

```bash
Name: REACT_APP_OUTLOOK_CLIENT_ID
Value: eb85eada-4442-446b-8df7-0a8316e49532
Environments: ✅ Production ✅ Preview ✅ Development
```

**After adding:**
- Click **"Save"**
- Go to **Deployments** tab
- Click the menu (•••) on latest deployment
- Click **"Redeploy"**
- ✅ Frontend will have client ID

---

## 🔧 Step 3: Run Supabase Migration

**Go to:** https://supabase.com/dashboard/project/edyofpcdmgonqxczmbql

**Steps:**
1. Click **"SQL Editor"** in left sidebar
2. Click **"New query"** button
3. Copy and paste this SQL:

```sql
-- Add Outlook Calendar fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS outlook_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outlook_email TEXT,
ADD COLUMN IF NOT EXISTS outlook_access_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outlook_last_synced_at TIMESTAMPTZ;

-- Add Outlook sync fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS outlook_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_outlook BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_outlook_event_id ON tasks(outlook_event_id);
CREATE INDEX IF NOT EXISTS idx_users_outlook_connected ON users(outlook_connected);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE 'outlook%';
```

4. Click **"Run"** button (or press F5)
5. Should see "Success" message
6. ✅ Database now has Outlook calendar columns

---

## 🧪 Step 4: Test the Integration

**Wait for deployments to finish:**
- Railway: Check dashboard for "Deployed" status (~2-3 min)
- Vercel: Check dashboard for "Ready" status (~2-3 min)

**Then test:**

1. **Go to:** https://aiwork-sooty.vercel.app/calendar

2. **Click:** "Connect Outlook Calendar" button

3. **You should:**
   - Redirect to Microsoft login page ✅
   - Sign in with your Microsoft account ✅
   - See permission request (Calendars.ReadWrite, User.Read) ✅
   - Click "Accept" ✅
   - Redirect to callback page showing "Connecting..." ✅
   - See "Success! Connected to [your-email]" ✅
   - Auto-redirect back to Calendar Settings ✅
   - See "Connected as [your-email]" with green checkmark ✅

4. **If successful, you can now:**
   - Create tasks and sync them to Outlook calendar
   - View your Outlook events
   - Import Outlook events as tasks
   - Enable auto-sync options

---

## 🐛 Troubleshooting

### Error: "Failed to exchange code for access token"

**Check Railway Logs:**
1. Go to Railway → Your Service → Logs
2. Look for line: `Outlook Config: { clientId: ..., clientSecret: ..., redirectUri: ... }`
3. Should show:
   - `clientId: 'SET'` ✅
   - `clientSecret: 'SET'` ✅
   - `redirectUri: 'https://aiwork-sooty.vercel.app/auth/outlook/callback'` ✅

**If any show 'MISSING':**
- Go back to Step 1 and add Railway variables
- Make sure to click "Update Variables"
- Wait for redeploy

### Error: "Redirect URI mismatch"

**Fix in Azure Portal:**
1. Go to Azure Portal → App Registrations
2. Find "Aurora Tasks Calendar Sync"
3. Go to **Authentication** → **Platform configurations** → **Web**
4. Verify redirect URI is EXACTLY: `https://aiwork-sooty.vercel.app/auth/outlook/callback`
5. No trailing slash, correct protocol (https://)

### Error: Database column doesn't exist

**Run Supabase migration from Step 3**

### Connection works but doesn't persist

**Check if Supabase migration was successful:**
```sql
-- Run this in Supabase SQL Editor to verify
SELECT outlook_connected, outlook_email
FROM users
WHERE id = 'your-user-id';
```

---

## 📊 Success Criteria

You'll know everything is working when:

- ✅ Clicking "Connect" redirects to Microsoft (not just reloading)
- ✅ After signing in, see success message with your email
- ✅ Connection persists after page refresh
- ✅ Can create tasks and sync them to Outlook
- ✅ Calendar events appear in Outlook within seconds
- ✅ No errors in browser console
- ✅ Railway logs show all env vars as 'SET'

---

## 🎯 Current Status

**Completed:**
- ✅ Azure App Registration created
- ✅ Client ID and Secret generated
- ✅ Backend code deployed with calendar routes
- ✅ Frontend code deployed with callback handler
- ✅ Error logging improvements

**Needs to be done:**
- ⬜ Add Railway environment variables (Step 1)
- ⬜ Add Vercel environment variable (Step 2)
- ⬜ Run Supabase migration (Step 3)
- ⬜ Test the integration (Step 4)

---

## 📝 Important Notes

- **Client Secret Security**: Never commit the client secret to Git. It's only in Railway environment variables.
- **Token Storage**: Access tokens are stored encrypted in Supabase, never in localStorage
- **Token Expiration**: Access tokens expire after 1 hour but refresh automatically
- **Refresh Tokens**: Valid for 90 days, stored securely in database
- **Testing**: Use your own Microsoft account for testing
- **Production Ready**: This setup is production-ready once all steps are complete

---

## 🚀 Next Steps After Setup

Once the integration is working:

1. **Test Task Sync**:
   - Create a task with a due date
   - Sync it to Outlook
   - Check your Outlook calendar

2. **Test Event Import**:
   - Create an event in Outlook
   - Import it as a task
   - Verify it appears in your task list

3. **Enable Auto-Sync**:
   - Go to Calendar Settings
   - Check the auto-sync options
   - New tasks will automatically sync to Outlook

4. **Monitor Performance**:
   - Check Railway logs for any errors
   - Verify sync happens within seconds
   - Test with multiple tasks

---

## 📞 Support

If you encounter issues:
1. Check Railway logs for error details
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure Supabase migration completed successfully
5. Check Azure Portal for app registration issues

The improved error messages will now show specific Microsoft errors, making troubleshooting easier!
