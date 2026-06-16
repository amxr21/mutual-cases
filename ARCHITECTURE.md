# Mutual — Architecture & Codebase Summary

> A comprehensive map of the current web application: stack, structure, pages,
> components, API, database, and cross-cutting infrastructure.
> Last updated: 2026-06-15. Reflects: Phase 0 (admin UI polish + settings
> foundation), Phase 1 (reviews moderation), admin user management, the delivery
> staff role + management, order→driver assignment (visible to customers),
> Cloudinary image uploads, the expanded Settings module (brand/theme/storefront),
> GCC country/city data on checkout, order status-history timeline + auto-ship on
> driver assignment, the Inventory module (adjustments/thresholds/back-in-stock),
> and VAT-compliant invoices + packing slips.

---

## 1. What the app is

**Mutual** is an e-commerce store for **phone cases & mobile accessories** (iPhone,
iPad, special items) serving the **UAE / GCC** market. It has two halves:

1. **Storefront** — public shopping experience (browse, filter, like, cart,
   checkout, track orders, custom-design requests, reviews).
2. **Admin dashboard** — owner/operator back office (overview KPIs, orders +
   driver assignment, products, customers (full account management), custom
   requests, reviews moderation, delivery staff, settings).

Both are served by a **single Next.js app** (the admin lives at `/admin/*`),
talking to a **custom Express + MySQL API**.

> **Note:** an earlier project brief referred to "Strapi" — there is **no Strapi**
> in this codebase. The backend is a hand-written Express/MySQL API.

---

## 2. Tech stack

### Frontend (`frontend/`)
| Concern | Choice |
|---|---|
| Framework | **Next.js 15.4.6** (App Router), **React 19.1** |
| Dev server | `next dev --turbopack -p 3001` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), CSS variables, scoped admin CSS |
| Storefront font | **Fraunces** (self-hosted via `next/font/local`) |
| Admin font | **Inter** (self-hosted via `next/font/google`) / **SF Pro** on Apple, switchable in Settings |
| UI libs | `primereact`, `swiper`, `react-alice-carousel` |
| Logging | `winston` + `winston-daily-rotate-file` (server-side route handler) |
| Lint | `eslint` + `eslint-config-next` |

### Backend (`backend/`)
| Concern | Choice |
|---|---|
| Runtime | **Node.js**, CommonJS |
| Framework | **Express 5.1** |
| Database | **MySQL** via `mysql2/promise` (connection pool) |
| Auth | **Google OAuth** (`google-auth-library`) → app-issued **JWT** (`jsonwebtoken`) |
| Validation | **Zod 4** (at the route boundary) |
| Email | **Resend** (`resend`) — best-effort, no-ops without an API key |
| Logging | `winston` + daily rotation (api / db / error channels) |
| Config | `dotenv`, centralized in `config/index.js` |

---

## 3. Repository layout

```
Mutual/
├─ ARCHITECTURE.md          ← this file
├─ backend/                 ← Express + MySQL API
│  ├─ server.js             ← app entry: mounts routes, CORS, health, error handlers
│  ├─ config/index.js       ← env-driven config + fail-fast validation
│  ├─ db.js                 ← mysql2 pool (TINYINT(1)→bool, SSL, keep-alive)
│  ├─ dbClient.js           ← query() + withTransaction() + DB error mapping
│  ├─ controllers/          ← request handlers (one file per resource)
│  ├─ routes/               ← Express routers (one per resource)
│  ├─ middleware/           ← auth, validate, asyncHandler, errorHandler, requestLogger
│  ├─ validation/schemas.js ← all Zod request schemas
│  ├─ errors/AppError.js    ← typed error + factory helpers (badRequest, notFound, …)
│  ├─ email/                ← mailer (Resend) + HTML templates
│  ├─ logger/               ← winston setup (api/db/error channels)
│  ├─ process/handlers.js   ← graceful shutdown + crash safety net
│  ├─ scripts/              ← seeds + idempotent migrations
│  └─ schema.sql            ← canonical DB schema (kept in sync with migrations)
└─ frontend/                ← Next.js app (storefront + admin)
   └─ app/
      ├─ layout.jsx          ← root layout (Fraunces, providers, Chrome)
      ├─ page.jsx            ← storefront landing page
      ├─ (main)/             ← storefront route group (own layout/navbar/footer)
      ├─ admin/              ← admin dashboard route group (own layout/shell)
      ├─ components/         ← ~120 storefront UI components
      ├─ sections/           ← landing-page sections (Hero, About, Footer, …)
      ├─ Context/            ← React contexts (Cart, Like, Filter)
      ├─ lib/                ← safeFetch, config, client/server loggers
      ├─ api/client-log/     ← Next route handler receiving browser error reports
      ├─ css/                ← globals, variables (@theme), fonts
      └─ constants/          ← icons, images, gcc (country→city data)
```

