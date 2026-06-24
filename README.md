# Mutual

E-commerce platform for **phone cases & mobile accessories** serving the **UAE / GCC**
market — a customer storefront, an owner admin dashboard, and a delivery-staff
portal, built on **Next.js + a custom Express/MySQL API**.

> **Status: ✅ Completed & Published — live in production.**
> Frontend on **Vercel**, backend API on **Render**, database on **AWS RDS (MySQL)**.
> Live since 2026-06-17. Arabic/RTL is built but disabled pending copy polish.

🔗 **Live:** https://mutual-cases.vercel.app

---

## Structure

```
Mutual/
├─ backend/      Express + MySQL API (auth, products, orders, admin, delivery, …)
└─ frontend/     Next.js app — storefront (/), admin (/admin), delivery (/delivery)
```

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind v4, self-hosted fonts.
- **Backend:** Node/Express 5, MySQL (`mysql2`), Zod validation, JWT auth,
  Google OAuth, Resend email, Cloudinary uploads, Winston logging.
- **Security:** server-side RBAC + staff-role permissions, server-authoritative
  pricing, `helmet` security headers, per-IP rate limiting, parameterized queries.
- **Hosting:** Vercel (frontend) · Render (API) · AWS RDS (MySQL).

## Three areas

| Area | URL | Who | Auth |
|---|---|---|---|
| Storefront | `/` | Customers | Google sign-in (optional to browse) |
| Admin dashboard | `/admin/*` | Owner/staff | Google + `role=admin` (DB-verified) |
| Delivery portal | `/delivery/*` | Drivers | Admin-generated access code |

---

## Features — shipped & live

Everything below is implemented and running in production. Pages are grouped by
the three areas; ✅ marks a delivered page/feature.

### 1. Storefront (`/`) — customer-facing

| Page | Route | What it does |
|---|---|---|
| ✅ Home / landing | `/` | Hero, "More than just a Cover" intro, About, feature highlights, how-it-works steps, what-makes-us-unique, and a discover-products strip. |
| ✅ Products catalog | `/products` | DB-driven grid with filter sidebar (model, edition, category, type), active-filter tags, clear-filters, loading skeletons, empty state. |
| ✅ Product details | `/products/[id]` | Image gallery/slider, price, category, specs, quantity counter, add-to-cart, like, back-in-stock notify when sold out. |
| ✅ Custom It | `/custom-it` | "Design your own cover" request form (submits a custom request to the admin queue). |
| ✅ Cart | `/cart` | Line items, quantity edit, remove, running total, proceed-to-checkout (cart persists per signed-in user). |
| ✅ Checkout | `/checkout` | GCC country→city address selection, optional geolocation, gift/note, discount-code entry, server-authoritative totals, order placement. |
| ✅ Order success | `/order-success` | Confirmation with order number + summary after a successful checkout. |
| ✅ Track order | `/track-order` | Look up an order by number to see status, carrier/tracking, and ETA. |
| ✅ My Orders | `/my-orders` | Authenticated order history with line items and per-product review forms. |
| ✅ Order journey | `/order-journey` | Visual order-status stepper / explainer. |
| ✅ Liked / wishlist | `/liked` | Saved products for the signed-in user. |
| ✅ Why us | `/why-us` | Brand/value proposition page. |
| ✅ About | `/about` | About-the-brand content page. |
| ✅ Privacy policy | `/privacy-policy` | Legal content page. |
| ✅ Terms | `/terms` | Legal content page. |
| ✅ 404 / not-found | `*` | Graceful catch-all not-found page; route-level error boundaries throughout. |

**Storefront cross-cutting:** Google sign-in (optional for browsing, required to
order), navbar with cart + liked + sign-in, reviews (submit + display with star
ratings), themed footer with contact + quick links, global error listeners and
error/loading states.

### 2. Admin dashboard (`/admin`) — owner & staff

Collapsible grouped sidebar shell with breadcrumbs, dark-mode toggle, and a live
unread-notifications badge. Server-side `role=admin` gate; staff-role permissions
hide sections a role can't act on.

