# Mutual

E-commerce platform for **phone cases & mobile accessories** serving the **UAE / GCC**
market — a customer storefront, an owner admin dashboard, and a delivery-staff
portal, built on **Next.js + a custom Express/MySQL API**.

> Currently on the **`dev`** branch. Database runs on AWS RDS; production
> deployment comes later.

---

## Structure

```
Mutual/
├─ backend/      Express + MySQL API (auth, products, orders, admin, delivery, …)
├─ frontend/     Next.js app — storefront (/), admin (/admin), delivery (/delivery)
├─ ARCHITECTURE.md        Full technical map (schema, API, pages, infra)
├─ FEATURES-REVIEW.md     Feature-by-feature QA / review checklist
├─ The-Idea.md            Reuse/productization strategy (options analysis)
└─ GENERIC-ADMIN-DESIGN.md  Design for a schema-driven admin engine
```

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind v4, self-hosted fonts.
- **Backend:** Node/Express 5, MySQL (`mysql2`), Zod validation, JWT auth,
  Google OAuth, Resend email, Cloudinary uploads, Winston logging.

## Three areas

| Area | URL | Who | Auth |
|---|---|---|---|
| Storefront | `/` | Customers | Google sign-in (optional to browse) |
| Admin dashboard | `/admin/*` | Owner/staff | Google + `role=admin` (DB-verified) |
| Delivery portal | `/delivery/*` | Drivers | Admin-generated access code |

---

## Progress

**Done**
- Storefront: catalog + DB-driven filters, cart, checkout (GCC country→city,
  optional geolocation), order success, track order, my-orders, liked, custom-it,
  reviews, back-in-stock notify.
- Admin: overview KPIs + pending actions, orders (full detail, status history,
  driver assignment, VAT invoice/packing slip), inventory (adjustments,
  thresholds, audit log), products, reviews moderation, customers (full account
  management), delivery staff, settings (brand/theme/customization/storefront),
  Cloudinary logo upload.
- Delivery portal: access-code login, own-orders-only view, delivery sub-status
  flow (auto-syncs main order status), driver profile + availability.
- Cross-cutting: role-scoped auth (admin/delivery), themed admin notifications,
  smooth scrolling, generic admin UI primitives.

**Next**
Reserve-stock-on-order, products/variants, returns/RMA, discounts/promotions,
reports/analytics, multi-currency, roles & permissions, Arabic/RTL, and payment/
shipping/WhatsApp integrations. See **FEATURES-REVIEW.md** for the full punch list.

---

## Setup (local / dev)

### Backend
```bash
cd backend
npm install
# create .env (see required vars below), then:
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

---

## Documentation

- **ARCHITECTURE.md** — schema, API routes, pages, infrastructure.
- **FEATURES-REVIEW.md** — what's built (verification checklist) + what's left.
- **The-Idea.md** / **GENERIC-ADMIN-DESIGN.md** — admin reuse/product strategy.
