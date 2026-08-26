-- =============================================================================
-- Bloomncharms — PostgreSQL Schema, RLS, Storage & Seed Data (Phase 1)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Custom Enums
-- -----------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'customer',
  'admin'
);

CREATE TYPE public.discount_type AS ENUM (
  'percentage',
  'fixed_amount'
);

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'replacement_requested',
  'replacement_approved',
  'replacement_shipped',
  'refund_requested',
  'refund_approved',
  'rto'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'partially_paid',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE public.payment_method AS ENUM (
  'full_online',
  'hybrid',
  'cod',
  'unknown'
);

-- -----------------------------------------------------------------------------
-- Trigger Helper: updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Table: Profiles (linked to auth.users)
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  phone text,
  role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Auto-create profile trigger on auth.users signup
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Prevent non-admins from promoting their own or other profiles' roles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Account roles cannot be modified by non-admin users.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER enforce_profile_role_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- Table: Categories
-- -----------------------------------------------------------------------------

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Products
-- -----------------------------------------------------------------------------

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sku text UNIQUE,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subtitle text,
  description text DEFAULT '' NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'INR' NOT NULL,
  image_url text,
  alt_text text DEFAULT '' NOT NULL,
  badge text,
  tag text,
  is_customizable boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  is_bestseller boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  processing_days integer CHECK (processing_days IS NULL OR processing_days >= 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Product Images (Storage references)
-- -----------------------------------------------------------------------------

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  alt_text text DEFAULT '' NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- Table: Inventory (Authoritative Server Stock)
-- -----------------------------------------------------------------------------

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  stock_quantity integer DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
  low_stock_threshold integer DEFAULT 3 NOT NULL CHECK (low_stock_threshold >= 0),
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Addresses
-- -----------------------------------------------------------------------------

CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'IN' NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Orders
-- -----------------------------------------------------------------------------

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address jsonb NOT NULL,
  order_status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
  payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
  payment_method public.payment_method DEFAULT 'unknown'::public.payment_method NOT NULL,
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount numeric(10, 2) DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
  shipping_fee numeric(10, 2) DEFAULT 0 NOT NULL CHECK (shipping_fee >= 0),
  tax_amount numeric(10, 2) DEFAULT 0 NOT NULL CHECK (tax_amount >= 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Order Items (Snapshot Line Items)
-- -----------------------------------------------------------------------------

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  product_sku_snapshot text NOT NULL,
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(10, 2) NOT NULL CHECK (line_total >= 0),
  customization jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- Table: Discounts (Private Admin/Server Only)
-- -----------------------------------------------------------------------------

CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  description text,
  discount_type public.discount_type NOT NULL,
  value numeric(10, 2) NOT NULL CHECK (value >= 0),
  minimum_order_amount numeric(10, 2) CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0),
  maximum_discount_amount numeric(10, 2) CHECK (maximum_discount_amount IS NULL OR maximum_discount_amount >= 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_customer_limit integer CHECK (per_customer_limit IS NULL OR per_customer_limit > 0),
  starts_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Table: Discount Usage
-- -----------------------------------------------------------------------------

CREATE TABLE public.discount_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid REFERENCES public.discounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount_discounted numeric(10, 2) NOT NULL CHECK (amount_discounted >= 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- Performance Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_order_status ON public.orders(order_status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_discounts_code ON public.discounts(code);
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;

-- Admin role check helper function (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Profiles: Customer can SELECT/UPDATE own profile; Admin can read all
CREATE POLICY "Profiles select policy"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update policy"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Categories: Public can view active; Admin manages
CREATE POLICY "Categories public select"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Categories admin all"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- Products: Public can view active; Admin manages
CREATE POLICY "Products public select"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Products admin all"
  ON public.products FOR ALL
  USING (public.is_admin());

-- Product Images: Public can view for active products; Admin manages
CREATE POLICY "Product images public select"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id AND (products.is_active = true OR public.is_admin())
    )
  );

CREATE POLICY "Product images admin all"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- Inventory: Protected server-side / admin-only direct table query
CREATE POLICY "Inventory admin select"
  ON public.inventory FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Inventory admin manage"
  ON public.inventory FOR ALL
  USING (public.is_admin());

-- Addresses: Customer manages only own addresses
CREATE POLICY "Addresses user select"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Addresses user insert"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Addresses user update"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Addresses user delete"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- Orders: Customer can read only own orders
CREATE POLICY "Orders user select"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Order Items: Customer can read only items belonging to own orders
CREATE POLICY "Order items user select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Discounts: STRICTLY Admin/Server only. Zero public SELECT access to prevent coupon snooping.
CREATE POLICY "Discounts admin all"
  ON public.discounts FOR ALL
  USING (public.is_admin());

-- Discount Usage: User can view only own usage records
CREATE POLICY "Discount usage user select"
  ON public.discount_usage FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Discount usage admin all"
  ON public.discount_usage FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- Supabase Storage Architecture: product-images bucket
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Product images admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Product images admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Product images admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- Seed Data: Categories
-- -----------------------------------------------------------------------------

INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Bouquets', 'bouquets', 'Curated everlasting bouquets handcrafted from silk and velvety chenille.', 1),
  ('a0000000-0000-0000-0000-000000000002', 'Flowers', 'flowers', 'Single stem botanical blossoms designed for bud vases and small arrangements.', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Keyrings', 'keyrings', 'Handcrafted floral charms and botanical keyrings with brass hardware.', 3),
  ('a0000000-0000-0000-0000-000000000004', 'Charms', 'charms', 'Delicate clip-on keepsakes and decorative accessory charms.', 4),
  ('a0000000-0000-0000-0000-000000000005', 'Gift Sets', 'gift-sets', 'Bespoke curated sets in artisanal gift boxes with personalized cards.', 5)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Seed Data: Products & Initial Inventory
-- -----------------------------------------------------------------------------

INSERT INTO public.products (
  id, category_id, sku, slug, name, subtitle, description,
  price, currency, image_url, alt_text, badge, tag,
  is_customizable, is_featured, is_bestseller, is_active, processing_days
) VALUES
  -- Bouquets
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BC-BOU-001',
    'signature-bloom-bouquet',
    'Signature Bloom Bouquet',
    'Chenille-stem & silk wrap',
    'Our quintessential arrangement, meticulously sculpted petal by petal from premium velvety chenille stems and wrapped in artisanal kraft linen. A timeless centrepiece designed to hold memories.',
    1299.00, 'INR',
    '/images/products/signature-bloom-bouquet.jpg',
    'Handmade Signature Bloom Bouquet crafted from chenille stems and wrapped in raw silk by Bloomncharms.',
    'Bestseller', 'Bestseller',
    true, true, true, true, 2
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'BC-BOU-002',
    'mini-pastel-bouquet',
    'Mini Pastel Bouquet',
    'Delicate posy arrangement',
    'A delicate posy of pastel blossoms, handcrafted for small gestures and bedside tables. Created slowly using soft blush and cream tones tied with natural twine.',
    699.00, 'INR',
    '/images/products/mini-pastel-bouquet.jpg',
    'Handmade Mini Pastel flower bouquet tied with twine by Bloomncharms.',
    'New', 'New',
    true, false, false, true, 2
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'BC-BOU-003',
    'rose-bloom-bouquet',
    'Rose Bloom Bouquet',
    'Crimson & blush velvet roses',
    'A lavish arrangement of textured roses in deep crimson and antique blush tones. Hand-sculpted with exceptional detail and finished with satin ribbon.',
    1499.00, 'INR',
    '/images/products/rose-bloom-bouquet.jpg',
    'Handmade rich crimson and blush velvet rose bouquet by Bloomncharms.',
    NULL, NULL,
    true, false, false, true, 3
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'BC-BOU-004',
    'tulip-bouquet',
    'Tulip Bouquet',
    'Modern simplicity posy',
    'Sculptural elegance featuring clean botanical lines and soft pastel stems. Perfect for gifting and personal workspace accents.',
    899.00, 'INR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDTfLmX5Iph74QZuIMVgnbGK9aj1RicB-SvHgDa8DYk4VCGMvbRQ4z37A6xPwRVs8O6wgECG3pUOgNjgHvjFLInt5PFeSl0eKJNf4dBM25rGWTRk6E445MeTHK8y18Mtsrn7lAHy1PAgseIIO1kR7Wqpe0XkKlzBk9HxdZMEEfdART3f81kC-F4P4Tzf9y0ff1IrtMEhonA_0Woj06xqxHm5uBVhw9i_3osBF5nMW0nvoTzq9HrKCTZ8Q',
    'Minimalist bouquet of sculpted satin tulips in ivory and peach.',
    NULL, NULL,
    true, false, false, true, 2
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'BC-BOU-005',
    'signature-bouquet',
    'Signature Bouquet',
    'Handcrafted slow-made bouquet',
    'A classic collection of hand-formed blossoms crafted with care in our atelier.',
    1199.00, 'INR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBF9LhK-DWgkD9o8NazAGe8Q6PaRGefjofA0MkhbbdF-K2os5R11RLbDk_miN0OFMMTEW17weEAuecp-U9fTIIfvMDw9Z3HJpGCvhaLT0dkqMjuZ3KFQUUepvscUCi1kATvfsErjVLezdcecmI1u_eVw9vAH5PcT3uJB8psszJEcE_ZlKO1DByuqhlkPkX4UNJj_VgSzEXxYXI5Ex3hsANVQocWWPJJ1wuEOidiZqogSYc6hB9FcKxE2g',
    'Signature bouquet of handcrafted chenille stems wrapped in kraft paper.',
    NULL, NULL,
    true, false, false, true, 2
  ),

  -- Single Stem Flowers
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000002',
    'BC-FLW-001',
    'handmade-tulip',
    'Handmade Tulip',
    'Single sculpted stem',
    'A single sculpted tulip stem with curved satin petals and a slender stem. Perfect on its own in a slender ceramic bud vase or gathered in pairs.',
    199.00, 'INR',
    '/images/products/handmade-tulip.jpg',
    'Handcrafted single-stem tulip in soft ivory and peach by Bloomncharms.',
    'Single Stem', 'Single Stem',
    false, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000002',
    'BC-FLW-002',
    'blue-daisy-bloom',
    'Blue Daisy Bloom',
    'Single botanical blossom',
    'Bright and cheerful sky-blue petals radiating around a soft textured yellow core. Each petal is individually shaped for a natural, organic bloom.',
    229.00, 'INR',
    '/images/products/blue-daisy-bloom.jpg',
    'Handmade sky blue daisy blossom with golden center by Bloomncharms.',
    NULL, NULL,
    false, false, false, true, 1
  ),

  -- Keyrings
  (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000003',
    'BC-KEY-001',
    'lavender-bloom-keyring',
    'Lavender Bloom Keyring',
    'Handmade floral charm with brass ring',
    'Carry a piece of the garden with you. Features miniature lavender sprigs and blush buds secured to a sturdy brushed gold-tone keyring.',
    299.00, 'INR',
    '/images/products/lavender-bloom-keyring.jpg',
    'Lavender Bloom Keyring with tiny detailed handmade flowers and brass clasp by Bloomncharms.',
    'Bestseller', 'Bestseller',
    true, false, true, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000003',
    'BC-KEY-002',
    'mini-tulip-keyring',
    'Mini Tulip Keyring',
    'Blush pink bell charm',
    'A charming miniature tulip bud finished with a discreet leaf and premium clasp. Lightweight, durable, and delightful for daily keys or bag accents.',
    279.00, 'INR',
    '/images/products/mini-tulip-keyring.jpg',
    'Mini Tulip Keyring in blush pink resting on linen by Bloomncharms.',
    NULL, NULL,
    false, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000003',
    'BC-KEY-003',
    'daisy-keyring',
    'Daisy Keyring',
    'White & sunny yellow charm',
    'Bright and cheerful daisy flower charm with gold-plated clip.',
    249.00, 'INR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0R29j_PtTkOkVH-qV_rP_RV-5um4zVJLPHAS37jCuJ8T7VRBKCRGk6sbxD298s6Q2m0qFEShW32jBfqOlkV5GtKnyDwqu85m6YUQhehvrPlW1F_FSHZG9fBMbYoec1Kk_jEFUyhISGaTTbnMrVnrgGNH5-YEzS3_28MQsXQGo36cMNAX0uP_BFvmv8WXykWXOvBKj81GAbkEpd9oy3Mxj3xWu9fXihcHGrFt74nTssNvLK0if2GTg',
    'Handcrafted floral daisy keyring hanging from bag loop.',
    NULL, NULL,
    false, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000003',
    'BC-KEY-004',
    'rose-bloom-keyring',
    'Rose Bloom Keyring',
    'Deep crimson velvet blossom',
    'Sculpted mini rose with brushed brass clasp.',
    299.00, 'INR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNP5-4nauFjMjTobPqe0-ouHPjpXDkPVWedkPR-Ww6YdCLq9QojoaKFJDflSOEBeHjxMwAKbLh5cOVIERrEy1CIJRODNBOqYWjWvktM0wcv9L8lLE4zS8OOTUP0sPaTgZZALlJZ6CkaDxrjNGTuPleMIZ_6stbLazT7Znq3DlGP27jhjkcdmnk7GaLZ2r9UB74cr-EywBqeuQQF66Rtl0zipr7K98rxfuSbxu1oUzcJFt1fPHRjDUDQ',
    'Single stem rose keyring in deep muted red on stone surface.',
    NULL, NULL,
    false, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'BC-KEY-005',
    'sunflower-keyring',
    'Sunflower Keyring',
    'Golden sunshine blossom',
    'Radiant handcrafted miniature sunflower with secure keyring.',
    279.00, 'INR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBoXI2VDg9ZxSUCdPEssVZYiojmRQOj7zh3YaowT2JtSJ3RBaK8XCdiZmW_wfyL4_6k5WT8Fc670u7u550cG_fuPVcIAgMBwZuH-3ktWAl8ZcUbOKWCYjg4wmXczzLJ3HILYMkdBymJPQ5_ajwVQbNiH6Z7gnZQK-ADBEFbrLR1rWZp5Rx0AiRy6D-fZCbpvKoTnIWTzRL2i3WJuIO7nptd3p2u_xmU7yOPZA8Jqxd4DcBClZwJCgqrmw',
    'Sunflower keyring with golden petals and brown center.',
    NULL, NULL,
    false, false, false, true, 1
  ),

  -- Charms
  (
    'b0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000004',
    'BC-CHM-001',
    'butterfly-bloom-charm',
    'Butterfly Bloom Charm',
    'Delicate clip-on keepsake',
    'A whimsical handmade charm with soft lilac wings and tiny flower accents. Designed to clip seamlessly onto bags, zippers, or key loops.',
    199.00, 'INR',
    '/images/products/butterfly-bloom-charm.jpg',
    'Handmade butterfly bloom charm with lilac petals by Bloomncharms.',
    NULL, NULL,
    true, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000004',
    'BC-CHM-002',
    'daisy-bag-charm',
    'Daisy Bag Charm',
    'Handcrafted floral accent',
    'An elegant white daisy with a sunny yellow center and durable lobster clasp. Adds an instant touch of bespoke handmade craft to your tote or backpack.',
    229.00, 'INR',
    '/images/products/daisy-bag-charm.jpg',
    'Handcrafted white and sunny yellow daisy bag charm by Bloomncharms.',
    NULL, NULL,
    false, false, false, true, 1
  ),
  (
    'b0000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000004',
    'BC-CHM-003',
    'pastel-flower-charm-set',
    'Pastel Flower Charm Set',
    'Trio of clip-on charms',
    'A curated trio of miniature blossom charms in terracotta, blush, and cream. Mix and match across bags, journals, or key sets.',
    349.00, 'INR',
    '/images/products/pastel-flower-charm-set.jpg',
    'Trio of pastel flower charms with metal clasps by Bloomncharms.',
    NULL, NULL,
    false, false, false, true, 1
  ),

  -- Gift Sets
  (
    'b0000000-0000-0000-0000-000000000016',
    'a0000000-0000-0000-0000-000000000005',
    'BC-GFT-001',
    'mini-bloom-gift-set',
    'Mini Bloom Gift Set',
    'Curated bouquet & keyring box',
    'The complete little gift: contains a handcrafted mini posy, matching keyring, and a handwritten botanical note card nestled in an eco-friendly gift box.',
    799.00, 'INR',
    '/images/products/mini-bloom-gift-set.jpg',
    'Curated Mini Bloom Gift Set with bouquet, keyring, and gift box by Bloomncharms.',
    'Gift Box', 'Gift Box',
    true, false, false, true, 2
  ),
  (
    'b0000000-0000-0000-0000-000000000017',
    'a0000000-0000-0000-0000-000000000005',
    'BC-GFT-002',
    'best-friend-gift-box',
    'Best Friend Gift Box',
    'Bespoke matching duo set',
    'Created to celebrate special bonds. Includes two complementary floral keyrings, a vibrant flower arrangement, and customizable ribbon packaging.',
    999.00, 'INR',
    '/images/products/best-friend-gift-box.jpg',
    'Best Friend Gift Box with twin floral keyrings and bouquet by Bloomncharms.',
    'Curated', 'Curated',
    true, false, false, true, 2
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  badge = EXCLUDED.badge,
  tag = EXCLUDED.tag,
  is_customizable = EXCLUDED.is_customizable,
  is_featured = EXCLUDED.is_featured,
  is_bestseller = EXCLUDED.is_bestseller,
  is_active = EXCLUDED.is_active,
  processing_days = EXCLUDED.processing_days;

-- Seed Inventory for Products
INSERT INTO public.inventory (product_id, stock_quantity, low_stock_threshold) VALUES
  ('b0000000-0000-0000-0000-000000000001', 8, 3),
  ('b0000000-0000-0000-0000-000000000002', 12, 3),
  ('b0000000-0000-0000-0000-000000000003', 4, 3),
  ('b0000000-0000-0000-0000-000000000004', 9, 3),
  ('b0000000-0000-0000-0000-000000000005', 6, 3),
  ('b0000000-0000-0000-0000-000000000006', 18, 3),
  ('b0000000-0000-0000-0000-000000000007', 15, 3),
  ('b0000000-0000-0000-0000-000000000008', 10, 3),
  ('b0000000-0000-0000-0000-000000000009', 7, 3),
  ('b0000000-0000-0000-0000-000000000010', 12, 3),
  ('b0000000-0000-0000-0000-000000000011', 8, 3),
  ('b0000000-0000-0000-0000-000000000003', 14, 3),
  ('b0000000-0000-0000-0000-000000000013', 14, 3),
  ('b0000000-0000-0000-0000-000000000014', 11, 3),
  ('b0000000-0000-0000-0000-000000000015', 9, 3),
  ('b0000000-0000-0000-0000-000000000016', 6, 3),
  ('b0000000-0000-0000-0000-000000000017', 5, 3)
ON CONFLICT (product_id) DO UPDATE SET
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold;
