# Bloomncharms — Changelog

## [0.12.0] — 2026-08-26 — Production Reverse Proxy & Deployment Architecture (Milestone 12)

### Added

#### Reverse Proxy & Production Topology
- `Caddyfile` & `deploy/Caddyfile`:
  - Reverse proxy configuration with automatic HTTPS, HTTP $\to$ HTTPS redirection, and Zstandard/Gzip compression.
  - Same-origin reverse proxy routing: `/api/*` $\to$ backend port 4000; `/*` $\to$ frontend port 3000.
  - Production security headers: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
  - Client IP and protocol preservation through `X-Forwarded-*` headers.
- **Frontend API Base Resolution** (`frontend/lib/api.ts`):
  - In browser runtime, requests use same-origin relative `/api/*` when `NEXT_PUBLIC_API_URL` is omitted, eliminating hardcoded URLs.
- **Fastify Production Hardening** (`backend/src/app.ts`):
  - `trustProxy: true` for accurate IP detection behind Caddy.
  - `@fastify/helmet` for secure response headers.
  - `@fastify/rate-limit` for rate limiting (120 req/min) with allowlist exemptions for health checks and payment/shipping webhooks.
  - Strict CORS origin validation rejecting unauthorized third-party cross-origin requests.
- **Containerization & Deployment**:
  - `backend/Dockerfile`: Multi-stage Alpine container running as non-root `node` user with health check.
  - `frontend/Dockerfile`: Multi-stage standalone Next.js container.
  - `docker-compose.yml`: Multi-container production orchestration for backend, frontend, and Caddy.

---

## [0.11.0] — 2026-08-26 — Shipping Infrastructure with Shiprocket (Milestone 11)

### Added

#### Backend Shipping Service & Shiprocket Integration
- `ShiprocketClient` (`backend/src/shipping/shiprocket.ts`):
  - Official REST API operations with automatic token authentication, 9-day memory caching, and graceful offline simulation mode when credentials are not configured.
  - `createOrder()`: Creates adhoc courier orders mapping product dimensions, pickup locations, customer destinations, and payment modes (`Prepaid` vs `COD`).
  - `assignAwb()`: Automatic AWB generation and courier partner assignment (`Blue Dart`, `Delhivery`, etc.).
  - `trackByAwb()`: Real-time checkpoint tracking.
  - `cancelOrder()`: Provider shipment cancellation.
- `ShippingService` (`backend/src/shipping/service.ts`):
  - `createShipment()`: Server-authoritative shipment creation with duplicate shipment guards.
  - `assignAwb()`: AWB assignment transitioning order shipping status to `in_transit`.
  - `getShipmentTracking()`: Scoped tracking data with IDOR protection.
  - `handleWebhook()`: Inbound webhook verification and event deduplication via `public.shipment_events`.
- **Admin Shipping Routes** (`backend/src/admin/routes.ts`):
  - `GET /api/admin/orders/:id/shipping`, `POST /api/admin/orders/:id/shipping/create`, `POST /api/admin/orders/:id/shipping/awb`, `POST /api/admin/orders/:id/shipping/cancel` (protected by `authenticate + requireAdmin`).
- **Customer & Public Tracking Routes** (`backend/src/shipping/routes.ts`):
  - `GET /api/shipping/track/:orderIdentifier`
  - `POST /api/shipping/webhook`
- **Frontend Live Tracking** (`frontend/app/track-order/page.tsx` & `frontend/lib/api.ts`):
  - Seamlessly queries `/api/shipping/track/:orderIdentifier` and renders live courier partner, AWB code, and courier tracking links without changing the editorial page design.
- **Database Schema**:
  - `supabase/migrations/20260826000006_shipping_infrastructure.sql`: Adds shipping columns to `public.orders` and creates `public.shipment_events` table with RLS policies.

---

## [0.10.0] — 2026-08-26 — Email Notifications with Resend (Milestone 10)

### Added

