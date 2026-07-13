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

### Phase 1: Reliability & Scale (foundation)

- [ ] Global error boundary + Sentry `global-error.js`
- [ ] Zod validation on every API route
- [ ] Rate limiting per route
- [ ] Expand `/status` health dashboard
- [ ] Supabase client reuse / connection pooling audit
- [ ] Background job queue for emails/webhooks
- [ ] E2E tests for order → payment → fulfillment
- [ ] Load test the school portal

### Phase 2: Product + Growth Audit

- [ ] Heuristic UX audit (mobile-first)
- [ ] Propose 10 high-impact features with effort/impact
- [ ] Implement top 3 features end-to-end

### Phase 3: Payments & Trust

- [ ] ClickPesa retries + idempotency
- [ ] Partial refunds + admin UI
- [ ] PDF invoice auto-generation
- [ ] Order dispute/escrow flow
- [ ] Vendor KYC + verification badges
- [ ] Transaction audit log + admin review UI

### Phase 4: Vendor + Marketplace

- [ ] Vendor analytics dashboard
- [ ] Inventory CSV/Excel bulk import
- [ ] Product variants + stock alerts
- [ ] Discount/coupon codes
- [ ] Vendor payout tracking
- [ ] Public vendor store pages
- [ ] Low-stock notifications

### Phase 5: School ERP Module

- [ ] Fee structure templates
- [ ] SMS/WhatsApp fee reminders
- [ ] Parent/guardian accounts
- [ ] Report cards + transcripts
- [ ] Staff payroll + attendance
- [ ] Library and asset tracking
- [ ] Parent mobile view
- [ ] Full Swahili translation + RBAC hardening

## Known Tool Versions

- Node.js: `v24.11.1`
- npm: `11.18.0`
- Supabase CLI: `2.109.0`
- Vercel CLI: `54.20.1`
- GitHub CLI: `2.96.0`
