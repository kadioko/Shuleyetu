# Shuleyetu

Tanzanian school supply marketplace that connects parents, schools, and
stationery vendors for textbooks, uniforms, and school materials — plus a
school management portal for classes, students, staff, attendance, fees, and
announcements.

**🚀 Live in Production**: <https://shuleyetu-web.vercel.app>

This repository currently contains a web app (`shuleyetu-web`) plus a Supabase SQL migration defining the core marketplace schema.

---

## Quick Start

- **Production URL**: <https://shuleyetu-web.vercel.app>
- **Test Customer**: `customer@test.com` / TestPassword123!
- **Test Vendor**: `vendor@test.com` / TestPassword123!
- **Test Admin**: `admin@test.com` / TestPassword123!
- **Language**: Switch between English (EN) and Swahili (SW) using the toggle button

---

## Deployment

- **Platform**: Vercel (Free Tier)
- **Production URL**: <https://shuleyetu-web.vercel.app>
- **Database**: Supabase (PostgreSQL)
- **Status**: ✅ Live and Production Ready
- **Build Status**: ✅ Passing
- **CI/CD**: GitHub Actions (automated testing and deployment, Supabase keepalive)

---

## Tech stack

- **Frontend**: Next.js 14.2.35 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with dark/light theme toggle
- **Backend / DB**: Supabase (PostgreSQL, SQL migrations, Row Level Security)
- **Auth & APIs**: Supabase client (`@supabase/supabase-js`), JWT-based authentication
- **Payments**: ClickPesa (sandbox integration with USSD push, webhook signature verification)
- **Testing**: Vitest for unit tests, Jest for integration tests, Playwright for E2E tests
- **Security**: HTTP security headers, CSRF protection, secure token-based public order access, Rate limiting
- **Error Tracking**: Sentry for error monitoring and performance tracking
- **Monitoring**: Health check endpoint, status page, uptime monitoring, GitHub Actions keepalive
- **PWA**: Service worker, offline support, installable app experience
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support, focus-visible rings
- **Performance**: Database indexes, optimized queries, image optimization

---

## Project structure

- `shuleyetu-web/`
  - Next.js app (App Router, `src/app`)
  - **Pages**: vendors, orders, vendor dashboard, admin panel, school portal, order tracking, analytics
  - **API routes**: admin management, ClickPesa payment integration, public order access, order messaging
  - **Shared utilities**: `src/lib/` (auth helpers, API utils, logging, validation)
  - **Tests**: unit tests with Vitest for core business logic
- `supabase/migrations/`
  - Database schema, RLS policies, auth tables, and stored procedures
  - 11 migration files covering vendors, inventory, orders, auth, admin
    features, reviews, analytics, performance indexes, contact messages, and
    the school management portal

---

## Features implemented

### Home & marketing

- **Landing page**: `/`
  - Modern hero section with animated badge and gradient backgrounds.
  - Stats bar showing vendors, products, regions, and support availability.
  - Feature cards for parents, vendors, and schools with icons.
  - How-it-works section with 3-step guide.
  - Call-to-action section for getting started.
- **Why Shuleyetu**: `/why-shuleyetu`
  - Simple marketing page describing the problem and how Shuleyetu helps.
  - Includes screenshot placeholders for the vendor dashboard, parent order flow, and ClickPesa payment.
- **School Checklist Generator**: `/checklist`
  - Interactive back-to-school checklist for Primary, Secondary, and High School.
  - Pre-populated items by grade level and category.
  - Progress tracking with visual progress bar.
  - Custom item addition and removal.
  - Print-friendly format.

### Vendors

- **List vendors**: `/vendors`
  - Reads from the Supabase `vendors` table.
  - Shows vendor name, description, and Tanzanian location fields (region/district/ward).
  - Search and filter by region.
- **Vendor detail & inventory**: `/vendors/[vendorId]`
  - Loads a single vendor plus items from the `inventory` table, filtered by `vendor_id`.
  - Displays item name, category, price in TZS, stock quantity, and product images.
  - **Vendor reviews**: Customers can view and submit ratings and reviews.
  - Add to cart functionality for logged-in users.

### Shopping Cart

- **Persistent cart** with localStorage for guests and Supabase for logged-in users.
- **Cart drawer**: Slide-out panel showing items with images, quantities, and totals.
- **Per-vendor grouping**: Organized by vendor with individual checkout links.
- **Quantity controls**: +/- buttons to adjust item quantities.
- **Remove items**: One-click removal from cart.
- **Cart badge**: Live item count in header navigation.

### Orders