#### Backend Resend Email Integration & Templates
- `EmailService` (`backend/src/email/service.ts`):
  - `sendOrderEmails()`: Asynchronous dispatch of customer order confirmation and store admin notification after order commitment.
  - `sendCustomerConfirmation()`: Formatted customer email detailing line items, discounts, shipping destination, and exact payment split.
  - `sendAdminNewOrderAlert()`: Studio operational order notification with customer contact info, totals, and delivery destination.
  - **Idempotency Tracking**: Keyed per `${orderNumber}:${emailType}` using memory and database table `email_notifications`.
  - **Graceful Dev Fallback**: No-op simulation when `RESEND_API_KEY` is not present, ensuring development and unit testing never crash.
- **Templates**:
  - `renderOrderConfirmationHtml` / `renderOrderConfirmationPlainText` (`backend/src/email/templates/order-confirmation.ts`): Italian editorial visual design in HTML and plain text.
  - `renderAdminNewOrderHtml` / `renderAdminNewOrderPlainText` (`backend/src/email/templates/new-order-admin.ts`): Clear structured admin notification layout in HTML and plain text.
- **Database Schema**:
  - `supabase/migrations/20260826000005_email_notifications.sql`: Adds `public.email_notifications` with unique composite index on `(order_number, email_type)` and RLS policies.

---

## [0.9.1] — 2026-08-26 — Admin Products Management UI

### Added

#### Frontend Atelier Products Console
- `frontend/components/admin/AdminNav.tsx`: Added `PRODUCTS` navigation tab (`STOREFRONT | PRODUCTS | INVENTORY | DISCOUNTS`) with active route highlighting.
- `frontend/app/admin/products/page.tsx`: Full product catalog table with search (by name, SKU, slug), filters (category, active status, stock level), summary KPI cards, and edit/deactivate actions.
- `frontend/app/admin/products/new/page.tsx`: Product creation studio with auto-slug generation, SKU suggestion, multi-image upload dropzone, alt text inputs, and real-time live storefront card preview.
- `frontend/app/admin/products/[id]/page.tsx`: Product editor with existing media gallery management, instant image uploads, image deletion, activate/deactivate toggles, and direct links to Atelier Inventory and Storefront.
- `frontend/lib/api.ts`: Added `fetchAdminProducts`, `fetchAdminProductById`, `createAdminProduct`, `updateAdminProduct`, `deactivateAdminProduct`, `uploadAdminProductImage`, `updateAdminProductImage`, and `deleteAdminProductImage`.

---

## [0.9.0] — 2026-08-26 — Razorpay Payment Integration (Milestone 9)

### Added

#### Backend Razorpay Integration & Webhook Handler
- `RazorpayService` (`backend/src/payments/service.ts`):
  - `createPaymentOrder()`: Server-authoritative payable amount derivation (`full_online` 100% vs `hybrid` 50% split in integer Paise), ownership validation, Razorpay order creation via official SDK, and `payment_transactions` audit recording.
  - `verifyPaymentSignature()`: Timing-safe HMAC-SHA256 signature verification comparing database-stored `razorpay_order_id` with `razorpay_payment_id` against `RAZORPAY_KEY_SECRET`. Transitions order state to `paid` or `partially_paid`.
  - `handleWebhook()`: Raw body HMAC-SHA256 signature verification with `RAZORPAY_WEBHOOK_SECRET` and event deduplication via `payment_events`.
- Payment Routes (`backend/src/payments/routes.ts`):
  - `POST /api/payments/razorpay/order`: Protected order creation.
  - `POST /api/payments/razorpay/verify`: Signature verification.
  - `POST /api/payments/razorpay/webhook`: Webhook endpoint with raw body capture.
- Fastify Content Parser (`backend/src/app.ts`): Added raw buffer retention on `application/json` requests.

#### Frontend Checkout & Razorpay Integration
- `frontend/app/checkout/page.tsx`:
  - Connected online checkout submission to launch official Razorpay Standard Checkout modal (`checkout.js`).
  - Passes brand burgundy styling (`#800020`), order ID, amount, and customer prefill.
  - Handles client callback and sends signature to backend for verification before rendering `OrderSuccessModal`.
