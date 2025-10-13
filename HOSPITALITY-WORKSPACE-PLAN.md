# Hospitality Licensee Workspace - Implementation Plan

## Overview
Complete workspace management system for hospitality businesses (pubs, clubs, hotels, restaurants) with full compliance and operational management features.

## Components Created

### ✅ 1. Orders Component (`Orders.tsx`)
- Create and manage supplier orders
- Track order status (pending → ordered → delivered)
- Line items with quantity, unit type, and pricing
- GST calculations (10%)
- Delivery date tracking
- Supplier contact information

### ✅ 2. Stocktake Component (`Stocktake.tsx`)
- Full inventory stocktake management
- Expected vs actual quantity tracking
- Automatic variance calculations
- Variance value tracking ($ impact)
- Category organization (Beverage, Food, Liquor, Supplies)
- Export to CSV functionality
- Status workflow (draft → in_progress → completed)

## Components To Create

### 3. Rosters Component
**Purpose**: Staff scheduling and roster management

**Features**:
- Weekly/fortnightly roster views
- Staff member assignments
- Shift times and positions
- Cost calculations (hours × rate)
- Publish/unpublish rosters
- Export to PDF/print

### 4. Compliance Templates Component
**Purpose**: Regulatory compliance documentation

**Templates Include**:
- RSA (Responsible Service of Alcohol) incident reports
- Refusal of service logs
- Intoxication management records
- Minors attempted entry logs
- Security incident reports
- Cleaning and hygiene checklists
- Temperature logs (cool rooms/fridges)
- Opening/closing checklists

**Features**:
- Pre-built templates
- Custom template creation
- Fill-in forms with validation
- Digital signatures
- Export to PDF
- Historical record keeping

### 5. Gaming Register Component
**Purpose**: Gaming machine compliance tracking

**Features**:
- Daily gaming machine readings
- Turnover calculations
- Prize payout tracking
- Machine fault reporting
- Meter readings tracking
- Compliance reporting
- Monthly summaries

### 6. Daily Takings Sheet Component
**Purpose**: End-of-day financial reconciliation

**Features**:
- Cash register readings
- EFTPOS totals
- Cash counted
- Float verification
- Variance tracking
- Banking preparation
- Shift handover notes
- Department breakdowns (Bar, Gaming, Food, Accommodation)

## Database Tables Needed

```sql
-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  order_number TEXT,
  supplier TEXT,
  supplier_contact TEXT,
  order_date TIMESTAMP,
  delivery_date TIMESTAMP,
  items JSONB,
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'ordered', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stocktakes
CREATE TABLE stocktakes (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  stocktake_number TEXT,
  date TIMESTAMP,
  conducted_by TEXT,
  items JSONB,
  total_variance_value DECIMAL(10,2),
  status TEXT CHECK (status IN ('draft', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rosters
CREATE TABLE rosters (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  week_starting DATE,
  shifts JSONB,
  total_hours DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  status TEXT CHECK (status IN ('draft', 'published')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Records
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  template_type TEXT,
  date TIMESTAMP,
  completed_by TEXT,
  data JSONB,
  signature TEXT,
  status TEXT CHECK (status IN ('draft', 'completed', 'reviewed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gaming Register
CREATE TABLE gaming_entries (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  date DATE,
  machines JSONB,
  total_turnover DECIMAL(10,2),
  total_prizes DECIMAL(10,2),
  net_gaming DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Takings
CREATE TABLE daily_takings (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  date DATE,
  shift TEXT,
  departments JSONB,
  cash_counted DECIMAL(10,2),
  eftpos_total DECIMAL(10,2),
  total_takings DECIMAL(10,2),
  variance DECIMAL(10,2),
  banking_amount DECIMAL(10,2),
  notes TEXT,
  completed_by TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Backend API Routes Needed

```javascript
// Orders
GET    /api/workspaces/:id/orders
POST   /api/workspaces/:id/orders
PUT    /api/workspaces/:id/orders/:orderId
DELETE /api/workspaces/:id/orders/:orderId

// Stocktakes
GET    /api/workspaces/:id/stocktakes
POST   /api/workspaces/:id/stocktakes
PUT    /api/workspaces/:id/stocktakes/:stocktakeId
DELETE /api/workspaces/:id/stocktakes/:stocktakeId

// Rosters
GET    /api/workspaces/:id/rosters
POST   /api/workspaces/:id/rosters
PUT    /api/workspaces/:id/rosters/:rosterId
DELETE /api/workspaces/:id/rosters/:rosterId

// Compliance
GET    /api/workspaces/:id/compliance
POST   /api/workspaces/:id/compliance
PUT    /api/workspaces/:id/compliance/:recordId
DELETE /api/workspaces/:id/compliance/:recordId

// Gaming
GET    /api/workspaces/:id/gaming
POST   /api/workspaces/:id/gaming
PUT    /api/workspaces/:id/gaming/:entryId
DELETE /api/workspaces/:id/gaming/:entryId

// Daily Takings
GET    /api/workspaces/:id/daily-takings
POST   /api/workspaces/:id/daily-takings
PUT    /api/workspaces/:id/daily-takings/:takingId
DELETE /api/workspaces/:id/daily-takings/:takingId
```

## Workspace Detection

Update `WorkspaceDetail.tsx` to detect hospitality workspaces:

```typescript
const isHospitalityWorkspace = () => {
  return workspace?.name?.toLowerCase().includes('hospitality') ||
         workspace?.name?.toLowerCase().includes('pub') ||
         workspace?.name?.toLowerCase().includes('hotel') ||
         workspace?.name?.toLowerCase().includes('club') ||
         workspace?.name?.toLowerCase().includes('licensee');
};
```

## View Tabs for Hospitality Workspace

When detected, show these additional tabs:
- Orders
- Invoices (reuse from Builders workspace)
- Stocktake
- Rosters
- Compliance
- Gaming Register
- Daily Takings

## Next Steps

1. Create remaining 4 components (Rosters, Compliance, Gaming, DailyTakings)
2. Create all backend API routes
3. Create database migrations
4. Update WorkspaceDetail.tsx for hospitality detection
5. Create workspace template SQL
6. Test all features
7. Deploy

## Estimated Completion

- Components: 2-3 hours
- Backend: 1-2 hours
- Database: 30 minutes
- Integration: 1 hour
- Testing: 1 hour

**Total**: 5-7 hours of development work

## Template SQL

Create `backend/database/hospitality_template.sql` with pre-configured hospitality workspace template including all 7 board configs.
