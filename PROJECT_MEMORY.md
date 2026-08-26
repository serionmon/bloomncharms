# Bloomncharms — Project Memory

> **Single source of truth for milestone status.**
> All AI assistants and developers MUST read this file at the start of every session.

---

## CURRENT MILESTONE

**Milestone 10 — Email (Resend)**  
Status: ⬜ Not started

---

## MILESTONE STATUS

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Frontend Stabilization | ✅ Complete |
| 2 | Backend Catalog API & Supabase Integration | ✅ Complete |
| 3 | Row Level Security + Auth | ✅ Complete |
| 4 | Supabase Storage | ✅ Complete |
| 5 | Admin Authorization + Products | ✅ Complete |
| 6 | Inventory + Discounts | ✅ Complete |
| 7 | Customer Accounts | ✅ Complete |
| 8 | Orders | ✅ Complete |
| 9 | Payments (Razorpay) | ✅ Complete (Live test credentials pending setup) |
| 10 | Email (Resend) | ⬜ Not started |
| 11 | Shipping (Shiprocket) | ⬜ Not started |
| 12 | Reverse Proxy (Caddy) | ⬜ Not started |
| 13 | Production Hardening | ⬜ Not started |

---

## MILESTONE 9 — COMPLETE: Payments (Razorpay)

### Payments Architecture & Security
- `RazorpayService` (`backend/src/payments/service.ts`):
  - `createPaymentOrder(input, userId)`: Server-authoritative order lookup, ownership validation, payable check, integer paise calculation (`full_online` 100% vs `hybrid` 50% split), Razorpay order creation, and `payment_transactions` audit recording.
  - `verifyPaymentSignature(input, userId)`: Retrieves server-stored `razorpay_order_id` from DB, generates expected HMAC-SHA256 signature, executes `crypto.timingSafeEqual` comparison, transitions order payment state (`paid` for `full_online`, `partially_paid` for `hybrid`), and updates transaction audit logs.
  - `handleWebhook(rawBody, signature)`: Validates raw request body against `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`, enforces event idempotency via `public.payment_events`, and handles `payment.captured`, `order.paid`, and `payment.failed`.
- Endpoints (`backend/src/payments/routes.ts`):
  - `POST /api/payments/razorpay/order`
  - `POST /api/payments/razorpay/verify`
  - `POST /api/payments/razorpay/webhook`
- Frontend Integration (`frontend/app/checkout/page.tsx` & `frontend/lib/razorpay.ts`):
  - Dynamically loads official Razorpay Standard Checkout SDK (`https://checkout.razorpay.com/v1/checkout.js`).
  - Launches Razorpay modal on user checkout submission with burgundy brand theme and customer prefill.
  - On payment callback, transmits signature data to `/api/payments/razorpay/verify` for server confirmation.
- Database Schema (`supabase/migrations/20260826000004_razorpay_payments.sql`):
  - Added `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount_paid` to `public.orders`.
  - Created `public.payment_events` for webhook audit and deduplication.
  - Created `public.payment_transactions` for complete payment attempt audit trails.


### Orders Architecture & Authoritative Calculations
- `OrderService` (`backend/src/orders/service.ts`):
  - `previewOrder(input, userId)`: Server-authoritative price lookup, product active status verification, inventory availability check, coupon calculation via `DiscountService`, 10% online savings computation on `full_online`, and 50/50 payment split calculations.
  - `createOrder(input, userId)`: Atomic order creation, snapshot line items in `public.order_items`, inventory deduction in `public.inventory`, and coupon usage recording in `public.discount_usage`.
  - `getOrderByOrderNumber(orderNumber)`: Public order tracking lookup returning fulfillment status, items snapshot, and shipping destination.
- Validation (`backend/src/orders/validation.ts`): Zod schemas for order previews, creation, items, and shipping addresses (enforcing 6-digit Indian PIN `/^\d{6}$/` and 10-digit mobile `/^[6-9]\d{9}$/`).
- Order Routes (`backend/src/orders/routes.ts`):
  - `POST /api/orders/preview`
  - `POST /api/orders`
  - `GET /api/orders/:orderNumber`
  - `GET /api/orders/my-orders`
