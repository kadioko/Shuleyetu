-- Add indexes for frequently queried columns to improve performance
-- This migration optimizes database queries for production use

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_vendor_created ON orders(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status ON orders(vendor_id, status);

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_id ON inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_category ON inventory(vendor_id, category);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON order_items(inventory_id);

-- Vendors table indexes
CREATE INDEX IF NOT EXISTS idx_vendors_region ON vendors(region);
CREATE INDEX IF NOT EXISTS idx_vendors_district ON vendors(district);
