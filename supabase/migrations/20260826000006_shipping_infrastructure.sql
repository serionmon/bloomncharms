-- ============================================================================
-- Bloomncharms — Milestone 11: Shipping Infrastructure (Shiprocket)
-- ============================================================================

-- Add shipping tracking fields to public.orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_provider text DEFAULT 'shiprocket',
  ADD COLUMN IF NOT EXISTS shipment_id text,
  ADD COLUMN IF NOT EXISTS shiprocket_order_id text,
  ADD COLUMN IF NOT EXISTS awb_code text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS shipping_status text DEFAULT 'unfulfilled',
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Index tracking and provider identifiers
CREATE INDEX IF NOT EXISTS idx_orders_awb_code ON public.orders(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON public.orders(shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON public.orders(shipping_status);

-- Shipment Events for Webhook Idempotency and Checkpoint Tracking
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL,
  location text,
  courier_name text,
  awb_code text,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_order_id ON public.shipment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_order_number ON public.shipment_events(order_number);
CREATE INDEX IF NOT EXISTS idx_shipment_events_awb_code ON public.shipment_events(awb_code);

-- Enable Row Level Security
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

-- Customer can read shipment events for their own orders
CREATE POLICY "Customers can view their own shipment events"
  ON public.shipment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipment_events.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to shipment events"
  ON public.shipment_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
