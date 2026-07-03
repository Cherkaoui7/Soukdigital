
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_carrier text DEFAULT 'amana',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
