# Bloomncharms — Project Memory

> **Single source of truth for milestone status.**
> All AI assistants and developers MUST read this file at the start of every session.

---

## CURRENT MILESTONE

**Milestone 4 — Supabase Storage**  
Status: ⬜ Not started

---

## MILESTONE STATUS

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Frontend Stabilization | ✅ Complete |
| 2 | Backend Catalog API & Supabase Integration | ✅ Complete |
| 3 | Row Level Security + Auth | ✅ Complete |
| 4 | Supabase Storage | ⬜ Not started |
| 5 | Admin Authorization + Products | ⬜ Not started |
| 6 | Inventory + Discounts | ⬜ Not started |
| 7 | Customer Accounts | ⬜ Not started |
| 8 | Orders | ⬜ Not started |
| 9 | Payments (Razorpay) | ⬜ Not started |
| 10 | Email (Resend) | ⬜ Not started |
| 11 | Shipping (Shiprocket) | ⬜ Not started |
| 12 | Reverse Proxy (Caddy) | ⬜ Not started |
| 13 | Production Hardening | ⬜ Not started |

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