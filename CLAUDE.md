# 🌸Bloomncharms — Project Charter & Development Rules

> **Permanent Rule Book for `Bloomncharms`**  
> *All developers and AI assistants working on this repository MUST strictly abide by these directives.*

---

## 1. Core Principles & UI Invariance

1. **Preserve the Approved Stitch UI**:
   - The UI exported from Stitch represents the approved design language for `Bloomncharms`.
   - **DO NOT redesign the UI.**
   - **DO NOT invent a new design system.**
   - **DO NOT alter layouts, typography hierarchy, spacing, or color palettes without explicit instruction from the project owner.**
2. **Design Philosophy**:
   - **Italian Editorial + Neo-Brutalist Minimalism**: Elevated magazine-like layouts, structured grid lines (`border-border`), generous whitespace, disciplined typography, and tactile craftsmanship aesthetics.
   - **Porcelain + Charcoal Visual System**: Warm linen/porcelain background (`#F5F3EE` / `#FFF8F7`) paired with crisp charcoal noir typography (`#171717` / `#241918`), grounded with Tuscan crimson accents (`#7E1419` / `#9F2D2D`) and olive sage green (`#5B614F`).
3. **Typography Standards**:
   - **Display / Headings**: `EB Garamond` / `Cormorant Garamond` (editorial serif).
   - **Body & Captions**: `Inter` (neutral, crisp sans).
   - **Labels / Badges**: `Inter` 500/Medium, uppercase, `tracking-[0.1em]`.
   - **Icons**: `Material Symbols Outlined`.
4. **Mobile-First & Responsiveness**:
   - All layouts must be designed mobile-first and expand gracefully across tablet, laptop, and ultra-wide screens without breaking editorial grids.
5. **Component Architecture & Clean Code**:
   - Build modular, clean, and reusable React components (`ProductCard`, `Header`, `Footer`, `QuantityStepper`, `OrderSummaryCard`, etc.).
   - Avoid monolithic page components; split layouts into dedicated, typed section components.

---

## 2. Business Profile

* **Brand Name**: `Bloomncharms`
* **Core Offerings**: Artisanal slow-made creations:
  * Handcrafted everlasting bouquets
  * Single stem flowers & botanical arrangements
  * Handcrafted floral keyrings & accessories
  * Enamel & ceramic charms
  * Curated gift sets
  * Bespoke & personalized custom orders

---

## 3. Approved Route Structure

| Route | Source Stitch Screen | Purpose |
|---|---|---|
| `/` | `home_bloomncharmss_gift_atelier` | Atelier Landing Page (Hero mosaic, [01] Explore grid, Atelier note, Best sellers, Values) |
| `/shop` | `shop_all_bloomncharmss` | Full Catalog with category tabs, filter/sort toolbar, and asymmetric grid |
| `/bouquets` | `bouquets_bloomncharmss` | Curated Bouquets Collection |
| `/keyrings` | `keyrings_bloomncharmss_2` | Full Keyrings & Charms Collection (Comprehensive 428-line screen) |
| `/products/[slug]` | `signature_bouquet_bloomncharmss` | Product Detail Page (PDP) with sticky gallery, personalization, and vertical tabs |
| `/custom` | `custom_orders_bloomncharmss` | Bespoke Commissions Studio (5-step process and inquiry workflow) |
| `/our-story` | `our_story_bloomncharmss` | Brand Origins, Materials, Founder Quote, and Studio Rhythm |
| `/cart` | `shopping_bag_bloomncharmss` | Shopping Bag, Promo Code, Payment Selection, and Summary |
| `/checkout` | `checkout_bloomncharmss` | 3-step Checkout (Contact, Shipping, Payment Option) |
| `/track-order` | `track_order_bloomncharmss` | Order Lookup & 6-step Crafting/Delivery Timeline Stepper |

*(Note: Category links for `/charms`, `/flowers`, and `/gift-sets` filter the `/shop` route: `/shop?category=charms`, `/shop?category=flowers`, `/shop?category=gift-sets`.)*

---

## 4. Product Ethics & Trust Standards

1. **No Fake Reviews**: Never insert fake testimonials, fabricated star ratings, or simulated reviewer avatars. Only real customer feedback is permitted.
2. **No Fake Scarcity**: Do not use artificial countdown timers, fake "Only 1 left in stock!" warnings, or deceptive "X people viewing this right now" popups.
3. **No Deceptive Pricing**: Display transparent pricing and genuine discounts (e.g. 10% instant discount for 100% online payment). Never hide mandatory fees or inflate strike-through prices.

---

## 5. Engineering, Security & Performance

1. **Accessibility (a11y)**:
   - High contrast text conforming to WCAG AA.
   - Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
   - Descriptive `alt` attributes for all imagery.
   - Fully keyboard-accessible interactive components.
2. **Performance**:
   - Next.js image optimization (`next/image`) for remote CDN assets (`lh3.googleusercontent.com`).
   - Zero layout shifts (CLS), clean font preloading, and lightweight CSS.
3. **Security & Secrets**:
   - Never commit API keys, database secrets, or credentials to git or client bundles.
   - Use environment variables (`.env.local`) with strict separation between public and private keys.
4. **Server-Side Payment & Backend Integrity**:
   - All payment verification, webhook processing, order generation, and signature validation MUST execute server-side in secure API routes / Server Actions when implemented.
   - **DO NOT implement backend, auth, Supabase, or Razorpay logic until explicitly instructed.**

---

## 6. Architecture & Infrastructure Roadmap

* **Phase 1 (Current)**: Frontend static prototype & design migration from Stitch to Next.js (App Router, TypeScript, Tailwind CSS).
* **Phase 2 (Future)**: Backend Integration with **Supabase** (PostgreSQL, Database, Storage, Auth).
* **Phase 3 (Future)**: Payment Gateway with **Razorpay** (Orders API, Webhooks, Server Verification).
* **Deployment Target**:
  * Initial deployment: **Vercel**
  * CDN / Edge Security: **Cloudflare** (planned for future layer)
  * Custom Domain: Managed through **GoDaddy**
