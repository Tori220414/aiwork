# Calendar Integration Setup Guide

## Microsoft Outlook Calendar

### Prerequisites
- Microsoft Azure account
- Admin access to Azure Portal

### Step-by-Step Setup

#### 1. Create Azure App Registration

1. Go to [Azure Portal - App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **"New registration"**
3. Fill in the details:
   - **Name**: `Aurora Tasks Calendar Sync`
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - Type: `Web`
     - Production URI: `https://aiwork-sooty.vercel.app/auth/outlook/callback`
     - Local dev URI: `http://localhost:3000/auth/outlook/callback`
     - **Note**: Add BOTH redirect URIs in Azure Portal under Authentication → Platform configurations → Web

#### 2. Configure API Permissions

1. In your app registration, go to **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add these permissions:
   - `Calendars.ReadWrite` - Read and write user calendars
   - `User.Read` - Sign in and read user profile
6. Click **"Grant admin consent"** (if you have admin rights)

#### 3. Get Client ID

1. Go to **"Overview"** tab
2. Copy the **"Application (client) ID"**
3. This is your `OUTLOOK_CLIENT_ID`

#### 4. Configure Environment Variables

**Frontend (.env):**
```bash
REACT_APP_OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
```

**Backend (.env) - Local:**
```bash
OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
OUTLOOK_CLIENT_SECRET=your-client-secret-here
OUTLOOK_REDIRECT_URI=http://localhost:3000/auth/outlook/callback
```

**Backend (.env) - Production (Railway):**
```bash
OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
OUTLOOK_CLIENT_SECRET=your-client-secret-here
OUTLOOK_REDIRECT_URI=https://aiwork-sooty.vercel.app/auth/outlook/callback
```

**Vercel Environment Variables:**
Add this in your Vercel project settings → Environment Variables:
```bash
REACT_APP_OUTLOOK_CLIENT_ID=eb85eada-4442-446b-8df7-0a8316e49532
```

#### 5. Create Client Secret (Backend Only)

1. Go to **"Certificates & secrets"**
2. Click **"New client secret"**
3. Add description: `Aurora Tasks Backend`
4. Select expiration: `24 months` (recommended)
5. Copy the **Value** immediately (you won't be able to see it again!)
6. This is your `OUTLOOK_CLIENT_SECRET`

### Testing the Integration

1. Start your application
2. Go to **Calendar** page in the app
3. Click **"Connect Outlook Calendar"**
4. Sign in with your Microsoft account
5. Grant the requested permissions
6. You should be redirected back and see "Connected" status

### Troubleshooting

**Error: "AADSTS900144: The request body must contain the following parameter: 'client_id'"**
- Make sure `REACT_APP_OUTLOOK_CLIENT_ID` is set in your `.env` file
- Restart your development server after adding env variables

**Error: "Redirect URI mismatch"**
- Make sure the redirect URI in Azure matches exactly: `https://your-domain.com/auth/outlook/callback`
- Check for trailing slashes - they matter!

**Error: "Invalid client secret"**
- The client secret may have expired
- Create a new client secret in Azure Portal
- Update your backend `.env` file

### Features Available

Once connected, you can:
- ✅ Sync tasks to Outlook calendar as events
- ✅ Import Outlook events as tasks
- ✅ Auto-sync new tasks to calendar
- ✅ Two-way sync for updates
- ✅ Delete synced events when tasks are deleted

### Security Notes

- Never commit `.env` files to version control
- Client secrets should only be stored on the backend
- Rotate client secrets regularly (every 6-12 months)
- Use separate app registrations for dev/staging/production

---

## Google Calendar (Coming Soon)

Integration with Google Calendar will be available in a future update.

## Apple Calendar (Coming Soon)

Integration with Apple Calendar (iCloud) will be available in a future update.
