-- =============================================================================
-- Bloomncharms — Migration 20260826000001
-- RLS Hardening & Verification (Idempotent)
-- =============================================================================
-- This migration is IDEMPOTENT and ADDITIVE ONLY.
-- It does NOT alter, drop, or recreate the core schema tables.
-- It re-creates security functions with CREATE OR REPLACE (safe)
-- and adds any missing RLS policies using IF NOT EXISTS guards.
-- =============================================================================

-- Ensure extensions are present (idempotent).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Re-confirm SECURITY DEFINER functions with safe search_path
-- (CREATE OR REPLACE is always safe — replaces in-place)
-- -----------------------------------------------------------------------------

-- handle_new_user: auto-creates profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.raw_user_meta_data->>'full_name', ' ', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', nullif(substr(new.raw_user_meta_data->>'full_name', length(split_part(new.raw_user_meta_data->>'full_name', ' ', 1)) + 2), '')),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- protect_profile_role: blocks non-admins from self-promoting
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Account roles cannot be modified by non-admin users.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- is_admin: safe helper with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- handle_updated_at: generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Re-attach triggers (CREATE OR REPLACE TRIGGER requires PG 14+)
-- Use a safe guard pattern.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- on_auth_user_created
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;

  -- enforce_profile_role_protection
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_profile_role_protection'
    AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER enforce_profile_role_protection
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Verify RLS is enabled on all customer-sensitive tables
-- (Safe to run again — enabling already-enabled RLS is a no-op)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Add missing RLS policies (IF NOT EXISTS guards)
-- If policy already exists, DO NOTHING.
-- -----------------------------------------------------------------------------

-- PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'Profiles select policy'
  ) THEN
    CREATE POLICY "Profiles select policy"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'Profiles update policy'
  ) THEN
    CREATE POLICY "Profiles update policy"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id OR public.is_admin());
  END IF;
END;
$$;

-- CATEGORIES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories'
    AND policyname = 'Categories public select'
  ) THEN
    CREATE POLICY "Categories public select"
      ON public.categories FOR SELECT
      USING (is_active = true OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories'
    AND policyname = 'Categories admin all'
  ) THEN
    CREATE POLICY "Categories admin all"
      ON public.categories FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- PRODUCTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
    AND policyname = 'Products public select'
  ) THEN
    CREATE POLICY "Products public select"
      ON public.products FOR SELECT
      USING (is_active = true OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
    AND policyname = 'Products admin all'
  ) THEN
    CREATE POLICY "Products admin all"
      ON public.products FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- PRODUCT IMAGES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_images'
    AND policyname = 'Product images public select'
  ) THEN
    CREATE POLICY "Product images public select"
      ON public.product_images FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.products
          WHERE products.id = product_images.product_id
          AND (products.is_active = true OR public.is_admin())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_images'
    AND policyname = 'Product images admin all'
  ) THEN
    CREATE POLICY "Product images admin all"
      ON public.product_images FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- INVENTORY (admin-only direct access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory'
    AND policyname = 'Inventory admin select'
  ) THEN
    CREATE POLICY "Inventory admin select"
      ON public.inventory FOR SELECT
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory'
    AND policyname = 'Inventory admin manage'
  ) THEN
    CREATE POLICY "Inventory admin manage"
      ON public.inventory FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- ADDRESSES (customer owns their own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'addresses'
    AND policyname = 'Addresses user select'
  ) THEN
    CREATE POLICY "Addresses user select"
      ON public.addresses FOR SELECT
      USING (auth.uid() = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'addresses'
    AND policyname = 'Addresses user insert'
  ) THEN
    CREATE POLICY "Addresses user insert"
      ON public.addresses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'addresses'
    AND policyname = 'Addresses user update'
  ) THEN
    CREATE POLICY "Addresses user update"
      ON public.addresses FOR UPDATE
      USING (auth.uid() = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'addresses'
    AND policyname = 'Addresses user delete'
  ) THEN
    CREATE POLICY "Addresses user delete"
      ON public.addresses FOR DELETE
      USING (auth.uid() = user_id OR public.is_admin());
  END IF;
END;
$$;

-- ORDERS (customer reads own orders only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
    AND policyname = 'Orders user select'
  ) THEN
    CREATE POLICY "Orders user select"
      ON public.orders FOR SELECT
      USING (auth.uid() = user_id OR public.is_admin());
  END IF;
END;
$$;

-- ORDER ITEMS (customer reads items of their own orders)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items'
    AND policyname = 'Order items user select'
  ) THEN
    CREATE POLICY "Order items user select"
      ON public.order_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = order_items.order_id
          AND (orders.user_id = auth.uid() OR public.is_admin())
        )
      );
  END IF;
END;
$$;

-- DISCOUNTS (admin/server only — zero public SELECT access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'discounts'
    AND policyname = 'Discounts admin all'
  ) THEN
    CREATE POLICY "Discounts admin all"
      ON public.discounts FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- DISCOUNT USAGE (user can view own usage records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'discount_usage'
    AND policyname = 'Discount usage user select'
  ) THEN
    CREATE POLICY "Discount usage user select"
      ON public.discount_usage FOR SELECT
      USING (auth.uid() = user_id OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'discount_usage'
    AND policyname = 'Discount usage admin all'
  ) THEN
    CREATE POLICY "Discount usage admin all"
      ON public.discount_usage FOR ALL
      USING (public.is_admin());
  END IF;
END;
$$;

-- =============================================================================
-- VERIFICATION SUMMARY
-- =============================================================================
-- After applying this migration, verify in Supabase SQL Editor:
--
--   SELECT schemaname, tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
--
-- Expected: All customer-sensitive tables have owner-scoped SELECT policies.
-- Expected: discounts has NO public SELECT policy.
-- Expected: inventory has NO public SELECT policy.
-- =============================================================================
