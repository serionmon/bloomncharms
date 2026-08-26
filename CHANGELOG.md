# Bloomncharms — Changelog

## [0.3.0] — 2026-08-26 — Supabase Auth + RLS (Milestone 3)

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