# Shuleyetu Master Roadmap

A living document tracking all planned improvements across 10 phases.
Current status: **Phase 1 — Foundation** (in progress)

---

## Phase 1 — Foundation (Accessibility, Polish, Base UX)

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 1.1 | Add visible `:focus-visible` rings on all interactive elements | `pending` | `globals.css`, all pages |
| 1.2 | Keyboard navigation audit (Tab/Enter/Arrow on filters, dropdowns, modals) | `pending` | All interactive components |
| 1.3 | Add `aria-label` to icon-only buttons and `aria-live` to toasts | `pending` | `Toast.tsx`, `MobileNav.tsx`, etc. |
| 1.4 | Color contrast audit & fixes (axe-core / Lighthouse) | `pending` | Tailwind config, all pages |
| 1.5 | Loading button states on every submit form | `pending` | All form pages |
| 1.6 | Skeleton-to-content micro-animations (staggered reveals) | `pending` | `framer-motion` integration |
| 1.7 | Interactive empty states with CTAs | `pending` | `EmptyState.tsx` |
| 1.8 | Page transition animations (route change) | `pending` | Layout wrapper |
| 1.9 | Better mobile bottom nav with active indicators | `pending` | `MobileNav.tsx` |
| 1.10 | Breadcrumb navigation component | `pending` | New component + page integration |

---

## Phase 2 — Core UX (Shopping Cart, Images, Wishlist)

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 2.1 | Add `image_url` column to `inventory` table + migration | `pending` | Supabase migration |
| 2.2 | Image upload component (Cloudinary or base64 for MVP) | `pending` | `ImageUpload.tsx` upgrade |
| 2.3 | Display product thumbnails on vendor pages, cards, cart | `pending` | `vendors/[id]`, `orders/new` |
| 2.4 | Persistent shopping cart (localStorage for guests, Supabase for logged-in) | `pending` | New `CartContext` |
| 2.5 | Cart drawer/sheet UI | `pending` | New component |
| 2.6 | Wishlist / "Save for later" | `pending` | `WishlistContext` + UI |
| 2.7 | Toast upgrade: progress bars, persistent action toasts | `pending` | `Toast.tsx` |
| 2.8 | Global Cmd+K command palette | `pending` | New `CommandPalette` component |

---

## Phase 3 — Vendor Power-Up (Analytics, Bulk Ops, Invoices)

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 3.1 | Revenue analytics page (`/dashboard/analytics`) | `pending` | New page + charts |
| 3.2 | PDF invoice generation per order (`jspdf`) | `pending` | New API route + download |
| 3.3 | Print-friendly packing slips | `pending` | Print stylesheet |
| 3.4 | Inventory CSV export | `pending` | API route |
| 3.5 | Inventory CSV bulk import | `pending` | Upload + parse + validate |
| 3.6 | Multi-user vendor roles (`owner`, `manager`, `staff`) | `pending` | RLS + UI updates |
| 3.7 | Rich vendor public profile (hours, contact, social) | `pending` | `vendors/[id]` upgrade |
| 3.8 | Inventory variants (size/color for uniforms) | `pending` | Schema + UI |
| 3.9 | Low-stock alerts (dashboard banner + email/SMS) | `pending` | Trigger + notification |

---