---

## 4. Database schema (MySQL)

Canonical definition in `backend/schema.sql`. Core tables:

| Table | Purpose | Key columns / notes |
|---|---|---|
| `users` | accounts | `google_id`, `email` (unique), `role` enum(`customer`,`admin`,`delivery`), profile fields `phone`/`address_line`/`area`/`city`/`country` (admin-editable), `access_code` (driver portal login) |
| `products` | catalog | flat row: `price`, `model`, `edition`, `category` (string), `type_id`→`types`, `stock_quantity_id`, 3 image URLs, `description/material/approach/features`, `trend` |
| `category` / `model` / `edition` / `types` | lookup tables | resolved/created on product write |
| `stock_quantity` | stock per product | `quantity`, `reserved`, `low_stock_threshold`, linked via `stock_id`→`products.stock_quantity_id` |
| `stock_adjustments` | inventory audit log | `product_id`, `delta`, `reason` enum, `note`, `resulting_qty`, `adjusted_by`, `created_at` |
| `stock_notifications` | back-in-stock subscriptions | unique (`product_id`,`email`), `notified` flag |
| `cart_items` | per-user cart | unique per `product_id`; `user_id`→`users` |
| `liked_items` | wishlist | unique per (`user_id`,`product_id`) |
| `orders` | orders | `user_id` **varchar** (stores id as string ⚠), `order_number`, `total`, `status_id`→`order_status`, `payment_method`, `gift`, `gift_message`, `note`; **shipment:** `delivery_user_id`→`users` (driver, FK SET NULL), `tracking_number`, `carrier`, `eta`; **driver portal:** `delivery_status` enum(assigned/picked_up/out_for_delivery/delivered/handed_over), `delivery_note` |
| `order_items` | order line items | `order_id`, `product_id`, `quantity`, `price`, lookup ids |
| `order_status` | status lookup | 1 Pending · 2 Confirmed · 3 Shipped · 4 Delivered · 5 Canceled · 6 Returned |
| `order_status_history` | order status-change audit timeline | `order_id`, `status_id`, `changed_by`, `note`, `created_at` |
| `addresses` | shipping address per order | `country`, `city`, `area`, `address` |
| `payments` | payment records | `order_id`, `amount`, `method_id`→`payments_method` |
| `payments_method` | payment method lookup | |
| `feedbacks` | legacy order-level feedback | (superseded by `reviews`) |
| `reviews` | product reviews | one per (`user_id`,`product_id`); purchase-gated; **moderation:** `status` enum(pending/approved/rejected), `admin_reply`, `flagged`, `moderated_at/by` |
| `custom_orders` | "design your own cover" submissions | `model`, `sentence`, `type`, `design`, `comments`, `status` |
| `delivery_profiles` | delivery-staff profile (1:1 with a `role='delivery'` user) | `vehicle_type`, `plate_number`, `license_number`, `zone`, `emirate`, `country`, `status` enum(active/inactive/on_shift); FK `user_id`→`users` (CASCADE) |
| `settings` | admin key/value config store (JSON) | keys: `customization`, `store_profile` (incl. `logoUrl`), `region`, `vat`, `theme` (mode+accent), `storefront` (e.g. `locationAutodetect`) |

