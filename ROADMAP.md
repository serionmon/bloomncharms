# Bloomncharms — Engineering Roadmap

See PROJECT_MEMORY.md for current milestone status.

## Phase 1 — Frontend (✅ Complete)
1. Stitch UI migration to Next.js/TypeScript/Tailwind
2. Cart system: CartProvider, CartDrawer, CartToast, QuantityStepper
3. Checkout flow: 3-step (Delivery → Payment → Review)
4. Frontend validation: names, phone (Indian), email, address, city, state, PIN
5. Product catalog, product detail pages
6. All routes: /, /shop, /bouquets, /keyrings, /products/[slug], /cart, /checkout, /custom, /our-story, /track-order

## Phase 2 — Backend + Data (🔄 In Progress)
- Milestone 2: Backend Catalog API & Supabase Integration (✅ Complete)
- Milestone 3: RLS + Auth (Supabase Auth) (✅ Complete)
- Milestone 4: Supabase Storage (✅ Complete)
- Milestone 5: Admin authorization + product management (✅ Complete)
- Milestone 6: Inventory + discounts
- Milestone 7: Customer accounts

## Phase 3 — Commerce (⬜ Future)
- Milestone 8: Orders (server-side cart validation, order creation)
- Milestone 9: Payments (Razorpay — server-side only)
- Milestone 10: Email (Resend)
- Milestone 11: Shipping (Shiprocket)

## Phase 4 — Production (⬜ Future)
- Milestone 12: Reverse proxy (Caddy)
- Milestone 13: Production hardening (Sentry, Analytics, security headers)

## Deployment
- Frontend: Vercel
- Backend: VPS behind Caddy
- Database: Supabase PostgreSQL
- CDN: Cloudflare (planned)
- Domain: GoDaddy