- Frontend Integration (`frontend/app/checkout/page.tsx` & `frontend/lib/api.ts`):
  - `fetchOrderPreview`: Authoritative price and availability check when proceeding to review step.
  - `createOrder`: Places order with generated unique order number, triggers `OrderSuccessModal`, and clears cart.


### Customer Architecture & Security
- `CustomerService` (`backend/src/customers/service.ts`):
  - `getProfile(userId)`: Reads user profile from `public.profiles` for authenticated user.
  - `updateProfile(userId, { firstName, lastName, phone })`: Safely updates profile name and phone. Client cannot alter `id` or `role`.
  - `listAddresses(userId)`: Lists saved addresses ordered by `is_default DESC, created_at DESC`.
  - `getAddressById(userId, addressId)`: Scoped address retrieval with ownership verification.
  - `createAddress(userId, input)`: Saves address, auto-assigns default if first address or requested, unsetting previous default.
  - `updateAddress(userId, addressId, input)`: Scoped address update with default handling.
  - `deleteAddress(userId, addressId)`: Scoped address deletion, promoting next address to default if needed.
  - `setDefaultAddress(userId, addressId)`: Atomically updates default delivery address for authenticated user.
  - `listOrders(userId)`: Scoped order history with line items and order totals.
  - `getOrderById(userId, orderId)`: Scoped order details with line items and fulfillment statuses.
- Validation (`backend/src/customers/validation.ts`): Zod schemas for profiles and Indian addresses (6-digit PIN regex `/^\d{6}$/`, 10-digit mobile).
- Customer Endpoints (`backend/src/customers/routes.ts`):
  - `GET /api/customers/me`
  - `PATCH /api/customers/me`
  - `GET /api/customers/me/addresses`
  - `POST /api/customers/me/addresses`
  - `GET /api/customers/me/addresses/:id`
  - `PATCH /api/customers/me/addresses/:id`
  - `DELETE /api/customers/me/addresses/:id`
  - `PATCH /api/customers/me/addresses/:id/default`
  - `GET /api/customers/me/orders`
  - `GET /api/customers/me/orders/:id`
- Customer Account UI (`frontend/app/account/AccountDashboard.tsx`):
  - **Profile Tab**: Edit name, phone, display email and account status with live feedback toasts.
  - **Addresses Tab**: Saved address cards with default badge, address creation/editing modal, delete, and set default action.
  - **Orders Tab**: Private order history cards with order status badges, expandable line items breakdown, and totals.


