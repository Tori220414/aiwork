# Outlook Calendar Integration - Testing Guide

## Pre-Deployment Checklist

Before testing, ensure you've completed these steps:

### ✅ Supabase Migration
- [ ] Logged into Supabase Dashboard: https://supabase.com/dashboard/project/edyofpcdmgonqxczmbql
- [ ] Opened SQL Editor
- [ ] Ran the migration from `add-outlook-calendar-fields.sql`
- [ ] Verified columns were added to `users` and `tasks` tables

### ✅ Railway Environment Variables
Go to Railway dashboard and verify these variables are set:
- [ ] `OUTLOOK_CLIENT_ID` = `eb85eada-4442-446b-8df7-0a8316e49532`
- [ ] `OUTLOOK_CLIENT_SECRET` = `1a929af0-c389-40dc-90d9-4876cb169efb`
- [ ] `OUTLOOK_REDIRECT_URI` = `https://aiwork-sooty.vercel.app/auth/outlook/callback`

### ✅ Vercel Environment Variables
Go to Vercel project settings and verify:
- [ ] `REACT_APP_OUTLOOK_CLIENT_ID` = `eb85eada-4442-446b-8df7-0a8316e49532`
- [ ] Variable is set for all environments (Production, Preview, Development)

### ✅ Azure App Registration
Verify in Azure Portal:
- [ ] Both redirect URIs are added:
  - `https://aiwork-sooty.vercel.app/auth/outlook/callback`
  - `http://localhost:3000/auth/outlook/callback`
- [ ] API Permissions granted:
  - `Calendars.ReadWrite`
  - `User.Read`
- [ ] Admin consent granted (if applicable)

---

## Testing Procedure

### 1. Test Calendar Connection

**Production:**
1. Go to: https://aiwork-sooty.vercel.app/calendar
2. Should see Calendar Integration page
3. Click **"Connect Outlook Calendar"**
4. Should redirect to Microsoft login
5. Sign in with your Microsoft account
6. Grant permissions when prompted
7. Should redirect back to your app
8. Should see: "Connected as [your-email@outlook.com]"

**Expected Result:**
✅ Green success message showing your connected email
✅ "Disconnect" and "Refresh" buttons visible
✅ Sync options checkboxes appear

**If Error:**
- Check browser console for errors
- Verify redirect URI matches exactly in Azure Portal
- Ensure environment variables are set in Vercel

### 2. Test Task Sync to Outlook

1. Go to Tasks page: https://aiwork-sooty.vercel.app/tasks
2. Create a new task with:
   - Title: "Test Outlook Sync"
   - Due date: Tomorrow at 2:00 PM
   - Category: Meeting
3. Click calendar icon or sync button on the task
4. Should see success message: "Task synced to Outlook calendar"
5. Open your Outlook calendar
6. Verify the event appears at the correct date/time

**Expected Result:**
✅ Event created in Outlook calendar
✅ Event title matches task title
✅ Event time matches task due date
✅ Event duration matches task estimated time

### 3. Test Event Import from Outlook

1. Create an event in your Outlook calendar:
   - Title: "Team Meeting"
   - Date: Next week
   - Time: 10:00 AM - 11:00 AM
2. Go to Calendar page in app
3. Click **"Import Events"** or refresh
4. Should see your Outlook events listed
5. Select events to import
6. Click **"Import as Tasks"**
7. Go to Tasks page
8. Verify "Team Meeting" appears as a task

**Expected Result:**
✅ Outlook events visible in the app
✅ Can select and import events
✅ Imported events create tasks with correct details

### 4. Test Disconnect

1. Go to Calendar page
2. Click **"Disconnect"** button
3. Confirm disconnection
4. Should see: "Outlook calendar disconnected successfully"
5. Status should change to "Not Connected"
6. Connect button should appear again

**Expected Result:**
✅ Successfully disconnected
✅ UI updates to show disconnected state
✅ Can reconnect if needed

---

## Troubleshooting

### Error: "Outlook integration not configured"
**Solution:**
- Check that `REACT_APP_OUTLOOK_CLIENT_ID` is set in Vercel
- Redeploy the frontend if you just added the variable

### Error: "AADSTS50011: Redirect URI mismatch"
**Solution:**
- Go to Azure Portal → Your App → Authentication
- Verify redirect URI exactly matches: `https://aiwork-sooty.vercel.app/auth/outlook/callback`
- No trailing slash, correct protocol (https)

### Error: "Failed to connect Outlook calendar"
**Solution:**
- Check Railway logs for backend errors
- Verify `OUTLOOK_CLIENT_SECRET` is correct in Railway
- Ensure backend has deployed successfully

### Error: "Token expired" or "Refresh token not available"
**Solution:**
- This happens if tokens expire
- Disconnect and reconnect Outlook calendar
- Token refresh should happen automatically in the future

### Events not appearing in Outlook
**Solution:**
- Check that task has a due date set
- Verify Outlook calendar connection is active
- Check Outlook calendar permissions (Calendars.ReadWrite)
- Look at browser network tab for API errors

### Tasks not importing from Outlook
**Solution:**
- Ensure events have future dates (past events may be filtered)
- Check that calendar connection is active
- Verify API permissions are granted

---

## API Endpoints Reference

All endpoints require authentication (Bearer token in Authorization header):

### Connection
- `POST /api/calendar/outlook/connect` - Exchange OAuth code for tokens
- `GET /api/calendar/outlook/status` - Get connection status
- `POST /api/calendar/outlook/disconnect` - Disconnect calendar

### Events
- `POST /api/calendar/outlook/sync-task/:taskId` - Sync task to Outlook
- `POST /api/calendar/outlook/events` - Create event
- `GET /api/calendar/outlook/events` - Get events
- `POST /api/calendar/outlook/import` - Import events as tasks

---

## Database Verification

After setup, verify in Supabase SQL Editor:

```sql
-- Check if columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE 'outlook%';

-- Check user's Outlook connection
SELECT id, email, outlook_connected, outlook_email, outlook_last_synced_at
FROM users
WHERE outlook_connected = true;

-- Check synced tasks
SELECT id, title, due_date, outlook_event_id, synced_to_outlook
FROM tasks
WHERE synced_to_outlook = true;
```

---

## Success Criteria

The integration is working correctly if:
- ✅ Can connect Outlook calendar without errors
- ✅ Connected status persists after page refresh
- ✅ Can sync tasks to Outlook calendar
- ✅ Events appear in Outlook within 30 seconds
- ✅ Can view Outlook events in the app
- ✅ Can import Outlook events as tasks
- ✅ Can disconnect and reconnect
- ✅ Token refresh happens automatically
- ✅ No console errors during normal operation

---

## Notes

- First connection requires Microsoft login and permission grant
- Access tokens expire after 1 hour but refresh automatically
- Refresh tokens are valid for 90 days
- All tokens are stored securely in Supabase (not in localStorage)
- Calendar sync is real-time (no delay/caching)
- Events are created in the user's default Outlook calendar

---

## Support

If you encounter issues not covered in this guide:
1. Check browser console for JavaScript errors
2. Check Railway logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Supabase migration was successful
5. Check Azure Portal for app registration issues
