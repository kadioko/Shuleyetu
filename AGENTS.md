# Agent Notes for Shuleyetu

This file captures project-specific commands, verification steps, and
operational notes learned while working on Shuleyetu.

## Project Layout

- **Web app**: `shuleyetu-web/` — Next.js 14 (App Router) + React +
  TypeScript + Tailwind CSS.
- **Database migrations**: `supabase/migrations/` — Supabase SQL migrations.
- **Docs**: `README.md`, `FEATURES.md`, `ROADMAP.md`, `API.md`,
  `DEPLOYMENT_GUIDE.md`, `TEST_ACCOUNTS.md`, `COMPONENTS.md`,
  `CONTRIBUTING.md`.

## Common Commands

All commands below assume the working directory is `Shuleyetu/shuleyetu-web`
unless otherwise noted.

### Build & Verify

```bash
# Production build (must pass before committing)
npm run build

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Local Development

```bash
npm run dev
# Server starts at http://localhost:3000
```

### Dependency Maintenance

```bash
# Update compatible dependencies
npm update

# Check for major-version upgrades
npm outdated

# Audit (use --force only after checking breaking changes)
npm audit
```

## Supabase Workflow

The project is linked to the production Supabase project
`rqlolaoqstvnffkaqmpt`.

### Required CLI

- Install/update the Supabase CLI globally:
  `npm install -g supabase@latest`
- Set the access token when running commands:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
```

### Typical Commands

```bash
# Link the project once
supabase link --project-ref rqlolaoqstvnffkaqmpt

# Check migration status
supabase migration list

# Apply pending migrations
supabase db push

# Run a one-off SQL file against the linked project
supabase db query -f supabase/migrations/<filename>.sql --linked

# Mark a migration as applied without re-running it
supabase migration repair <version> --status applied --yes
```

### Migration Rules

- Migration files must follow the naming convention
  `<YYYYMMDD>_<name>.sql`.
- **Do not use duplicate timestamps** for different files. The Supabase CLI
  tracks migrations by `version` (the timestamp), and duplicate versions break
  `supabase migration list` / `supabase db push`.
- If combining multiple files into one migration, keep the timestamp that is
  already recorded in `supabase_migrations.schema_migrations`.
- The `seed_demo_data.sql` migration is **not applied to production**
  because the live database already contains real vendor, inventory, and
  order data.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` must be a valid HTTP/HTTPS URL. The project ref is
  `rqlolaoqstvnffkaqmpt`, so the correct URL is
  `https://rqlolaoqstvnffkaqmpt.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are required.
- A build-time validation in `next.config.mjs` checks the Supabase URL and
  fails the build if it is missing or invalid.
- If the deployed site shows "Invalid supabaseUrl: Must be a valid HTTP or HTTPS
  URL", update the Vercel environment variables and redeploy.

## Database State

- Production schema is fully reconciled with the codebase, including:
  - Marketplace tables: `vendors`, `inventory`, `orders`, `order_items`
  - Auth/linking tables: `user_roles`, `vendor_users`
  - Communication/reviews: `order_messages`, `vendor_reviews`,
    `contact_messages`
  - School management: `schools`, `school_users`, `school_classes`,
    `school_students`, `school_staff`, `school_attendance`, `school_fees`,
    `school_fee_payments`, `school_announcements`
  - Helper functions: `is_school_user`, `get_user_id_by_email`,
    `get_user_emails_by_ids`, `get_vendor_average_rating`,
    `get_vendor_review_count`
  - Storage buckets: `products`, `vendors`

## Key Routes & Features

- `/` — Marketing landing page
- `/vendors` — Browse vendors
- `/orders/new` — Create an order
- `/orders/track` — Track order by ID + token
- `/dashboard` — Vendor dashboard (requires `vendor_users` link)
- `/admin` — Admin panel (requires `admin` role in `user_roles`)
- `/schools/portal` — School management portal (requires a school +
  `school_users` link)
- `/checklist` — Back-to-school checklist generator

## Pre-Commit Checklist

1. `npm run build` passes with no errors.
2. `npm run lint` passes (warnings are acceptable if pre-existing).
3. Run relevant tests if logic changed.
4. If a migration was added, ensure it is idempotent and applied/recorded
   on the linked project.
5. Update `README.md`, `FEATURES.md`, `ROADMAP.md`, and `API.md` when
   user-facing features or APIs change.

## 10x Growth Roadmap

This roadmap is organized in dependency order: foundation first, revenue next,
growth last. Each phase must pass build + tests before moving on.

### Phase 1: Reliability & Scale (foundation) ✅

- [x] Global error boundary + Sentry `global-error.tsx`
- [x] Zod validation on every API route
- [x] Redis-backed rate limiting per route
- [x] Expand `/status` health dashboard
- [x] Background job queue (`background_jobs` table + `src/lib/jobs.ts`)
- [x] E2E tests for public APIs, critical paths, health checks, rate limiting

