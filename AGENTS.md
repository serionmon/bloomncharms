# Bloomncharms — Antigravity Engineering Rules

## PRIMARY RULE

Build Bloomncharms using mature, established libraries and managed services wherever practical.

DO NOT hand-write infrastructure that an established library already solves.

Before creating custom infrastructure, check whether an appropriate existing package/service should be used.

The goal is:

- stable
- maintainable
- secure
- small amount of custom code
- maximum reuse of proven libraries

---

# STACK

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React

## Backend / Data

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase SSR helpers

## Validation / Forms

- Zod
- React Hook Form

## Client State

- Existing cart state if already implemented
- Zustand only when lightweight client state is actually needed

Do NOT introduce multiple state-management libraries.

## Server State

Use TanStack Query where client-side server-state management materially improves the implementation.

Do not add it everywhere automatically.

## UI

Prefer existing Bloomncharms components first.

For accessible primitives, prefer:
- Radix UI

## Icons

Use:
- Lucide React

Do not create custom SVG icon systems unless there is a real brand requirement.

## Tables

For admin data tables:
- TanStack Table

Do NOT hand-write sorting/filtering/pagination systems.

## Dates

Use:
- date-fns

Do NOT write custom date formatting/parsing utilities unless absolutely necessary.

## IDs

Prefer:
- PostgreSQL UUIDs / generated database IDs

Use nanoid only where a short public identifier is actually useful.

## Images

Use:
- Next.js Image
- Supabase Storage for uploaded product/customer images

## Email

Use:
- Resend

Do not create a custom SMTP infrastructure.

## Payments

Use the official Razorpay integration/API.

Do NOT create custom payment-processing logic.

Custom code is allowed only for Bloomncharms-specific business rules around payment calculation and order state.

## Shipping

Use Shiprocket or the selected courier's official API.

Do NOT build a custom courier integration.

## Monitoring

Use:
- Sentry

when production monitoring is enabled.

## Analytics

Use:
- Google Analytics
- Vercel Analytics where useful

Do not create custom analytics infrastructure.

## Reverse Proxy

Use:
- Caddy

for the backend/API reverse proxy when the backend server is deployed separately.

---

# DATABASE

Use Supabase PostgreSQL.

Prefer:

- migrations
- foreign keys
- indexes
- constraints
- enums where useful
- database defaults
- server-side validation

Do not duplicate business data in multiple client-side stores.

---

# AUTHENTICATION

Use Supabase Auth.

NEVER:

- build custom password hashing
- store plaintext passwords
- build custom session tokens
- use localStorage as authentication
- trust client-supplied user IDs

Use authenticated server/session identity.

---

# SECURITY

Never expose:

- Supabase service-role key
- database passwords
- Razorpay secret
- shipping API secret
- Resend secret
- Caddy/server secrets

Secrets must remain server-side.

Public Supabase keys may be exposed only where appropriate with correct RLS policies.

---

# ROW LEVEL SECURITY

RLS is REQUIRED for customer data.

Customers may only access their own:

- profile
- addresses
- orders
- order items
- support tickets
- appropriate reviews/data

Never authorize access using:

?userId=

from the browser.

Always derive identity from the authenticated server session.

---

# CUSTOM CODE POLICY

Custom code SHOULD contain:

- Bloomncharms business rules
- order workflow
- payment calculations
- inventory rules
- replacement/refund rules
- custom-product logic
- domain-specific UI
- integration glue

Custom code SHOULD NOT contain:

- authentication framework
- password hashing
- generic form library
- generic validation engine
- generic table implementation
- generic date utilities
- generic icon library
- generic email transport
- generic payment processor
- generic shipping system

---

# DEPENDENCY RULE

DO NOT install a package automatically.

Before adding a dependency:

1. Check whether the existing project already solves the problem.
2. Check whether the chosen library is appropriate.
3. Prefer one proven library over several overlapping libraries.
4. Explain why the dependency is needed.
5. Avoid abandoned or unnecessary packages.

Do not install packages simply because they are convenient.

---

# ARCHITECTURE RULE

Reuse existing components and utilities.

Do not create:

- duplicate CartProvider
- duplicate ProductCard
- duplicate Button system
- duplicate auth system
- duplicate database client
- duplicate API client
- duplicate validation layer

Before creating something new, search the project for an existing implementation.

---

# UI RULE

The approved Bloomncharms Stitch UI is the source of truth.

Do NOT redesign it during backend work.

Preserve:

- Italian editorial aesthetic
- neo-brutalist minimalism
- porcelain background
- charcoal typography
- EB Garamond
- Inter
- burgundy accent
- 1px dividers
- generous whitespace

Backend implementation must connect to the existing UI rather than replacing it.

---

# DEVELOPMENT PROCESS

Do NOT build the entire backend in one step.

Work milestone by milestone.

Recommended order:

1. Supabase connection
2. Database schema
3. Migrations
4. RLS
5. Auth
6. Storage
7. Admin authorization
8. Admin products
9. Inventory
10. Discounts
11. Customer accounts
12. Orders
13. Payments
14. Email
15. Shipping
16. Reverse proxy
17. Production hardening

After each milestone:

- run typecheck
- run lint
- run build
- test affected flows
- inspect console/server errors
- do not continue if the foundation is broken

---

# IMPORTANT

Never claim a feature is secure merely because it works in the UI.

Test actual authorization.

Never claim a payment is successful based on a browser callback.

Never trust client-side prices.

Never trust client-side stock.

Never trust client-supplied user ownership.

The server/database must be authoritative.