## Phase 4 — Mobile & PWA (Offline, SMS, Bottom Nav)

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 4.1 | PWA service worker + manifest upgrade | `pending` | `manifest.json`, SW |
| 4.2 | Offline asset caching | `pending` | Workbox / custom SW |
| 4.3 | Offline order queue (sync when reconnected) | `pending` | Background sync API |
| 4.4 | SMS order confirmations (Africa's Talking) | `pending` | New API route |
| 4.5 | SMS payment reminders | `pending` | Cron + API route |
| 4.6 | Tap-to-call vendor (`tel:` links) | `pending` | `vendors/[id]` |
| 4.7 | WhatsApp Business share (`wa.me` links) | `pending` | Share buttons |
| 4.8 | 2G/3G "Lite mode" toggle (disable animations) | `pending` | Settings + context |
| 4.9 | USSD fallback exploration (order status via shortcode) | `pending` | Research |

---

## Phase 5 — Payments & Notifications

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 5.1 | Partial payments / deposits (50% upfront) | `pending` | Schema + ClickPesa flow |
| 5.2 | Delivery/pickup options enum + Google Maps | `pending` | Schema + UI |
| 5.3 | Order notes / parent-vendor messaging | `pending` | `messages` table + UI |
| 5.4 | Order cancellation request flow | `pending` | Schema + UI |
| 5.5 | Recurring orders ("Reorder last year's set") | `pending` | UI + duplicate logic |
| 5.6 | Discount codes / promo codes table | `pending` | Schema + validation |

---

## Phase 6 — Trust & Discovery (Ratings, Reviews, Verification)

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 6.1 | Vendor ratings & reviews schema | `pending` | Supabase migration |
| 6.2 | Review submission flow (post-order) | `pending` | New UI + API |
| 6.3 | Star ratings on vendor cards | `pending` | `vendors` page |
| 6.4 | "Verified vendor" badge (admin-curated) | `pending` | Schema + badge component |
| 6.5 | Price comparison tool (same item across vendors) | `pending` | Search + compare UI |
| 6.6 | Featured vendors carousel on homepage | `pending` | Homepage section |

---

## Phase 7 — Growth & SEO

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 7.1 | Dynamic OG images (`@vercel/og`) | `pending` | API route |
| 7.2 | Blog content hub expansion | `pending` | `/blog` + CMS-like flow |
| 7.3 | School directory with required item lists | `pending` | New pages + data |
| 7.4 | Newsletter signup (Resend/Mailchimp) | `pending` | Footer + API |
| 7.5 | Referral program (share → discount) | `pending` | Schema + UI |
| 7.6 | Google My Business link integration | `pending` | Vendor profile |

---

## Phase 8 — Admin & Operations

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 8.1 | Admin audit log (`audit_logs` table) | `pending` | Migration + API |
| 8.2 | Vendor approval workflow (sign up → admin approve) | `pending` | Schema + admin UI |
| 8.3 | Admin dashboard metrics (GMV, active vendors, etc.) | `pending` | `/admin` upgrade |
| 8.4 | Content moderation flags | `pending` | Schema + review queue |
| 8.5 | Automated payout settlement tracking | `pending` | Cron + tracking |

---

## Phase 9 — Performance & Architecture

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 9.1 | Migrate vendor/vendors pages to React Server Components | `pending` | Page refactor |
| 9.2 | ISR + edge caching on static pages | `pending` | `revalidate` config |
| 9.3 | Database indexes on hot queries | `pending` | Migration |
| 9.4 | Redis caching for vendor list / popular items | `pending` | `@upstash/redis` |
| 9.5 | Bundle analysis + lazy-load Sentry | `pending` | `next-bundle-analyzer` |
| 9.6 | Image CDN integration (Cloudinary) | `pending` | Image component |
| 9.7 | API rate limiting on all routes | `pending` | Middleware / route guards |
| 9.8 | Zod validation on all API inputs | `pending` | Schema validation |
| 9.9 | RLS policy audit and hardening | `pending` | SQL review |
| 9.10 | Next.js 15 + React 19 upgrade | `pending` | Package updates |

---

## Phase 10 — Delight & Differentiation

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 10.1 | Back-to-school countdown banner | `pending` | Homepage seasonal |
| 10.2 | School checklist generator | `pending` | New page + wizard |
| 10.3 | Order status timeline (visual stepper) | `pending` | `orders/track` upgrade |
| 10.4 | Loyalty points system | `pending` | Schema + UI |
| 10.5 | Seasonal UI theme switching | `pending` | CSS variables |
| 10.6 | One-tap share (Web Share API) | `pending` | Share buttons |
| 10.7 | E2E test coverage for critical path | `pending` | Playwright |
| 10.8 | Backup & disaster recovery documentation | `pending` | Docs |

---

## How We Work

1. One phase at a time. No skipping ahead.
2. Each task gets a commit. Small, reviewable PRs.
3. Update this file (`ROADMAP.md`) as tasks complete.
4. After each phase, run build + tests before merging.
5. Update `FEATURES.md` and `README.md` when user-facing features ship.

---

*Last updated: 2026-06-16*
*Phase: 1 — Foundation*
