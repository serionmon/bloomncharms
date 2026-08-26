-- =============================================================================
-- Bloomncharms — Milestone 9: Razorpay Payments & Webhook Idempotency Schema
-- =============================================================================

-- 1. Extend Orders Table with Razorpay Identifiers
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0);

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);

-- 2. Webhook Event Log for Idempotency
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_events_event_id ON public.payment_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);

-- 3. Payment Transactions Audit Log
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id text NOT NULL,
  razorpay_payment_id text,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'INR' NOT NULL,
  status public.payment_status DEFAULT 'pending' NOT NULL,
  error_code text,
  error_description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id ON public.payment_transactions(razorpay_order_id);

-- Enable RLS
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: payment_events
CREATE POLICY "Admins can view payment events"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role full access to payment events"
  ON public.payment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies: payment_transactions
CREATE POLICY "Customers can view their own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_transactions.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role full access to payment transactions"
  ON public.payment_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
