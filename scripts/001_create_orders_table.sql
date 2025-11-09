-- Create orders table for Hot Takes app
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  restaurant_name TEXT NOT NULL,
  food_items JSONB DEFAULT '[]'::jsonb,
  alcohol_items JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on order_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read orders (for feedback collection)
CREATE POLICY "orders_select_all"
  ON public.orders FOR SELECT
  USING (true);

-- Allow anyone to insert orders (for creating feedback links)
CREATE POLICY "orders_insert_all"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update orders (for storing transcripts)
CREATE POLICY "orders_update_all"
  ON public.orders FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