- **Create order**: `/orders/new`
  - Selects a vendor (from `vendors`).
  - Loads that vendor's inventory and lets you choose quantities per item.
  - Captures customer details: parent/guardian name, phone, optional student and school.
  - Writes to Supabase:
    - `orders` table for the order header
    - `order_items` table for each line item
  - Stores total amount in TZS on the order.

- **Orders list**: `/orders`
  - Landing page with options to track orders or access vendor dashboard.
  - Clear guidance for parents vs. vendors.

- **Track order**: `/orders/track`
  - Public order tracking by order ID and access token (no login required).
  - Supports pasting order links or entering credentials manually.
  - Shows order details, line items, payment status, and vendor information.
  - Input validation with real-time feedback and disabled buttons until valid.

- **Order detail**: `/orders/[orderId]`
  - Shows a single order, joined with vendor data and all of its `order_items`.
  - Displays each line item with quantity, item name, category, unit price, and line total.
  - **Order status timeline**: Visual stepper showing order progress (placed → awaiting_payment → paid → processing → shipped → completed).
  - **Order messaging**: Chat interface for parent-vendor communication.
  - **Print invoice**: Link to print-friendly invoice page.

- **ClickPesa payment**: `/orders/pay/[orderId]`
  - Initiates a mobile money USSD payment via a ClickPesa API route.
  - Requires order ID and public access token for security.
  - Lets you refresh payment status from ClickPesa and see it reflected on the order.
  - Webhook integration with signature verification for automatic status updates.

- **Print Invoice**: `/orders/[orderId]/invoice`
  - Professional print-friendly invoice layout.
  - Vendor information, itemized products, totals.
  - Optimized for printing and PDF generation.

### Vendor dashboard

- **Vendor auth**: `/auth/login`
  - Email/password login and sign-up backed by Supabase Auth.
  - Maps logged-in users to vendors via a `vendor_users` linking table.
  - Note: Admins must link users to vendors using the admin panel.
- **Dashboard overview**: `/dashboard`
  - **Analytics cards**: Total sales (TZS), paid orders, pending orders, completed orders.
  - **Quick stats**: Inventory count, total orders with navigation links.
  - **Recent orders table**: Last 5 orders with customer, amount, status, payment, date.
  - **Quick links**: View public page, track orders, manage inventory, view all orders.
- **Revenue Analytics**: `/dashboard/analytics`
  - Sales trend line chart with period filters (7d/30d/90d/all).
  - Payment method distribution pie chart.
  - Order status bar chart.
  - Key metrics: conversion rate, average order value, top products.
- **Inventory management**: `/dashboard/inventory`
  - Lists items for the logged-in vendor with category, price in TZS, stock, and product images.
  - Supports creating new items (`/dashboard/inventory/new`) and editing existing ones (`/dashboard/inventory/[itemId]/edit`).
  - Cloudinary image upload integration.
- **Vendor orders view**: `/dashboard/orders`
  - Shows orders for the logged-in vendor with filters (status, date range).
  - Allows updating the `status` of each order from a dropdown.
  - View order details with customer information and messaging.

### Admin panel

- **Admin dashboard**: `/admin`
  - Protected by role-based access control (requires `admin` role in `user_roles` table).
  - **Vendor user management**: Link/unlink users to vendors, view all vendor-user associations.
  - **Admin management**: Grant/revoke admin privileges, view all admins.
  - **Vendor list**: View all registered vendors.
  - Uses JWT bearer token authentication for API calls.
  - Structured logging and consistent error handling across all admin APIs.

### School management portal

- **School portal**: `/schools/portal`
  - Protected by school-based access control (requires membership in
    `school_users` table).
  - On first visit, a school admin can create a school and automatically
    become the linked administrator.
  - **Dashboard overview**: Stats for students, staff, classes, fees,
    attendance, and announcements.
  - **Demo data loader**: One-click sample dataset for showcasing the portal.
  - **Classes**: Create and manage school classes (`school_classes`).
  - **Students**: Add and filter student records (`school_students`).
  - **Staff**: Add and manage school staff and teachers (`school_staff`).
  - **Attendance**: Mark daily attendance by class and date
    (`school_attendance`).
  - **Fees**: Create and track school fees, with automatic paid/balance
    calculations (`school_fees`, `school_fee_payments`).
  - **Announcements**: Publish school-wide announcements by audience
    (`school_announcements`).
  - **Reports**: Daily attendance summaries, fee collection totals, and
    enrollment by class.
  - **Settings**: Update school profile details.
  - **Role-based tabs**: Tabs filtered by `school_users` role (`admin`,
    `teacher`, `staff`).
  - Uses JWT bearer token authentication for API calls under
    `/api/schools/*`.

---

## Getting around the app