> ⚠ **Known DB gotcha:** `orders.user_id` is `varchar(255)` (`utf8mb4_0900_ai_ci`),
> not a numeric FK. Comparing it to a numeric id via `CAST(... AS CHAR)` triggers
> `ER_CANT_AGGREGATE_2COLLATIONS` (1267). Either bind the id as a string param,
> or append `COLLATE utf8mb4_0900_ai_ci` to the cast. Affects any order↔user join.

**Migrations / seeds** (`backend/scripts/`, all idempotent):
- `seedProducts.js`, `backfillProductDetails.js` — catalog seed/backfill
- `seedReviews.js` — sample approved reviews
- `seedDelivery.js` — sample delivery staff across the GCC
- `migrateReviewsModeration.js` — review moderation columns
- `migrateSettings.js` — creates `settings` table + default rows (incl. theme/storefront)
- `migrateUserProfile.js` — adds customer profile/logistics columns to `users`
- `migrateDelivery.js` — adds `'delivery'` role + `delivery_profiles` table
- `migrateOrderShipment.js` — adds `delivery_user_id`/`tracking_number`/`carrier`/`eta` to `orders`
- `migrateOrderHistory.js` — adds `order_status_history` + backfills current status
- `migrateInventory.js` — adds `reserved`/`low_stock_threshold` + `stock_adjustments` + `stock_notifications`
- `migrateDeliveryPortal.js` — adds `users.access_code` + `orders.delivery_status`/`delivery_note`
- `seedDelivery.js` (above) — also note `seedReviews`/`seedProducts` are idempotent

---

## 5. Backend API surface

`server.js` mounts feature routers and a `/health` check (verifies DB). Global:
CORS (allowlisted origins, credentials), JSON body parsing, structured request
logging, 404 + centralized error handler last.

### Auth model
- **Login:** `POST /api/auth` verifies a Google ID token, upserts the user,
  returns an app **JWT** `{ id, email, role }`.