- `frontend/lib/api.ts` & `frontend/lib/razorpay.ts`: Added `createRazorpayOrder`, `verifyRazorpayPayment`, and `loadRazorpayScript`.

#### Database Migration
- `supabase/migrations/20260826000004_razorpay_payments.sql`:
  - Extended `public.orders` with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount_paid`.
  - Created `public.payment_events` (with unique `event_id`) for webhook idempotency.
  - Created `public.payment_transactions` for complete payment attempt audit trails.

#### Automated Test Suite
- `backend/src/scripts/test-razorpay.ts`: Automated test suite covering amount derivations (Paise precision), signature verification, timing-safe checks, webhook signatures, webhook deduplication, hybrid partial payments, and frontend secrets isolation.

---

## [0.8.0] — 2026-08-26 — Orders & Checkout Backend (Milestone 8)

### Added

#### Backend Orders & Authoritative Calculations
- `OrderService` (`backend/src/orders/service.ts`):
  - `previewOrder()`: Authoritative cart validation verifying product existence, active status, available stock in `public.inventory`, database catalog prices, promotional coupons, and payment method discounts (10% online savings on `full_online` or 50/50 split on `hybrid`).
  - `createOrder()`: Atomic order placement in `public.orders`, snapshot line items in `public.order_items` (preserving historical name, SKU, unit price), safe inventory stock deduction, and promotional usage logging in `public.discount_usage`.
  - `getOrderByOrderNumber()`: Public order tracking lookup.
- Order Validation (`backend/src/orders/validation.ts`): Zod schemas for order previews, creation, items, and delivery addresses.
- Order Routes (`backend/src/orders/routes.ts`):
  - `POST /api/orders/preview`: Server calculation & availability check.
  - `POST /api/orders`: Authoritative order placement.
  - `GET /api/orders/:orderNumber`: Public tracking lookup.
  - `GET /api/orders/my-orders`: Authenticated customer order history.

#### Frontend Checkout Integration
- `frontend/app/checkout/page.tsx`:
  - Connected Step 3 (Review) to `POST /api/orders/preview` for live server calculation and availability check.
  - Connected Place Order button to `POST /api/orders` for real backend transaction.
  - Integrated `OrderSuccessModal` with the authoritative `orderNumber` returned from the server.
- `frontend/lib/api.ts`: Added `fetchOrderPreview`, `createOrder`, and `trackOrder` client helpers.

#### Automated Test Suite
- `backend/src/scripts/test-orders.ts`: Automated test suite covering price calculation, payment discounts, split calculations, out-of-stock rejection, invalid address rejection, order creation, line item snapshots, inventory deduction, and tracking lookups.

---

## [0.7.0] — 2026-08-26 — Customer Account Dashboard (Milestone 7)

### Added

#### Backend Customer Profile & Address Infrastructure
- `CustomerService` (`backend/src/customers/service.ts`):
  - `getProfile()`: Retrieves user profile from `public.profiles` for authenticated user.
  - `updateProfile()`: Updates first name, last name, and phone with strict scoping (prevents tampering with ID or role).
  - `listAddresses()`: Lists saved addresses ordered by default status and creation date.
  - `getAddressById()`: Scoped address retrieval with ownership verification.
  - `createAddress()`: Saves recipient details, street address, and Indian PIN code with automatic default assignment.
  - `updateAddress()`: Scoped address updates with atomic default switching.
  - `deleteAddress()`: Scoped address deletion, promoting remaining address to default if needed.
  - `setDefaultAddress()`: Atomically designates an address as the default delivery location.
  - `listOrders()`: Scoped order history with line items, snapshots, and order totals.
  - `getOrderById()`: Scoped order details lookup.
- Customer Validation (`backend/src/customers/validation.ts`): Zod schemas for profiles and Indian addresses (6-digit PIN regex `/^\d{6}$/`, 10-digit mobile number).
- Customer Routes (`backend/src/customers/routes.ts`):
  - Profile: `GET /api/customers/me`, `PATCH /api/customers/me`.
  - Addresses: `GET /api/customers/me/addresses`, `POST /api/customers/me/addresses`, `GET /api/customers/me/addresses/:id`, `PATCH /api/customers/me/addresses/:id`, `DELETE /api/customers/me/addresses/:id`, `PATCH /api/customers/me/addresses/:id/default`.
  - Orders: `GET /api/customers/me/orders`, `GET /api/customers/me/orders/:id`.

#### Frontend Customer Account UI
- `frontend/app/account/AccountDashboard.tsx`: Polished multi-tab customer dashboard:
  - **Profile Tab**: Edit personal information (first name, last name, phone), display authenticated email and member since details.
  - **Addresses Tab**: Saved address cards with "Default" badge, modal for adding/editing addresses, delete button, and "Set Default" toggle.
  - **Orders Tab**: Private order history cards with order status badges, expandable line item breakdown, and financial totals.
- `frontend/lib/api.ts`: Added customer API helpers (`fetchCustomerProfile`, `updateCustomerProfile`, `fetchCustomerAddresses`, `createCustomerAddress`, `updateCustomerAddress`, `deleteCustomerAddress`, `setDefaultCustomerAddress`, `fetchCustomerOrders`).

#### Automated Test Suite
- `backend/src/scripts/test-customer-account.ts`: Automated tests covering unauthenticated rejection (401), customer profile CRUD, address creation, default address switching, address editing, address deletion, order history access, and cross-customer IDOR protection (404).

---

## [0.6.0] — 2026-08-26 — Inventory & Discount Infrastructure (Milestone 6)

### Added

#### Backend Inventory & Stock Derivation
- `InventoryService` (`backend/src/inventory/service.ts`):
  - `listInventory()`: Returns inventory joined with product details and derived status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
  - `getProductInventory()`: Single product inventory.
  - `updateProductInventory()`: Non-negative stock quantity & threshold updates.
  - `getPublicStock()`: Public-safe stock check without leaking internal counts.
  - `checkCartAvailability()`: Bulk item availability check.
- Inventory Validation (`backend/src/inventory/validation.ts`): Zod schemas and status derivation helpers.
- Admin Inventory Routes: `GET /api/admin/inventory`, `GET /api/admin/products/:id/inventory`, `PATCH /api/admin/products/:id/inventory`.
- Public Inventory Routes: `GET /api/inventory/:productId`, `POST /api/inventory/check`.

#### Backend Discounts & Server-Side Validation
- `DiscountService` (`backend/src/discounts/service.ts`):
  - `listDiscounts()`: Admin promotional campaign listing with usage counts.
  - `createDiscount()`: Code uniqueness check (409 Conflict), percentage / fixed validation, start/end dates, caps.
  - `updateDiscount()`: Partial update with uniqueness guards.
  - `deactivateDiscount()`: Soft-deactivation (`is_active = false`).
  - `validateDiscountCode()`: Authoritative validation checking minimum order, expiration, usage limits, percentage/fixed calculations, and maximum discount caps.
- Discount Validation (`backend/src/discounts/validation.ts`): Zod schemas for campaigns and checkout coupon validation.
- Admin Discount Routes: `GET`, `POST`, `PATCH`, `DELETE` at `/api/admin/discounts`.
- Public Discount Route: `POST /api/discounts/validate`.

#### Frontend Admin Dashboard & Checkout
- `frontend/app/admin/layout.tsx`: Console layout and subheader navigation.
- `frontend/app/admin/inventory/page.tsx`: Inventory management dashboard with inline stock editor, threshold controls, status badges, and search filter.
- `frontend/app/admin/discounts/page.tsx`: Discount campaigns management dashboard with modal creation form and active toggle.
- `frontend/app/checkout/page.tsx`: Integrated coupon code input with loading state, error/success banners, remove action, and live discount calculations.
- `frontend/lib/api.ts`: Added `validateDiscount` and `checkProductStock` client functions.

#### Test Suite
- `backend/src/scripts/test-inventory-discounts.ts`: 17 automated checks covering admin authentication, customer authorization, stock status derivation, negative stock rejection, discount calculations, maximum caps, and public validation endpoints.

### Verified
- Backend typecheck: 0 errors
- Backend build: Clean build to `dist/`
- Frontend typecheck: 0 errors
- Frontend build: All 22 Next.js App Router routes compiled cleanly

---


### Changed

- `DELETE /api/admin/products/:id` (`backend/src/admin/routes.ts`):
  - **Before**: Called `AdminProductService.deleteProduct()` — permanent cascade removal from the database.
  - **After**: Calls `AdminProductService.deactivateProduct()` — sets `is_active = false`, preserves the row, all product images, and leaves historical `order_items` referencing the product ID fully intact.
  - Hard physical deletion is no longer reachable from any HTTP endpoint.  Only the `AdminProductService.deleteProduct()` method remains in the service layer for potential future internal/maintenance use.

### Tests Updated

- `backend/src/scripts/test-admin-products.ts`:
  - Step 9 now asserts `DELETE` returns `{ product: { isActive: false }, message: "...deactivated..." }`.
  - Additional assertion verifies product row is **still retrievable** after `DELETE` (confirms soft-delete, not hard-delete).

---


### Added

#### Admin Backend & Product Management
- `AdminProductService` (`backend/src/admin/service.ts`):
  - `listProducts()`: Returns all active and inactive catalog products with associated categories, inventory, and images.
  - `getProductById(id)`: Comprehensive product retrieval.
  - `createProduct(input)`: Validates inputs, enforces slug and SKU uniqueness (409 Conflict), inserts product and initializes inventory record.
  - `updateProduct(id, input)`: Partial updates with slug/SKU collision checks and inventory stock sync.
  - `deactivateProduct(id)`: Soft deletion (`is_active = false`).
  - `deleteProduct(id)`: Cascading removal from database.
- Admin Validation (`backend/src/admin/validation.ts`): Zod schemas for create/update product payloads and slug generator.
- Admin Routes (`backend/src/admin/routes.ts`):
  - `GET /api/admin/products`
  - `GET /api/admin/products/:id`
  - `POST /api/admin/products`
  - `PUT /api/admin/products/:id`
  - `PATCH /api/admin/products/:id/deactivate`
  - `DELETE /api/admin/products/:id`
- Automated Test Suite (`backend/src/scripts/test-admin-products.ts`): Complete verification suite for admin authentication, customer authorization boundaries, product CRUD, uniqueness checks, deactivation, and image operations.

### Verified
- Backend typecheck (`npm run typecheck`): 0 errors.
- Backend build (`npm run build`): Clean build to `dist/`.
- Frontend typecheck (`npm run typecheck`): 0 errors.
- Frontend build (`npm run build`): All 20 routes compiled cleanly.

---


### Added

#### Database & Storage
- `supabase/migrations/20260826000002_storage_hardening.sql`: Created `product-images` storage bucket (public CDN read, 10MB file limit, restricted to `image/jpeg`, `image/png`, `image/webp`).
- Storage RLS: Public read policy on `storage.objects` for `product-images`; Admin-only upload, update, and delete policies with `public.is_admin()` check.
- `public.product_images` table RLS policies verified.

#### Backend Storage Architecture
- Added `@fastify/multipart` dependency and registered plugin in `backend/src/app.ts`.
- `StorageService` (`backend/src/storage/service.ts`): Reusable service for uploading product images to scoped paths (`products/${productId}/${uuid}.${ext}`), replacing images, deleting images, updating image metadata (alt text, sort order), and resolving public CDN URLs.
- Image Validation (`backend/src/storage/validation.ts`): Zod schemas for parameters and payloads; binary magic byte header validator (JPEG, PNG, WebP) to prevent MIME spoofing; 10MB maximum file size enforcement.
- Admin PreHandler (`backend/src/auth/plugin.ts`): Added `requireAdmin` preHandler returning 401 for unauthenticated requests and 403 Forbidden for non-admin users.
- Admin Endpoints (`backend/src/admin/routes.ts`):
  - `POST /api/admin/products/:id/images`: Uploads image and creates `product_images` row (supports multipart forms and base64 JSON).
  - `PATCH /api/admin/products/:id/images/:imageId`: Updates image alt text and sort order.
  - `DELETE /api/admin/products/:id/images/:imageId`: Deletes storage file and removes database record.
- Catalog Integration (`backend/src/products/routes.ts` & `service.ts`):
  - `GET /api/products/:id/images`: Public endpoint returning gallery images with resolved public URLs.
  - `getProductBySlug`: Enriched to include gallery images and resolve Supabase Storage paths while preserving 100% backward compatibility with static local assets.
- Automated Test Suite (`backend/src/scripts/test-storage.ts`): 10 tests covering public image resolution, 401 unauthenticated upload, 403 customer upload, 400 invalid MIME / magic byte check, 400 oversized file, 401/403 delete guards, and CRUD lifecycle.

### Verified
- Backend typecheck (`npm run typecheck`): 0 errors.
- Backend build (`npm run build`): Clean build to `dist/`.
- Frontend typecheck (`npm run typecheck`): 0 errors.
- Frontend build (`npm run build`): All 20 routes generated cleanly.

---


### Added

#### Frontend — Supabase SSR Client Architecture
- `frontend/lib/supabase/client.ts`: Browser client using `createBrowserClient` from `@supabase/ssr`.
- `frontend/lib/supabase/server.ts`: Server client using `createServerClient` with Next.js 15 `cookies()` API.
- `frontend/lib/supabase/middleware.ts`: Session refresh helper + auth redirect logic.
- `frontend/lib/supabase/types.ts`: Typed `Database` interface mirroring the Supabase schema.
- `frontend/middleware.ts`: Next.js middleware refreshing session on every request; redirects `/account` to `/account/sign-in` if unauthenticated.

#### Frontend — Auth Context
- `frontend/components/auth/AuthProvider.tsx`: React context providing `user`, `session`, `loading`, `signOut` via `onAuthStateChange`.

#### Frontend — Account Pages
- `/account/sign-in`: Real sign-in (React Hook Form + Zod, `signInWithPassword`, loading/error states, redirect on success).
- `/account/create`: Real sign-up (first name, last name, email, password w/ strength rules, confirm, email confirmation success screen).
- `/account/forgot-password`: `resetPasswordForEmail` flow with sent confirmation screen.
- `/account/reset-password`: `PASSWORD_RECOVERY` event listener + `updateUser({ password })`.
- `/account` (dashboard): Server-side auth guard (double-checks session via server Supabase client), profile panel with name/email/member since, orders placeholder, sign-out button.

#### Frontend — Layout & Header
- `frontend/app/layout.tsx`: Wrapped with `AuthProvider` (outermost provider).
- `frontend/components/layout/Header.tsx`: Auth-aware account icon — filled `account_circle` icon in primary color when signed in; `person` icon when unauthenticated.

#### Backend — Auth Layer
- `backend/src/types/fastify.d.ts`: Fastify module augmentation adding `request.user?: { id, email, role }`.
- `backend/src/auth/plugin.ts`: `authenticate` preHandler — reads `Authorization: Bearer <token>`, verifies via `supabase.auth.getUser(token)`, fetches role from `profiles`, sets `request.user`. Never trusts client-supplied identity.
- `backend/src/auth/routes.ts`: `GET /api/auth/me` → 401 unauthenticated / `200 { user: { id, email, role } }` authenticated.
- `backend/src/scripts/test-auth.ts`: Automated verification script for tests G–K (RLS isolation, role escalation block, /me endpoint).

#### Database
- `supabase/migrations/20260826000001_rls_hardening.sql`: Idempotent migration re-affirming all RLS policies with `IF NOT EXISTS` guards, and `CREATE OR REPLACE` for all `SECURITY DEFINER` functions (`handle_new_user`, `protect_profile_role`, `is_admin`, `handle_updated_at`).

### Packages Added (Frontend)
- `@supabase/supabase-js` ^2.x
- `@supabase/ssr` ^0.x
- `react-hook-form` ^7.x
- `zod` ^3.x
- `@hookform/resolvers` ^3.x

### Verified
- Backend typecheck: 0 errors. Backend build: Clean.
- Frontend typecheck: 0 errors. Frontend build: 20 pages (5 new auth routes).
- RLS: customer can only read own profile/addresses/orders; cross-user access blocked.
- Role trigger: `UPDATE profiles SET role = 'admin'` rejected for non-admins.
- `/api/auth/me`: 401 without token, 200 with valid token.

---

## [0.2.0] — 2026-08-26 — Backend Catalog API & Storefront Integration

### Added

#### Backend API (Fastify)
- Implemented `ProductService` (`backend/src/products/service.ts`) querying Supabase PostgreSQL `products`, `categories`, and `inventory` tables.
- Implemented `GET /api/products` endpoint supporting category, search, customizable, featured, and sort parameters.
- Implemented `GET /api/products/:slug` endpoint returning product details with stock and category relationships, returning 404 for unknown slugs.
- Implemented `GET /api/categories` endpoint returning category taxonomy with real-time product counts.
- Registered `/api/categories` route plugin in `backend/src/app.ts`.
- Added automated endpoint test suite in `backend/src/scripts/test-catalog.ts`.

#### Frontend Storefront (Next.js)
- Implemented API client (`frontend/lib/api.ts`) for typed fetching of products, product by slug, and categories with resilient local catalog fallback.
- Connected `ProductCatalog` component (`frontend/components/catalog/ProductCatalog.tsx`) to `GET /api/products` with loading skeleton, error retry, and empty state.
- Connected `ShopCatalogContent` (`frontend/app/shop/ShopCatalogContent.tsx`) to `GET /api/products` with category filtering, sorting, loading skeletons, and error handling.
- Connected Product Detail Page (`frontend/app/products/[slug]/page.tsx`) to `GET /api/products/:slug` with loading skeletons, not-found state, and Add to Cart action.
- Connected `BouquetsPage` and `KeyringsPage` to server-side product fetching.

### Fixed
- Corrected duplicate UUID collision in `supabase/migrations/20260825000000_initial_schema.sql` and `backend/src/products/service.ts`: assigned unique UUID `b0000000-0000-0000-0000-000000000012` to `sunflower-keyring` (and its inventory seed), resolving overlap with `rose-bloom-bouquet` (`...0003`).

### Verified
- Strict architecture separation: frontend contains zero backend imports and zero Supabase private secrets.
- Database migration audit: 17/17 unique product UUIDs and 17/17 inventory records matching 100% with frontend & backend catalog.
- Backend typecheck (`npm run typecheck`): 0 errors.
- Backend build (`npm run build`): Clean build to `dist/`.
- Frontend typecheck (`npm run typecheck`): 0 errors.
- Frontend build (`npm run build`): All 16 routes compiled successfully.

## [0.1.1] — 2026-08-26 — Frontend Stabilization: Cart + Checkout Validation

### Fixed
- Cart badge in Header only renders when count > 0 and capped at 99+.
- Checkout delivery validation: First/Last names, Indian phone format, optional RFC email, address length, city/state, 6-digit PIN.
- Checkout step flow and empty cart guard.

## [0.1.0] — 2026-08-XX — Initial Frontend Stabilization
- Migrated Stitch UI design to Next.js 15 / TypeScript / Tailwind CSS.
- Cart system with localStorage persistence.