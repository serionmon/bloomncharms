-- ============================================================================
-- Bloomncharms — Milestone 10: Email Notification Logs & Idempotency
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'customer_confirmation', 'admin_new_order'
    status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'skipped'
    resend_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index to guarantee email delivery idempotency per order & type
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_notifications_order_type
    ON public.email_notifications(order_number, email_type);

CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id
    ON public.email_notifications(order_id);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view email notification logs
CREATE POLICY "Admins have full access to email notifications"
    ON public.email_notifications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );
