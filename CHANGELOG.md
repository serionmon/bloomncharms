# Bloomncharms — Changelog

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