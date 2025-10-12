# Quick Setup Verification

## Your Credentials Summary:
- ✅ **Client ID:** `eb85eada-4442-446b-8df7-0a8316e49532`
- ✅ **Client Secret:** `1a929af0-c389-40dc-90d9-4876cb169efb`
- ✅ **Callback URL:** `https://aiwork-sooty.vercel.app/auth/outlook/callback`

---

## Railway Environment Variables - Copy/Paste This:

```
OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
OUTLOOK_CLIENT_SECRET=1a929af0-c389-40dc-90d9-4876cb169efb
OUTLOOK_REDIRECT_URI=https://aiwork-sooty.vercel.app/auth/outlook/callback
```

**How to add:**
1. Go to: https://railway.app/
2. Click your project
3. Click backend service
4. Click **"Variables"** tab
5. Click **"Raw Editor"** button
6. Paste the 3 lines above
7. Click **"Update Variables"**
8. Wait ~2 minutes for redeploy

---

## Vercel Environment Variable - Add This:

```
Name: REACT_APP_OUTLOOK_CLIENT_ID
Value: eb85eada-4442-446b-8df7-0a8316e49532
```

**How to add:**
1. Go to: https://vercel.com/dashboard
2. Click **"aiwork-sooty"** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter name and value above
6. Select: ✅ Production ✅ Preview ✅ Development
7. Click **"Save"**
8. Go to **Deployments** tab → Latest deployment → Menu (•••) → **"Redeploy"**

---

## Supabase Migration - Run This SQL:

**Go to:** https://supabase.com/dashboard/project/edyofpcdmgonqxczmbql/editor

```sql
-- Add Outlook columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS outlook_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outlook_email TEXT,
ADD COLUMN IF NOT EXISTS outlook_access_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outlook_last_synced_at TIMESTAMPTZ;

-- Add Outlook columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS outlook_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_outlook BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_outlook_event_id ON tasks(outlook_event_id);
CREATE INDEX IF NOT EXISTS idx_users_outlook_connected ON users(outlook_connected);

-- Verify it worked
SELECT 'Users table columns added!' as status
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'outlook_connected';
```

**Click "Run" (or press F5)**

You should see: "Users table columns added!"

---

## Test After Setup (Wait 5 minutes for deploys):

1. **Open:** https://aiwork-sooty.vercel.app/calendar
2. **Click:** "Connect Outlook Calendar" button
3. **Sign in** with your Microsoft account
4. **Accept** permissions
5. **Should see:** "Successfully connected to [your-email]"
6. **Should redirect** back to Calendar page
7. **Should show:** "Connected as [your-email]" with green checkmark ✅

---

## Quick Troubleshooting:

### Still getting 500 error?

**Check Railway logs:**
1. Railway Dashboard → Service → Logs
2. Look for: `Outlook Config: { clientId: 'SET', clientSecret: 'SET', redirectUri: '...' }`
3. If you see 'MISSING' - environment variables weren't added correctly

**Check Vercel:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify `REACT_APP_OUTLOOK_CLIENT_ID` exists
3. If not there, add it and redeploy

### Connection doesn't persist?

**Run this in Supabase SQL Editor to check:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name LIKE 'outlook%';
```

Should return 6 rows (outlook_connected, outlook_email, etc.)

---

## Expected Behavior After Setup:

✅ **Button Click** → Redirects to Microsoft login (not just reload)
✅ **Microsoft Login** → Shows permission request
✅ **Accept** → Shows "Connecting..." spinner
✅ **Success** → Shows "Successfully connected to [email]"
✅ **Auto-redirect** → Back to Calendar Settings in 2 seconds
✅ **Calendar Page** → Shows "Connected as [email]"
✅ **After Refresh** → Connection persists, still shows connected

---

## Azure Portal Verification:

**Verify redirect URI is correct:**
1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Find: "Aurora Tasks Calendar Sync" (Client ID: eb85eada-4442-446b-8df7-0a8316e49532)
3. Click **Authentication**
4. Under **Web** → **Redirect URIs**
5. Verify it has: `https://aiwork-sooty.vercel.app/auth/outlook/callback`
6. ✅ Should be EXACTLY this (no trailing slash)

**Verify API permissions:**
1. In same app registration
2. Click **API permissions**
3. Should see:
   - ✅ Microsoft Graph → Calendars.ReadWrite (Delegated)
   - ✅ Microsoft Graph → User.Read (Delegated)
4. Status should show: ✅ Granted for [your directory]

---

## All Set?

Once you've completed the 3 steps above:
1. ✅ Railway variables added + redeployed
2. ✅ Vercel variable added + redeployed
3. ✅ Supabase migration executed

The integration will work! Test it at:
**https://aiwork-sooty.vercel.app/calendar**

The improved logging will help diagnose any remaining issues.
