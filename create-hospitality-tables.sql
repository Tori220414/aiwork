-- Create Orders and Stocktakes tables for Hospitality Workspace
-- Run this in your Supabase SQL Editor

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  supplier_contact TEXT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_workspace_id ON orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- Enable Row Level Security for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their workspace orders"
  ON orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orders for their workspaces"
  ON orders FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace orders"
  ON orders FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace orders"
  ON orders FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STOCKTAKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stocktakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stocktake_number TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conducted_by TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_variance_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for stocktakes
CREATE INDEX IF NOT EXISTS idx_stocktakes_workspace_id ON stocktakes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stocktakes_status ON stocktakes(status);
CREATE INDEX IF NOT EXISTS idx_stocktakes_date ON stocktakes(date);
CREATE INDEX IF NOT EXISTS idx_stocktakes_created_by ON stocktakes(created_by);

-- Enable Row Level Security for stocktakes
ALTER TABLE stocktakes ENABLE ROW LEVEL SECURITY;

-- Create policies for stocktakes
CREATE POLICY "Users can view their workspace stocktakes"
  ON stocktakes FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stocktakes for their workspaces"
  ON stocktakes FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace stocktakes"
  ON stocktakes FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace stocktakes"
  ON stocktakes FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Verify the tables were created
SELECT 'Orders table created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders');

SELECT 'Stocktakes table created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stocktakes');
