# Bloomncharms — Changelog

## [Unreleased]

## [0.1.1] — 2026-08-26 — Frontend Stabilization: Cart + Checkout Validation

### Fixed

#### Cart
- Cart badge in Header now only renders when item count > 0 (was always showing "0")
- Cart badge capped at 99+ to prevent overflow

#### Checkout — Validation
- Added `email` to `FormErrors` interface (was missing; email field had no error display)
- `validateStep1()` now enforces real rules instead of only `.trim()` non-empty checks:
  - **First name**: min 2 chars, letters/hyphens/apostrophes only (rejects "1", "a", "123abc")
  - **Last name**: min 2 chars, letters/hyphens/apostrophes only
  - **Phone**: 10-digit Indian mobile (6-9 prefix); strips +91/91/0 prefix and spaces/dashes before test (rejects "abc", "123", "1234567890123")
  - **Email**: optional — validated only when non-empty (rejects "notanemail", "x@", "@y")
  - **Address**: min 8 characters (rejects "a", "123", "home")
  - **City**: min 2 chars, letters/hyphens/apostrophes only
  - **State**: min 2 chars, letters/hyphens/apostrophes only (supports "Jammu-Kashmir")
  - **PIN Code**: exactly 6 numeric digits; non-digit characters stripped on input; `inputMode="numeric"` + `maxLength={6}` on input
- Email error border and message now actually render (was wired to non-existent interface field)

#### Checkout — Step Flow
- `handleContinueToReview()` (step 2 ? 3) now runs `validateStep1()` before advancing (was missing)
- "02 Payment" breadcrumb button validates before advancing
- "03 Review" breadcrumb button validates before advancing
- `handlePlaceOrder()` now guards against empty cart (`items.length === 0`)

### Verified (no changes needed)
- `CartProvider.addItem()` correctly increments quantity for existing product (no duplicate entries)
- `CartProvider` localStorage hydration guard prevents SSR mismatch
- `CartDrawer` quantity stepper (increment/decrement/remove) working correctly
- Cart page `QuantityStepper` + `updateQuantity()` working correctly
- Payment calculations (100% online = 10% discount; 50%+COD = no discount) correct
- `OrderSuccessModal` clears cart correctly on success

### Created
- `PROJECT_MEMORY.md` — shared milestone tracker
- `ROADMAP.md` — engineering roadmap by phase
- `CHANGELOG.md` — this file

## [0.1.0] — 2026-08-XX — Initial Frontend Stabilization

- Migrated Stitch UI design to Next.js 15 / TypeScript / Tailwind CSS
- Removed duplicate product data source (`data/products.ts` ? single `content/products.ts`)
- Removed filesystem-based auth/session/order persistence
- Removed unsafe hard-coded secrets
- Cart system: CartProvider (context + localStorage), CartDrawer, CartToast, QuantityStepper
- All approved routes implemented
- Checkout as frontend preview (no real payment, no real order creation)
