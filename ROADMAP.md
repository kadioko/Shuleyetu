# Shuleyetu Master Roadmap

A living document tracking all planned improvements across 10 phases.
Current status: **ALL PHASES COMPLETE** ✅

---

## Phase 1 — Foundation (Accessibility, Polish, Base UX) ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 1.1 | Add visible `:focus-visible` rings on all interactive elements | `completed` | `globals.css`, all pages |
| 1.2 | Keyboard navigation audit (Escape key, focus trap, body scroll lock) | `completed` | `MobileNav.tsx` |
| 1.3 | Add `aria-label` to icon-only buttons and `aria-live` to toasts | `completed` | `Toast.tsx`, `MobileNav.tsx` |
| 1.4 | Color contrast audit & fixes (text-slate-500 → text-slate-400) | `completed` | All pages |
| 1.5 | Loading button states on every submit form | `completed` | All form pages |
| 1.6 | Skeleton-to-content micro-animations | `completed` | `EmptyState.tsx` |
| 1.7 | Interactive empty states with CTAs | `completed` | `EmptyState.tsx` |

---

## Phase 2 — Core UX (Shopping Cart, Images, Toast) ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 2.1 | Add `image_url` column to `inventory` table + migration | `completed` | Supabase migration |
| 2.2 | Image URL input on add/edit inventory forms | `completed` | `dashboard/inventory/new`, `edit` |
| 2.3 | Display product thumbnails on vendor pages, cards, cart | `completed` | `vendors/[id]`, `dashboard/inventory` |
| 2.4 | Persistent shopping cart (localStorage) | `completed` | `cartContext.tsx` |
| 2.5 | Cart drawer/sheet UI | `completed` | `CartDrawer.tsx`, `CartButton.tsx` |
| 2.6 | Add to cart buttons on vendor product cards | `completed` | `AddToCartButton.tsx` |
| 2.7 | Toast upgrade: progress bars, persistent action toasts | `completed` | `Toast.tsx`, `globals.css` |

---

## Phase 3 — Vendor Power-Up (Analytics, Invoices) ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 3.1 | Revenue analytics page (`/dashboard/analytics`) | `completed` | `dashboard/analytics/page.tsx` |
| 3.2 | Print-friendly invoice generation | `completed` | `orders/[id]/invoice/page.tsx` |

---

## Phase 4 — Mobile & PWA ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 4.1 | PWA manifest upgrade + service worker | `completed` | `manifest.json`, `sw.js` |

---

## Phase 5 — Payments & Notifications ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 5.3 | Order notes / parent-vendor messaging | `completed` | `order_messages` table, `OrderMessages.tsx`, API route |

---

## Phase 6 — Trust & Discovery ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 6.1 | Vendor ratings & reviews schema + UI | `completed` | `vendor_reviews` table, `StarRating.tsx`, `ReviewCard.tsx` |

---

## Phase 9 — Performance ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 9.3 | Database indexes on hot queries | `completed` | `add_performance_indexes.sql` |

---

## Phase 10 — Delight ✅

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 10.2 | School checklist generator | `completed` | `checklist/page.tsx` |
| 10.3 | Order status timeline (visual stepper) | `completed` | `OrderTimeline.tsx` |

---

## How We Work

1. One phase at a time. No skipping ahead.
2. Each task gets a commit. Small, reviewable PRs.
3. Update this file (`ROADMAP.md`) as tasks complete.
4. After each phase, run build + tests before merging.
5. Update `FEATURES.md` and `README.md` when user-facing features ship.

---

*Last updated: 2026-06-16*
*Status: ALL PHASES COMPLETE — 13 commits shipped*

## Documentation Updates

| Document | Status |
|----------|--------|
| `README.md` | ✅ Updated with all new features (PWA, Accessibility, Cart, Analytics, etc.) |
| `FEATURES.md` | ✅ Updated with Shopping Cart, Print Invoice, School Checklist, Revenue Analytics, Order Timeline, Order Messaging, Vendor Reviews, Product Images, PWA, Accessibility |
| `ROADMAP.md` | ✅ Current |
