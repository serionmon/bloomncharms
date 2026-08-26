# Bloomncharms — Architecture

## Repository Structure

```
bloomncharms/
  frontend/          # Next.js 15 app (TypeScript, Tailwind CSS)
  backend/           # Express/Node API (TypeScript)
  supabase/          # Supabase migrations
  AGENTS.md          # Engineering rules (source of truth)
  CLAUDE.md          # Project charter + design rules
  PROJECT_MEMORY.md  # Milestone tracker (read first every session)
  ROADMAP.md         # Engineering roadmap
  CHANGELOG.md       # Changes per version
  ARCHITECTURE.md    # This file
```

## Frontend

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom design tokens)
- **State**: React Context (CartProvider) + localStorage for persistence
- **No client-side Zustand/Redux** unless actually needed
- **Images**: next/image for CDN assets
- **Icons**: Material Symbols Outlined

### Key files
- `frontend/app/layout.tsx` — Root layout, wraps CartProvider + CartDrawer + CartToast
- `frontend/components/commerce/CartProvider.tsx` — Cart state, localStorage sync
- `frontend/components/commerce/CartDrawer.tsx` — Slide-out cart drawer
- `frontend/components/catalog/CatalogProductCard.tsx` — Product card with Add to Cart
- `frontend/app/checkout/page.tsx` — 3-step checkout (Delivery ? Payment ? Review)
- `frontend/content/products.ts` — Single source of product data (static, until backend)

## Backend

- **Framework**: Express (Node.js)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL (via @supabase/supabase-js)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

### Security rules (NEVER violate)
- Supabase `service_role` key MUST stay in `backend/.env` only
- Public `anon` key may be used frontend-side with correct RLS
- Never trust client-supplied prices, stock counts, or user IDs
- Always verify payment signatures server-side

## Data Flow (current — Milestone 1, frontend only)

```
User ? ProductCard ? CartProvider (React Context) ? localStorage
User ? CartDrawer / Cart page ? CartProvider
User ? Checkout ? validateStep1() ? frontend-only order preview
```

## Data Flow (target — Milestone 8+)

```
User ? Checkout ? POST /api/orders (backend, validates price server-side)
Backend ? Supabase orders table ? Razorpay order creation
User ? Payment ? Razorpay ? webhook ? backend ? order confirmed
```

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=         # Public — safe for frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key — safe with RLS
```

### Backend (`backend/.env`)
```
SUPABASE_URL=                     # Same URL
SUPABASE_SERVICE_ROLE_KEY=        # NEVER expose to frontend
RAZORPAY_KEY_ID=                  # NEVER expose to frontend
RAZORPAY_KEY_SECRET=              # NEVER expose to frontend
RESEND_API_KEY=                   # NEVER expose to frontend
PORT=3001
```