| Page | Route | What it does |
|---|---|---|
| ✅ Overview | `/admin` | KPIs, recent orders, and pending-action callouts (the store at a glance). |
| ✅ Orders | `/admin/orders` | List + full order detail, status history, status changes, driver assignment. |
| ✅ Invoice / packing slip | `/admin/orders/[orderNumber]/invoice` | Printable VAT invoice & packing slip. |
| ✅ Products | `/admin/products` | Catalog management — create, edit, remove (Cloudinary image uploads). |
| ✅ Inventory | `/admin/inventory` | Stock levels, reserved/available units, low-stock thresholds, adjustments + audit log. |
| ✅ Custom Requests | `/admin/custom-requests` | Review and advance "design your own" submissions. |
| ✅ Reviews | `/admin/reviews` | Moderation queue — approve, reject, reply, flag, delete; status counts. |
| ✅ Returns / RMA | `/admin/returns` | Approve/reject returns, restock, issue refund or store credit. |
| ✅ Discounts | `/admin/discounts` | Create/manage discount codes — limits, conditions, expiry, usage tracking. |
| ✅ Customers | `/admin/customers` | Account management — view, edit details, change role, delete. |
| ✅ Delivery staff | `/admin/delivery` | Manage drivers — contact, vehicle, coverage zone, availability, access codes. |
| ✅ Reports | `/admin/reports` | Sales, VAT, customers, products, discounts + row-level detail reports, CSV export. |
| ✅ Notifications | `/admin/notifications` | Themed notification center derived from pending items; mark-as-seen. |
| ✅ Staff & access | `/admin/staff` | Granular staff roles/permissions + activity/audit log. |
| ✅ Settings | `/admin/settings` | Brand, theme, customization, storefront config, integrations status. |

**Staff roles (server-enforced):** `owner` (full), `manager` (all but staff/role
management), `fulfillment` (orders/delivery/inventory/returns), `support`
(reviews/customers/returns/orders). Reads stay open to any admin; writes are gated
per-area.

### 3. Delivery portal (`/delivery`) — drivers

| Page | Route | What it does |
|---|---|---|
| ✅ Driver login | `/delivery/login` | Sign in with an admin-generated access code. |
| ✅ Driver dashboard | `/delivery` | Own-orders-only view, delivery sub-status flow (auto-syncs the main order status), driver profile + availability toggle. |

### Backend API surface

Express/MySQL API mounted at `/products`, `/cart`, `/liked`, `/custom`, `/orders`,
`/admin`, `/reviews`, `/settings`, `/delivery`, `/returns`, `/discounts`, plus
`/api/auth` (Google OAuth → JWT) and `/health`. Every mutating route validates
input with Zod and enforces auth/role server-side; pricing and discounts are
recomputed from trusted DB data on every order.

---

## Roadmap (post-launch)

Products variants, multi-currency, analytics expansion, enabling Arabic/RTL, and
live payment/shipping/WhatsApp integrations (provider adapters are stubbed and
config-gated).

---

## Setup (local / dev)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # then fill in real values (see below)
npm start
```

### Frontend
```bash
cd frontend
npm install
# create .env with NEXT_PUBLIC_API_BASE_URL + NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev   # http://localhost:3001
```

### Required environment variables

**`backend/.env`**
```
DB_HOST=...            DB_USER=...           DB_PASSWORD=...       DB_NAME=...
GOOGLE_CLIENT_ID=...   JWT_SECRET=<long random string>
# optional (features degrade gracefully without them):
RESEND_API_KEY=...     EMAIL_FROM="Mutual <orders@yourdomain.com>"
CLOUDINARY_CLOUD_NAME=...  CLOUDINARY_API_KEY=...  CLOUDINARY_API_SECRET=...
```

**`frontend/.env`**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### Database

Schema lives in `backend/schema.sql`; incremental changes are idempotent
migration scripts in `backend/scripts/` (`migrate*.js`). Seed data via
`seed*.js`. Run a migration with `node scripts/<name>.js`.
