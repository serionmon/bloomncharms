# Bloomncharms — Project Memory

> **Single source of truth for milestone status.**
> All AI assistants and developers MUST read this file at the start of every session.

---

## CURRENT MILESTONE

**Milestone 2 — Supabase Connection + Schema + Migrations**
Status: ? Not started

---

## MILESTONE STATUS

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Frontend Stabilization | ? Complete |
| 2 | Supabase Connection + Schema + Migrations | ? Not started |
| 3 | Row Level Security + Auth | ? Not started |
| 4 | Supabase Storage | ? Not started |
| 5 | Admin Authorization + Products | ? Not started |
| 6 | Inventory + Discounts | ? Not started |
| 7 | Customer Accounts | ? Not started |
| 8 | Orders | ? Not started |
| 9 | Payments (Razorpay) | ? Not started |
| 10 | Email (Resend) | ? Not started |
| 11 | Shipping (Shiprocket) | ? Not started |
| 12 | Reverse Proxy (Caddy) | ? Not started |
| 13 | Production Hardening | ? Not started |

---

## MILESTONE 1 — COMPLETE

### Cart System
- CartProvider (context + localStorage persistence) — verified correct
- CartDrawer — verified correct
- CartToast — verified correct
- CatalogProductCard.addItem() — verified correct (increments on re-add)
- Product detail page addItem(product, quantity) — verified correct
- QuantityStepper — verified correct
- getItemCount() / getSubtotal() — verified correct
- Cart state persists across navigation via localStorage
- No duplicate CartProvider instances
- No hydration errors (isHydrated guard in place)

### Header
- Cart badge now only renders when totalCount > 0
- Badge shows 99+ if count overflows

### Checkout Validation (now enforced)
- First name: Required, letters/hyphens/apostrophes, min 2 chars
- Last name: Required, letters/hyphens/apostrophes, min 2 chars
- Phone: Required, 10-digit Indian mobile starting with 6-9, strips +91/91/0 prefix
- Email: Optional — validated only if non-empty (RFC format check)
- Address: Required, min 8 characters
- City: Required, letters/hyphens/apostrophes, min 2 chars
- State: Required, letters/hyphens/apostrophes, min 2 chars
- PIN Code: Required, exactly 6 numeric digits; non-digits stripped on input
- Delivery Notes: Optional, capped at 300 chars
- All errors shown inline

### Checkout Step Navigation
- "02 Payment" breadcrumb validates step 1 before advancing
- "03 Review" breadcrumb validates step 1 before advancing
- handleContinueToReview() validates step 1 (was missing before)
- handlePlaceOrder() guards against empty cart
- handlePlaceOrder() re-validates step 1

### Test Results
- tsc --noEmit: exit code 0, zero errors
- next build: exit code 0, 16 pages
- next lint: exit code 0, zero errors (pre-existing <img> warnings only)

---

## ARCHITECTURE CONSTRAINTS (permanent)

- frontend/ — Next.js client code only. No backend secrets.
- backend/ — Express/Node backend only. No frontend code.
- Supabase service-role key MUST stay in backend/.env only, never in frontend.
- No real payment processing until Milestone 9.
- Do not redesign the existing Italian editorial UI.
- See AGENTS.md and CLAUDE.md for full rule set.

---

## NEXT SESSION

Start Milestone 2: Supabase Connection + Schema + Migrations.

Prerequisites:
- Supabase project created and URL/keys obtained
- Backend .env populated with Supabase credentials

Milestone 2 deliverables:
1. Supabase client in backend/
2. Schema: users, profiles, products, orders, order_items, addresses
3. Foreign keys, indexes, enums, constraints
4. Migration in supabase/migrations/
5. Typecheck + build green

Do NOT start Milestone 2 until the session explicitly confirms it.