### Inventory Architecture & Security
- `InventoryService` (`backend/src/inventory/service.ts`):
  - `listInventory()`: Returns product inventory with calculated stock statuses (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
  - `getProductInventory(productId)`: Single product inventory.
  - `updateProductInventory(productId, { stockQuantity, lowStockThreshold })`: Atomic non-negative inventory updates.
  - `getPublicStock(productId)`: Public-safe stock status without leaking internal warehouse counts.
  - `checkCartAvailability(items)`: Bulk cart check prior to checkout.
- Validation (`backend/src/inventory/validation.ts`): Zod schemas enforcing `stockQuantity >= 0` and `lowStockThreshold >= 0`.
- Admin Endpoints:
  - `GET /api/admin/inventory`
  - `GET /api/admin/products/:id/inventory`
  - `PATCH /api/admin/products/:id/inventory`
- Public Endpoints:
  - `GET /api/inventory/:productId`
  - `POST /api/inventory/check`

### Discounts Architecture & Security
- `DiscountService` (`backend/src/discounts/service.ts`):
  - `listDiscounts()`: Admin view of all promotional campaigns and usage analytics.
  - `createDiscount(input)`: Validates uppercase code uniqueness (409 Conflict), percentage / fixed amount constraints, dates, and caps.
  - `updateDiscount(id, input)`: Partial updates with code uniqueness protection.
  - `deactivateDiscount(id)`: Soft-deactivation (`is_active = false`).
  - `validateDiscountCode(code, subtotal, userId)`: Authoritative server calculation, checking active status, start/expiration dates, minimum order subtotal, global usage limits, and per-customer limits.
- RLS Policy: `discounts` table has zero public SELECT access (Admin all). Customers validate codes exclusively through the backend API.
- Admin Endpoints:
  - `GET /api/admin/discounts`
  - `POST /api/admin/discounts`
  - `GET /api/admin/discounts/:id`
  - `PATCH /api/admin/discounts/:id`
  - `DELETE /api/admin/discounts/:id` (Soft-deactivates)
- Public Endpoint:
  - `POST /api/discounts/validate`

### Frontend Admin Console & Product Management
- `frontend/app/admin/layout.tsx`: Admin management console header with server-side admin role enforcement.
- `frontend/components/admin/AdminNav.tsx`: `STOREFRONT | PRODUCTS | INVENTORY | DISCOUNTS` navigation tabs.
- `frontend/app/admin/products/page.tsx`: Full product catalog dashboard with KPI summary cards, multi-field search (name, SKU, slug), category/status/stock level filters, status pills, and edit/deactivate actions.
- `frontend/app/admin/products/new/page.tsx`: Two-column product creation studio with auto-slug generation, SKU suggestion, multi-image upload dropzone, alt text inputs, and real-time live storefront card preview.
- `frontend/app/admin/products/[id]/page.tsx`: Two-column product editor with existing media gallery management, instant photo uploads, image deletion, activate/deactivate toggles, and direct links to Atelier Inventory and Storefront.
- `frontend/app/admin/inventory/page.tsx`: Full inventory management dashboard with live stock editor, threshold controls, status badges, and search.
- `frontend/app/admin/discounts/page.tsx`: Discount campaigns management dashboard with modal creation form and activate/deactivate toggles.


---

## MILESTONE 5 — COMPLETE: Admin Authorization + Products

### Backend Architecture
- Fastify `requireAdmin` preHandler (`backend/src/auth/plugin.ts`): Enforces authenticated admin identity (401 unauthenticated, 403 customer).
- `AdminProductService` (`backend/src/admin/service.ts`):
  - `listProducts()`: Full product list including inactive items, inventory quantities, and gallery images.
  - `getProductById(id)`: Single product retrieval with all relational data.
  - `createProduct(input)`: Auto-slugification with uniqueness checks, SKU uniqueness enforcement, atomic product row insert, and linked inventory record initialization.
  - `updateProduct(id, input)`: Partial updates with slug/SKU collision protection and inventory stock updates.
  - `deactivateProduct(id)`: Soft-deletion (`is_active = false`).
  - `deleteProduct(id)`: Cascading removal from database and storage.
- Validation (`backend/src/admin/validation.ts`): Zod schemas for create/update payloads and URL `slugify` generator.
- Admin Endpoints (`backend/src/admin/routes.ts`):
  - `GET /api/admin/products`
  - `GET /api/admin/products/:id`
  - `POST /api/admin/products`
  - `PUT /api/admin/products/:id`
  - `PATCH /api/admin/products/:id/deactivate`
  - `DELETE /api/admin/products/:id` — **soft-deactivates** (`is_active = false`); does NOT hard-delete; images and historical order references remain intact.
  - `POST /api/admin/products/:id/images`
  - `PATCH /api/admin/products/:id/images/:imageId`
  - `DELETE /api/admin/products/:id/images/:imageId`

### Security Verification
- IDOR / Privilege escalation check: Customer tokens cannot access or manipulate admin product endpoints.
- Slug/SKU uniqueness: Enforced in application layer with 409 Conflict and database unique constraints.
- Service-role key remains backend-only.
- All 7 tests in `test-admin-products.ts` pass.


---

## MILESTONE 4 — COMPLETE: Supabase Storage + Product Image Infrastructure

### Database & Storage
- `supabase/migrations/20260826000002_storage_hardening.sql`: Idempotent migration creating/verifying `product-images` storage bucket (public read, 10MB limit, allowed MIME types `image/jpeg`, `image/png`, `image/webp`).
- Storage RLS: Public SELECT for `bucket_id = 'product-images'`; Admin INSERT/UPDATE/DELETE verified with `public.is_admin()` check.
- `public.product_images` table RLS verified: Public read on active products, Admin all.

### Backend Storage Layer
- `@fastify/multipart` installed and registered in `backend/src/app.ts` (10MB limit).
- `StorageService` (`backend/src/storage/service.ts`):
  - `getPublicUrl(storagePath)`: Resolves public CDN URLs.
  - `uploadProductImage(...)`: Validates file size, MIME type, and magic bytes signature; uploads to `products/${productId}/${uuid}.${ext}`; records entry in `public.product_images`.
  - `replaceProductImage(...)`: Replaces storage object and updates DB record.
  - `deleteProductImage(...)`: Removes file from storage and deletes DB record.
  - `updateImageMetadata(...)`: Updates alt text and sort order.
  - `getProductImages(...)`: Retrieves gallery images with resolved public URLs.
- Image Validation (`backend/src/storage/validation.ts`): Zod schemas + magic bytes binary signature validator (JPEG, PNG, WebP) to prevent MIME spoofing.
- Fastify Auth PreHandlers (`backend/src/auth/plugin.ts`): `requireAdmin` preHandler protecting admin endpoints (401 unauthenticated, 403 customer).
- Admin Endpoints (`backend/src/admin/routes.ts`):
  - `POST /api/admin/products/:id/images` (multipart & base64 JSON support)
  - `PATCH /api/admin/products/:id/images/:imageId`
  - `DELETE /api/admin/products/:id/images/:imageId`
- Catalog Integration (`backend/src/products/routes.ts` & `service.ts`):
  - `GET /api/products/:id/images`: Public product gallery images endpoint.
  - `getProductBySlug`: Resolves storage image URLs and includes gallery images.
  - Backward compatibility: Local static image paths (`/images/products/...`) and remote CDN URLs remain 100% functional with offline fallback.

### Test & Build Results
- Backend typecheck (`tsc --noEmit`): 0 errors.
- Backend build (`npm run build`): Clean.
- Frontend typecheck (`tsc --noEmit`): 0 errors.
- Frontend build (`next build`): 20 pages compiled.
- Storage Verification Suite (`test-storage.ts`): All 10 tests passed (401/403/400 boundary guards, magic byte checks, URL generation).

---

---

## MILESTONE 3 — COMPLETE: Row Level Security + Supabase Auth

### Database / Migrations
- `supabase/migrations/20260826000001_rls_hardening.sql`: Idempotent migration verifying/adding all RLS policies and re-affirming `SECURITY DEFINER` functions with `SET search_path = public, pg_temp`.
- `handle_new_user()` trigger: auto-creates `public.profiles` row on auth.users signup (secured, no role escalation possible).
- `protect_profile_role()` trigger: blocks non-admins from `UPDATE profiles SET role = 'admin'`.
- `is_admin()` helper: SECURITY DEFINER, no RLS recursion, safe search_path.

### Frontend Auth Architecture
- `@supabase/supabase-js` + `@supabase/ssr` installed (cookie-based sessions for Next.js 15 App Router).
- `react-hook-form` + `zod` + `@hookform/resolvers` installed for form validation.
- `frontend/lib/supabase/client.ts`: browser client (`createBrowserClient`).
- `frontend/lib/supabase/server.ts`: server client (`createServerClient` + `cookies()`).
- `frontend/lib/supabase/middleware.ts`: session refresh + redirect logic.
- `frontend/lib/supabase/types.ts`: typed Database interface for frontend.
- `frontend/middleware.ts`: Next.js middleware — refreshes session on every request; redirects `/account` → `/account/sign-in` if unauthenticated.
- `frontend/components/auth/AuthProvider.tsx`: React context with `user`, `session`, `loading`, `signOut`.
- `frontend/app/layout.tsx`: wrapped with `AuthProvider`.
- `frontend/components/layout/Header.tsx`: auth-aware account icon (filled+primary when signed in).

### Account Routes (frontend)
- `/account` — Protected server component, redirects to `/account/sign-in` if unauthenticated. Shows profile dashboard when signed in.
- `/account/sign-in` — Email + password with RHF/Zod, Supabase `signInWithPassword`, loading + error state.
- `/account/create` — First name, last name, email, password (min-8, 1 uppercase, 1 number), confirm. Triggers `handle_new_user` via Supabase `signUp` metadata.
- `/account/forgot-password` — `resetPasswordForEmail`, redirects to `/account/reset-password`.
- `/account/reset-password` — Listens for `PASSWORD_RECOVERY` event; calls `updateUser({ password })`.

### Backend Auth Layer
- `backend/src/types/fastify.d.ts`: augments `FastifyRequest` with `user?: { id, email, role }`.
- `backend/src/auth/plugin.ts`: `authenticate` preHandler — reads `Authorization: Bearer`, calls `supabase.auth.getUser(token)`, fetches role from `profiles`, sets `request.user`.
- `backend/src/auth/routes.ts`: `GET /api/auth/me` → 401 unauthenticated, 200 `{ user: { id, email, role } }` authenticated.
- `backend/src/scripts/test-auth.ts`: RLS + auth verification script (tests G–K).

### Test & Build Results
- Backend typecheck (`tsc --noEmit`): 0 errors.
- Backend build (`npm run build`): Clean.
- Frontend typecheck (`tsc --noEmit`): 0 errors.
- Frontend build (`next build`): 20 pages compiled (5 new auth routes).

---

## MILESTONE 2 — COMPLETE: Backend Catalog API & Storefront Integration

### Backend API (Fastify)
- `GET /api/products`: Full product catalog querying Supabase PostgreSQL (`products`, `categories`, `inventory`) with category, search, customizable, featured, and sort filters.
- `GET /api/products/:slug`: Single product detail by slug querying Supabase PostgreSQL, returns 404 with structured error when not found.
- `GET /api/categories`: Category taxonomy with real-time product counts per category.
- `ProductService`: Authoritative service querying Supabase tables with safe fallback for resilient local development and offline build phases.
- Fastify CORS configured to allow Next.js client origin (`http://localhost:3000`).

### Frontend Integration (Next.js)
- `lib/api.ts`: Typed API client consuming `GET /api/products`, `GET /api/products/:slug`, `GET /api/categories`.
- `ProductCatalog.tsx`: Homepage catalog connected to backend API with loading skeleton, error retry state, empty state, and live category counts.
- `ShopCatalogContent.tsx`: Full `/shop` catalog connected to backend API with category tabs, sort dropdown, loading skeleton, and error state.
- `app/products/[slug]/page.tsx`: Dynamic Product Detail Page fetching by slug with loading skeleton, 404 not found handler, and Add to Cart.
- `app/bouquets/page.tsx` & `app/keyrings/page.tsx`: Server-side API fetching with live catalog data.
- Strict isolation: Frontend does NOT import backend files, backend handles Supabase access exclusively, no service-role secrets exposed to browser.

### Test & Build Results
- `backend`: `tsc --noEmit` (0 errors), `npm run build` (Clean), `test-catalog.ts` (All endpoints 200/404 verified)
- `frontend`: `tsc --noEmit` (0 errors), `next build` (16 pages static + dynamic generated successfully)

---

## ARCHITECTURE CONSTRAINTS (permanent)

- frontend/ — Next.js client code only. No backend secrets.
- backend/ — Fastify/Node backend only. No frontend code.
- Supabase service-role key MUST stay in backend/.env only, never in frontend.
- No real payment processing until Milestone 9.
- Do not redesign the existing Italian editorial UI.
- See AGENTS.md and CLAUDE.md for full rule set.

---

## NEXT SESSION

Start **Milestone 3: Row Level Security + Auth**.

Prerequisites:
- Review Supabase Auth and RLS policies on profiles, addresses, and customer orders.