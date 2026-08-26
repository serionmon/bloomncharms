# Bloomncharms — Frontend Stabilization / Backend Handoff

## Scope

This phase only stabilizes the frontend. Backend services, authentication, database persistence, Razorpay, webhooks, and admin APIs are intentionally deferred.

## Fixed

- Removed the duplicate `data/products.ts` source. `content/products.ts` is now the single product source.
- Normalized the gift category to `gift-sets`.
- Reused `CatalogProductCard` on the Shop page instead of maintaining a second product-card implementation.
- Added working Add to Cart behavior to the reusable catalog card.
- Replaced the non-functional "Add to Cart" hover affordance in the legacy product card with "View Details".
- Moved available product images to local `/public/images/products/` paths where assets exist.
- Removed the custom filesystem authentication/session/password implementation from the frontend phase.
- Removed local customer/order data and the unsafe hard-coded auth secret.
- Kept the Account page as a backend-ready UI shell; authentication is not faked.
- Kept Checkout as a frontend preview only; it no longer writes orders to a filesystem store.
- Kept Track Order as a clearly isolated demo state until the backend exists.
- Added `.gitignore` protection for `.env*`, `.data`, `.next`, and `node_modules`.
- Added VS Code CSS lint configuration for Tailwind at-rules.
- Preserved the existing Bloomncharms Stitch visual system and routes.

## Backend phase should add

Use Supabase as planned in `CLAUDE.md`:

- Supabase Auth for customer authentication/session management.
- PostgreSQL tables for users/profiles, orders, order items, addresses and payments.
- Row Level Security so customers can only read their own orders.
- Supabase Storage only where persistent customer-uploaded assets are needed.
- Razorpay server-side order creation, signature verification and webhooks.
- Server-side inventory validation.
- Server-side price/discount calculation.
- Admin authorization separate from customer authorization.

Do not bring back filesystem persistence. Vercel should never be treated as the application database.

## Validation performed in this environment

- Checked for stale imports to the removed auth/data modules: none found.
- Checked for the previously stored customer email/phone data: removed.
- TypeScript parsing was attempted. Full type-check/build could not complete because the uploaded project did not contain a usable installed dependency tree after extraction; the source itself did not produce syntax errors before dependency-resolution failures.
- The final project archive intentionally excludes `.next` and `node_modules`.

## Run locally

```bash
npm install
npm run build
npm run dev
```

The next implementation phase can safely focus on backend integration without first undoing the frontend architecture.