### Phase 2: Product + Growth Audit ✅

- [x] Heuristic UX audit across 4 areas (parent shopping, vendor retention, school admin, SEO/mobile/growth)
- [x] Proposed 10 high-impact features with effort/impact
- [x] Implemented top 3 features end-to-end:
  - **Checklist-to-Cart Integration**: fuzzy-match checklist items to vendor inventory; per-item "Add to cart"; auto-fill cart from best-matching vendor.
  - **School-Specific Vendor Recommendations**: `school_vendor_links` table; school filter on `/vendors`; "School-Approved" badge; recommended vendors sorted first.
  - **Bulk Inventory Import/Export**: CSV template, preview, validation, and import at `/dashboard/inventory/import`; CSV export from inventory page.

### Phase 3: Payments & Trust (10x thinking)

Goal: turn every transaction into a trust signal and remove every reason a parent or school would hesitate to pay online.

- **ClickPesa hardening**
  - [ ] Automatic retries with exponential backoff and idempotency keys
  - [ ] Webhook signature verification + duplicate-event replay protection
  - [ ] Payment status reconciliation job (re-query ClickPesa for stuck transactions)
- **Refunds & disputes**
  - [ ] Partial/full refund API with admin approval workflow
  - [ ] Order dispute form for parents; escrow-hold for high-value orders
  - [ ] Refund ledger tied to order audit log
- **Invoicing & receipts**
  - [ ] PDF invoice auto-generation (order confirmation + payment receipt)
  - [ ] Invoice numbering sequence per vendor/school
  - [ ] Email/SMS receipt delivery via background jobs
- **Trust layer**
  - [ ] Vendor KYC document upload (TIN, business license, NIDA)
  - [ ] Tiered trust badges: Verified, Top Rated, Fast Delivery, School Partner
  - [ ] Public vendor rating breakdown by category
- **Admin oversight**
  - [ ] Transaction audit log with filtering by status, vendor, school
  - [ ] Admin dashboard for payment exceptions and refunds

### Phase 4: Vendor + Marketplace (10x thinking)

Goal: make Shuleyetu the default storefront for school supply vendors in Tanzania — more sellers, more buyers, more repeat purchases.

- **Vendor productivity**
  - [x] Inventory CSV/Excel bulk import (moved to Phase 2)
  - [ ] Inventory CSV/Excel bulk update (upsert by SKU)
  - [ ] Product variants (size, color, grade) with separate stock
  - [ ] Low-stock alerts + automatic reorder recommendations
- **Revenue & retention**
  - [ ] Vendor earnings dashboard + wallet balance
  - [ ] Withdrawal requests (M-Pesa/bank) with admin approval
  - [ ] Commission engine + payout scheduling
  - [ ] Discount/coupon codes and flash sales
- **Marketplace discoverability**
  - [ ] Public vendor store pages with SEO metadata and share buttons
  - [ ] Product detail pages with reviews and Q&A
  - [ ] Wishlist & "save for later" for parents
  - [ ] Cross-sell and "frequently bought together" bundles
- **Operations**
  - [ ] Vendor notification center (new orders, reviews, low stock)
  - [ ] Packing list / order label printing
  - [ ] Delivery method selection (pickup, school drop-off, home delivery)

### Phase 5: School ERP Module (10x thinking)

Goal: evolve the school portal from record-keeping into the operating system of a Tanzanian school — attendance, fees, communication, and parent engagement in one place.

- **Bulk operations & onboarding**
  - [ ] CSV import for students, staff, and classes
  - [ ] Parent invitation flow via SMS/email with magic-link onboarding
- **Fee management**
  - [ ] Fee structure templates per grade/class
  - [ ] Bulk fee assignment to entire classes
  - [ ] Automated SMS/WhatsApp fee reminders (3 days before, on due date, after due)
  - [ ] Online school-fee payment via ClickPesa linked to student accounts
- **Parent/guardian experience**
  - [ ] Parent portal `/parents/portal` to view children, attendance, fees, announcements
  - [ ] Parent mobile view optimized for low-bandwidth devices
  - [ ] Multi-child support and guardian relationship tracking
- **Academic & HR**
  - [ ] Report cards + transcript generation per term
  - [ ] Staff payroll + attendance tracking
  - [ ] Substitute teacher scheduling
- **Assets & communication**
  - [ ] Library and asset tracking with check-out/check-in
  - [ ] Bulk announcements via SMS/WhatsApp/email with delivery status
  - [ ] School supply lists linked to marketplace (schools earn commission)
- **Polish**
  - [ ] Full Swahili translation
  - [ ] RBAC hardening (permissions per school role)
  - [ ] Audit log for all school portal actions

## Known Tool Versions

- Node.js: `v24.11.1`
- npm: `11.18.0`
- Supabase CLI: `2.109.0`
- Vercel CLI: `54.20.1`
- GitHub CLI: `2.96.0`