- **`requireAuth`** middleware verifies the Bearer JWT → `req.user`.
- **`requireAdmin`** runs `requireAuth`, then **re-checks the role against the DB**
  (a stale/forged token can't retain admin). All `/admin/*` and product writes use it.
- **`requireDelivery`** is the same pattern for the driver portal (`role='delivery'`).
  Drivers (no Google account) sign in via `POST /delivery/auth` with an
  admin-generated **access code** → JWT.
- Controllers always derive the acting user from the **JWT**, never a body `user_id`.
  `safeFetch` attaches the default session token unless a caller passes its own
  `Authorization` (the delivery portal uses a separate `delivery_token`).

### Routes

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /health`, `GET /` | — | health / liveness |
| `POST /api/auth` | — | Google login → JWT |
| `GET /products` | public | list products (+ avg_rating, review_count) |
| `GET /products/filters` | public | filter dimensions (category/model/type/edition + counts) |
| `GET /products/:id` | public | single product |
| `POST/PATCH/DELETE /products[/:id]` | **admin** | create / update / delete (transactional) |
| `GET /cart[/:id]` · `POST /cart` · `PATCH /cart` · `DELETE /cart/:id` | auth | view / add / set qty / remove (own cart) |
| `GET /liked[/:id]` · `GET /liked/ids` · `POST /liked` · `DELETE /liked` | auth | wishlist view / ids / add / remove |
| `POST /custom` | public | submit custom-design request (guests allowed) |
| `POST /orders` | auth | create order from cart snapshot (re-prices server-side, clears cart) |
| `GET /orders` | auth | own order history (with items) |
| `GET /orders/:orderNumber` | auth | own order detail (owner-only) — **includes assigned driver name/phone + tracking/carrier/eta** |
| `POST /orders/:orderNumber/pay` | auth | placeholder "mark paid" → Confirmed |
| `GET /reviews/product/:id` | public | **approved** reviews + avg + verified flag + admin reply |
| `GET /reviews/mine` · `POST /reviews` | auth | own reviews; submit/update (purchase-gated → pending) |
| `POST /products/:id/notify-stock` | public | subscribe an email for back-in-stock |
| `GET /settings/public` | public | safe storefront flags (e.g. `locationAutodetect`) |
| `POST /delivery/auth` | public | driver access code → JWT |
| `GET /delivery/orders` · `PATCH /delivery/orders/:n/status` | **delivery** | own assigned orders · advance delivery sub-status (syncs main status) |
| **Admin** `GET /admin/overview` | admin | rich KPIs (revenue windows, AOV, order trend), pending-actions, top products, low-stock, delivery + system info |
| **Admin** `GET /admin/orders[/:orderNumber]` · `PATCH /admin/orders/:n/status` | admin | list / detail (with driver + status history) / update status (logs + emails) |
| **Admin** `GET /admin/orders/:n/invoice` | admin | VAT-compliant invoice/packing-slip data (TRN + 5% tax line) |
| **Admin** `GET /admin/delivery-options` · `PATCH /admin/orders/:n/delivery` | admin | available drivers · assign driver + tracking (auto-ships the order) |
| **Admin** `GET /admin/inventory` · `POST /admin/inventory/:id/adjust` · `GET /admin/inventory/:id/adjustments` · `PATCH /admin/inventory/:id/threshold` | admin | stock list · adjust (reason+log) · history · set low-stock threshold |
| **Admin** `GET /admin/custom-requests` · `PATCH /admin/custom-requests/:id/status` | admin | list / update custom requests |
| **Admin** `GET /admin/customers[/:id]` · `PATCH /admin/customers/:id` · `PATCH /admin/customers/:id/role` · `DELETE /admin/customers/:id` | admin | list / detail / edit profile / change role / delete (guards self + last admin) |
| **Admin** `GET/POST /admin/delivery` · `GET/PATCH/DELETE /admin/delivery/:id` · `POST /admin/delivery/:id/access-code` | admin | delivery-staff CRUD + generate driver login code |
| **Admin** `GET /admin/reviews[?status=&flagged=]` · `GET /admin/reviews/counts` | admin | moderation queue + counts |
| **Admin** `PATCH /admin/reviews/:id/status\|reply\|flag` · `DELETE /admin/reviews/:id` | admin | moderate / reply / flag / delete |
| **Admin** `GET /admin/settings[/:key]` · `PUT /admin/settings/:key` | admin | read/update settings (allowlisted keys) |
| **Admin** `GET /admin/uploads/config` · `POST /admin/uploads/sign` | admin | Cloudinary availability + signed direct-upload params |

### Backend conventions
- **Every** query is parameterized and goes through `dbClient.query` /
  `withTransaction` (centralized logging + DB-error→`AppError` mapping).
- Handlers **throw** `AppError`s; `asyncHandler` forwards to the error middleware.
- Multi-table writes (create order, create/update product) run in transactions.
- `AppError` carries `status` + machine `code` + client-safe `message`; unknown
  errors are masked as generic 500s.

---

## 6. Frontend — storefront

Route group **`app/(main)/`** has its own layout; `Chrome.jsx` renders the
storefront navbar/footer + page transitions for non-admin routes and renders
admin routes bare.

### Pages
| Route | Purpose |
|---|---|
| `/` | Landing page (Hero, Discover, Features, Steps, About, Unique sections) |
| `/products` | Catalog with DB-driven filters (category/model/type/edition) + sort |
| `/products/[id]` | Product detail: image slider, specs, price, **reviews**, add-to-cart (or **back-in-stock notify** when out of stock) |
| `/cart` | Cart lines, quantities, gift/note requests, totals |
| `/checkout` | Address (GCC country→city dependent dropdowns + optional geolocation autodetect) + payment method, places order |
| `/order-success` | Post-order confirmation (+ "Your delivery" card once assigned) |
| `/track-order` | Look up an order → status stepper + **"Your delivery"** card (driver/tracking) below the journey; lookup form hidden when deep-linked |
| `/order-journey` | Order status journey view |
| `/my-orders` | Authenticated user's order history + per-product review forms |
| `/liked` | Wishlist |
| `/custom-it` | "Design your own cover" form → custom request |
| `/about`, `/why-us`, `/terms`, `/privacy-policy` | Info pages |
| `/[...not-found]`, `not-found`, `error`, `global-error` | Error/404 boundaries |

### Components & sections
- **~120 components** in `app/components/` (re-exported via `index.js`): product
  cards/details/images/specs/rating, cart pieces, checkout form, payment badges
  (Visa/MasterCard/ApplePay/GooglePay), filters/tags, order views/stepper,
  reviews (`ProductReviews`, `ReviewForm`), `EmptyState`/`ErrorState`/`Skeletons`,
  toasts, page transitions, footer/nav pieces.
- **`app/sections/`** — landing-page sections (Hero, About, Discover, Features,
  Steps, Unique, Footer, Navbar).

### State (React Context)
| Context | Responsibility |
|---|---|
| `CartContext` | cart lines (keyed by `product_id`), gift/note requests (localStorage), optimistic add/setQuantity/remove, totals; talks to `/cart` |
| `LikeContext` | wishlist state synced with `/liked` |
| `FilterContext` | products-page filter tokens (`category:…`, `model:…`, …) + sort selection |

---

## 7. Frontend — admin dashboard (`app/admin/`)

Own route group + `layout.jsx` (loads Inter) wrapping **`AdminGuard.jsx`**:
- Client-side gate (token + `role === 'admin'` in localStorage) — UX only; the
  **API enforces admin server-side** regardless.
- **Floating shell:** rounded, shadowed, edge-detached sidebar + topbar
  (`.ui-float`, light shadow). Square logo placeholder (shows the uploaded brand
  logo from settings). Collapsible grouped sidebar (General / Commerce / People /
  System) with centered icons when collapsed + an **interactive hover info
  popover** per nav item. Breadcrumb topbar, theme toggle, "View store" link.
- Applies the saved admin font + theme (accent/mode) + brand on mount; the
  sidebar brand updates live when Settings saves (via a window event).

### Admin pages
| Route | Purpose |
|---|---|
| `/admin` | Overview: revenue windows + AOV + order-trend KPIs, **pending-actions panel** (links to screens), orders-by-status, recent orders, top products, low-stock, delivery-staff + system/technical info |
| `/admin/orders` | Orders table (date+time, payment) + full detail drawer: summary, customer, address, itemized lines, **assign driver/tracking (auto-ships)**, **status-history timeline**, invoice link |
| `/admin/orders/[orderNumber]/invoice` | Printable **VAT invoice / packing slip** (store TRN + 5% tax line backed out of inclusive total; chrome hidden on print) |
| `/admin/products` | Product CRUD (table + drawer form + delete confirm) |
| `/admin/inventory` | **Inventory** — stock/reserved/available, low-stock thresholds, stock adjustments (reason + audit log) |
| `/admin/custom-requests` | Custom-design requests + status updates |
| `/admin/customers` | Customer list + **full account management** drawer (edit name/email/phone/address, change role, delete — guarded) |
| `/admin/delivery` | **Delivery-staff CRUD** (contact, vehicle, GCC coverage zone, availability) |
| `/admin/reviews` | **Reviews moderation queue** — filter tabs + counts, approve/reject/reply/flag/delete, verified-purchase badges |
| `/admin/settings` | **Brand** (name + Cloudinary logo upload + TRN/contact), **Theme** (mode + accent), **Customization** (font), **Storefront** (location-autodetect toggle) — responsive multi-column |

### Delivery portal (`app/delivery/`)
A third, role-scoped area (separate from storefront + admin), rendered bare by
`Chrome.jsx`. `/delivery/login` takes the driver's **access code** → delivery
session; `/delivery` lists **only that driver's assigned orders** with address +
customer phone, and advances each through the delivery sub-lifecycle (pick up →
start delivery → mark delivered → confirm handover) with an optional note. Admin
coordinates (assigns + generates codes); the driver executes.

### Shared admin UI (`app/admin/ui/`)
- **`primitives.jsx`** — `Button`, `Badge`, `PageHeader`, `StatCard`, `FormField`
- **`DataTable.jsx`** — generic table: client search, column sort, pagination (30/page), row actions
- **`Drawer.jsx`** — right slide-in panel (detail/edit) with footer slot
- **`ConfirmDialog.jsx`** — destructive-action confirm modal
- **`Select.jsx`** — admin-themed animated select (storefront `SmoothSelect` UX on `--ui-*` tokens); replaces native `<select>` across admin
- **`ImageUpload.jsx`** — Cloudinary signed direct-upload with graceful URL-paste fallback when not configured
- **`ThemeToggle.jsx`** — light/dark via `.admin-root.dark`
- **`admin.css`** — theme tokens (`--ui-*`), light/dark variants, `ui-*` utility
  classes, floating-chrome + generic-font rules. **Scoped under `.admin-root`**
  so the storefront is unaffected.
- **Notifications:** the shared `Toast` system renders **generic `--ui-*`-themed**
  toasts on `/admin` routes (dark-mode aware) and brand-styled toasts on the storefront.

---

## 8. Cross-cutting infrastructure

- **Config:** backend `config/index.js` (fail-fast on missing DB/JWT/Google vars);
  frontend `lib/config.js` (`publicConfig` for browser, `serverConfig` for SSR).
  **Everything env-driven — no hardcoded secrets/URLs.**
  - **Required:** `DB_HOST/USER/PASSWORD/NAME`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`
    (backend); `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend).
  - **Optional (degrade gracefully):** `RESEND_API_KEY`/`EMAIL_FROM`/`PUBLIC_SITE_URL`
    (email), `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`
    (uploads).
  - **Future-phase integrations** (not yet wired): Stripe/PayTabs/Tabby/Tamara
    (payments), Aramex/Fetchr (shipping), WhatsApp (notifications).
- **Error handling:** backend central `AppError` + error middleware; frontend
  `safeFetch` (never throws — returns `{ ok, status, data|error }`), error
  boundaries, and `GlobalErrorListeners` reporting browser errors to
  `/api/client-log`.
- **Fetch layer:** all client calls go through `lib/safeFetch` (`getJSON`,
  `postJSON`, `patchJSON`, `putJSON`, `deleteJSON`) — attaches the JWT, timeout,
  safe JSON parse, consistent result shape.
- **Logging:** winston with daily-rotated api / db / error channels on both tiers.
- **Email:** Resend wrapper; **no-ops gracefully** without an API key (logs
  "would send"), never breaks the request that triggered it. Used for order
  status-change notifications.
- **Image uploads:** Cloudinary via a server-side **signed** direct-upload
  (`crypto`-signed, no SDK). Same graceful degradation — when `CLOUDINARY_*` env
  vars are absent the admin UI falls back to pasting a URL. Secret stays
  server-side; the browser uploads straight to Cloudinary.
- **Security posture:** parameterized queries everywhere; `multipleStatements`
  off; admin re-verified against the DB; user identity always from the JWT;
  owner-scoped order/cart/like access; same error message for missing vs.
  not-owned (no existence leaks).

---

## 9. Theming & fonts

- **Storefront** (`css/variables.css` `@theme`): brand blue `#055AB0`, gold
  `#DFA61D`, off-white/black; default font **Fraunces**.
- **Admin** (`admin.css` under `.admin-root`): mirrored `--ui-*` tokens (primary
  blue, gold accent, danger/success), light + dark variants, `--ui-radius`,
  float shadow; **`--ui-font`** defaults to SF Pro → Inter → system and is
  user-switchable in Settings → Customization (persisted to localStorage + the
  `settings` table).

---

## 10. Deployment intent (important for future work)

The admin dashboard is destined to be **sold as self-hosted, single-tenant
software** — each buyer runs their own copy against their own database.
Consequences for ongoing development:
- **No multi-tenancy / no `tenant_id`** — every install is one store.
- Build **extraction-friendly:** admin imports only from `app/admin/*` + a small
  shared set (`lib/safeFetch`, `lib/config`, `Toast`). Avoid new cross-imports
  into storefront components, so the admin can later be lifted into its own
  Next app pointing at the same Express API.
- Keep everything **config/env + `settings`-driven** so buyers configure without
  editing code.

---

## 11. Current build status (phased roadmap)

A larger plan adds 11 e-commerce admin modules with UAE/GCC requirements
(Arabic/RTL, AED/multi-currency, 5% VAT + TRN invoices, PayTabs/Stripe/Tabby/
Tamara/COD, Aramex/Fetchr shipping, WhatsApp notifications). External
integrations are being built as **schema + UI + stubs** behind clean interfaces.

**Done:**
- **Phase 0** — admin UI polish (floating rounded chrome with light shadow, logo
  placeholder, hover info popovers, generic/Inter/SF Pro font) + the `settings`
  key/value foundation.
- **Phase 1** — Reviews & Ratings management (moderation queue, approve/reject/
  reply/flag/delete, verified-purchase badges, approved-only storefront gate).
- **Overview upgrade** — revenue windows + AOV + order-trend KPIs, pending-actions
  panel (linking to screens), top products, low-stock, delivery + system info.
- **Settings expansion** — Brand (name + Cloudinary logo upload + TRN/contact),
  Theme (mode + accent), Customization (font), Storefront (location-autodetect),
  responsive multi-column; public `/settings/public` for storefront flags.
- **Admin user management** — customer detail + edit logistics, role change,
  delete (guards self / last admin).
- **Delivery** — `'delivery'` role + `delivery_profiles`, full CRUD admin page,
  sample GCC drivers.
- **Order → driver assignment** — assign a driver + tracking/carrier/ETA to an
  order in admin; the assigned driver + tracking now surface on the customer's
  Track Order / My Orders ("Your delivery" card).
- **Checkout UX** — GCC country→city dependent dropdowns (the real fix) + gated
  geolocation autodetect (admin toggle, off by default).
- **Generic admin notifications** — toasts themed with `--ui-*` on admin routes.
- **Order status-history timeline** + auto-advance to Shipped on driver assignment.
- **Inventory module** — stock/reserved/available, low-stock thresholds + alerts,
  stock-adjustment audit log (reason codes + who/when), back-in-stock email notify.
- **VAT-compliant invoices + packing slips** — printable, TRN + 5% tax line
  (backed out of the inclusive total), driven by Settings → VAT/store profile.
- **Smooth scrolling** site-wide (`scroll-behavior: smooth`, reduced-motion aware).
- **Delivery-person portal** — driver login by access code; own-orders-only view;
  delivery sub-status flow that auto-syncs the main order status + timeline.
- **Sortable-column arrows** on all admin tables.

**Next:** remaining roadmap modules — Products/Variants, Orders++ (partial
fulfillment), reserve-stock-on-order wiring, RMA, CRM groups/pricing,
Discounts/Promotions, Reports/Analytics, multi-currency, Roles/Audit, and
payment/shipping/WhatsApp integration stubs.
