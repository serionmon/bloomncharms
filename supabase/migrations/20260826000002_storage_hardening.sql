-- =============================================================================
-- Bloomncharms — Migration 20260826000002
-- Storage Hardening & Product Images Policies (Idempotent)
-- =============================================================================

-- Ensure product-images storage bucket exists and is public for fast CDN reads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Storage RLS Policies for 'product-images' bucket
-- -----------------------------------------------------------------------------

-- 1. Public Read Policy (Anyone can read product images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Product images public read'
  ) THEN
    CREATE POLICY "Product images public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
END;
$$;

-- 2. Admin Insert Policy (Only authenticated admin users can upload product images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Product images admin upload'
  ) THEN
    CREATE POLICY "Product images admin upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END;
$$;

-- 3. Admin Update Policy (Only authenticated admin users can update product images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Product images admin update'
  ) THEN
    CREATE POLICY "Product images admin update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END;
$$;

-- 4. Admin Delete Policy (Only authenticated admin users can delete product images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Product images admin delete'
  ) THEN
    CREATE POLICY "Product images admin delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'product-images' AND public.is_admin());
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Re-verify public.product_images table policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

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
