# Builders & Contractors Workspace Setup Guide

## Overview
The Invoice Management and Whiteboard features are now available for workspaces that have "builder" or "contractor" in their name (case-insensitive).

## How to Enable the Features

### Option 1: Create from Template
1. Go to your Workspaces page
2. Look for the "Builders & Contractors" template
3. Click to create a workspace from that template
4. The workspace will automatically have the name "Builders & Contractors" which will enable the features

### Option 2: Rename Existing Workspace
1. Go to your workspace
2. Edit the workspace name to include either "builder" or "contractor"
3. Examples of valid names:
   - "Builders & Contractors"
   - "My Builder Projects"
   - "Contractor Management"
   - "Home Builder"
   - "Construction Contractor"

## Features Available

### Invoice Management Tab
- Create and manage invoices for clients
- Add line items with quantity, rate, and amount
- Automatic calculation of subtotal, tax, and total
- Invoice statuses: Draft, Sent, Paid, Overdue
- Edit and delete invoices
- Quick status updates

### Whiteboard Tab
- Canvas-based drawing tool with grid overlay
- Drawing tools: Pen, Eraser, Rectangle, Circle, Line
- Color picker with 8 preset colors + custom color selector
- Adjustable line width (1-20px)
- 20px grid overlay (toggle on/off)
- Download whiteboard as PNG image
- Clear canvas functionality
- Perfect for sketching floor plans and design layouts

## Database Setup Required

Before the invoice features will work, you need to run this SQL in your Supabase SQL Editor:

```sql
-- Run the contents of create-invoices-table.sql
```

This creates the `invoices` table with proper permissions and Row Level Security.

## Deployment

1. **Frontend**: Push changes to your Vercel repository
   - The build includes the new InvoiceManager and Whiteboard components
   - WorkspaceDetail page now checks workspace names for "builder" or "contractor"

2. **Backend**: Deploy to Railway
   - New invoice routes at `/api/workspaces/:workspaceId/invoices`
   - CRUD operations for invoice management

3. **Database**: Run migration in Supabase
   - Execute `create-invoices-table.sql` in SQL Editor

## Debugging

The WorkspaceDetail page now includes console logging to help debug:
- Check browser console for "Workspace data:" to see the full workspace object
- Check for "isBuilderWorkspace check:" to see if detection is working
- You should see a line under the workspace title showing "✓ Builder workspace features enabled" if detection is working

## Testing Workspace Name Detection

A test script is available at `test-workspace-names.js`:

```bash
node test-workspace-names.js
```

This shows which workspace names will enable the special features.

## Troubleshooting

**Q: The tabs aren't showing up**
- Check the workspace name includes "builder" or "contractor" (case-insensitive)
- Open browser console and look for the debug messages
- Verify the frontend has been deployed with the latest changes

**Q: Invoices aren't saving**
- Check that you've run the SQL migration (`create-invoices-table.sql`)
- Verify the backend is deployed with the new invoice routes
- Check browser network tab for API errors

**Q: Settings button redirects to dashboard**
- This has been fixed - the settings button has been removed since there's no settings page
- Instead, you'll see a status message showing if builder features are enabled