1. **Home** – visit `/` to read what Shuleyetu is and choose where to go next.
2. **Browse vendors** – go to `/vendors` to find a stationery vendor for your school or region, then open their detail page.
3. **Create an order** – use `/orders/new` to pick a vendor, choose textbooks/uniforms/stationery, and fill in student & school details.
4. **Track your order** – use `/orders/track` to check order status, payment status, and details without logging in (requires order link or ID + token).
5. **Pay via ClickPesa** – from an order, open `/orders/pay/[orderId]` to start a mobile money payment and refresh its status.
6. **Vendor dashboard** – log in at `/auth/login` and use `/dashboard`, `/dashboard/inventory`, and `/dashboard/orders` to manage items and track orders for a vendor.
7. **Admin panel** – admins can access `/admin` to manage vendor-user links and admin roles.
8. **School portal** – log in and visit `/schools/portal` to create or
   manage a school (classes, students, staff, attendance, fees,
   announcements). Use the **Reports** tab for daily summaries, **Settings**
   to update school details, and the **Load demo data** button to explore
   sample data.
9. **School checklist** – use `/checklist` to generate a back-to-school shopping list.

---

## Database schema (Supabase)

Defined in `supabase/migrations/`:

- **Enums**
  - `item_category`: `textbook | uniform | stationery | other`
  - `order_status`: `pending | awaiting_payment | paid | processing | shipped | completed | cancelled | failed`
  - `payment_status`: `unpaid | pending | paid | refunded | failed`

- **`vendors`**
  - Metadata for stationery shops / school supply vendors.
  - Tanzanian context fields: region, district, ward, street address, optional coordinates.

- **`inventory`**
  - Items sold by vendors (textbooks, uniforms, stationery).
  - References `vendors(id)` via `vendor_id`.
  - Stores `price_tzs`, `stock_quantity`, `category`, and optional metadata.
  - `image_url` field for product photos (Cloudinary).

- **`orders`**
  - One row per checkout.
  - References `vendors(id)`.
  - Captures customer and school context plus `total_amount_tzs`.
  - Tracks `status` and `payment_status` for the order lifecycle.
  - Includes `public_access_token` (UUID) for secure public order tracking without authentication.
  - Includes fields for ClickPesa integration (provider name, provider reference, transaction id, raw payload).

- **`vendor_users`**
  - Links Supabase Auth users to vendors.
  - Allows multiple users per vendor and multiple vendors per user.
  - Used by vendor dashboard to determine which vendor's data to show.

- **`order_items`**
  - Line items for each order.
  - References `orders(id)` and `inventory(id)`.
  - Stores quantity, unit price, and line total.

- **`user_roles`**
  - Role assignments for access control.
  - `admin` role grants access to admin panel.

- **`vendor_reviews`**
  - Customer ratings and reviews for vendors.
  - References `vendors(id)` and auth users.
  - Stores rating (1-5 stars), comment, and timestamp.

- **`order_messages`**
  - Parent-vendor communication per order.
  - References `orders(id)` and auth users.
  - Stores message content, sender role, and timestamp.

- **`contact_messages`**
  - Contact form submissions from the public `/contact` page.
  - Stores name, email, subject, message, and read status.
  - Admin-only read access via `user_roles`.

- **`schools` and `school_users`**
  - `schools` stores general school information (name, address, region,
    district, contact).
  - `school_users` links Supabase auth users to a school with a role
    (`admin`, `staff`, `teacher`, `student`).

- **`school_classes`, `school_students`, `school_staff`**
  - `school_classes`: classes within a school.
  - `school_students`: student profiles with class assignment and status.
  - `school_staff`: teacher/administrator profiles with role and subject.

- **`school_attendance`, `school_fees`, `school_fee_payments`, `school_announcements`**
  - `school_attendance`: daily attendance records per student.
  - `school_fees`: invoices with amount, due date, status, and balance.
  - `school_fee_payments`: individual payments against a fee invoice.
  - `school_announcements`: school-wide announcements by audience.

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ClickPesa
CLICKPESA_API_KEY=your-api-key
CLICKPESA_API_SECRET=your-api-secret
CLICKPESA_WEBHOOK_SECRET=your-webhook-secret

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Cloudinary (image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Running locally

```bash
cd shuleyetu-web
npm install
npm run dev
```

Open <http://localhost:3000>.

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

---

## Useful links

- **Production**: <https://shuleyetu-web.vercel.app>
- **Supabase Dashboard**: <https://app.supabase.com>
- **Vercel Dashboard**: <https://vercel.com/dashboard>
- **Sentry Dashboard**: <https://sentry.io> (for error tracking)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and contribution process.

---

## License

MIT License - see LICENSE file for details.
#   T r i g g e r   b u i l d 
 
 