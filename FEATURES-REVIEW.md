# Mutual — Full Features & QA Review

> A complete walkthrough of **everything in the website** for revision + testing:
> every page/view, every feature, **what was integrated (so you can verify each
> works as intended)**, what's stubbed or needs configuration, and **what's left
> for you to fill in.**
>
> Companion docs: [ARCHITECTURE.md](ARCHITECTURE.md) (technical structure),
> [The-Idea.md](The-Idea.md) + [GENERIC-ADMIN-DESIGN.md](GENERIC-ADMIN-DESIGN.md)
> (reuse/productization strategy).
> Last updated 2026-06-15.

---

## 0. How to read this report

- **Legend:**
  ✅ built & verified (live-tested) · 🟡 built, needs your config/keys to fully work ·
  ⚠️ partial / has a known gap · ⬜ not built yet (your roadmap) · 🔵 you supply content/data.
- The **"Verify"** column tells you exactly how to test each thing.
- Section 8 is the **punch list of what's left for you.**

---

## 1. The three areas of the app

| Area | URL | Who | Auth |
|---|---|---|---|
| **Storefront** | `/` and most routes | Customers (public) | Google sign-in (optional for browsing) |
| **Admin dashboard** | `/admin/*` | Owner/staff | Google sign-in, `role=admin` (DB-verified) |
| **Delivery portal** | `/delivery/*` | Drivers | Access code (admin-generated) |

Run locally: backend `cd backend && npm start` (port from `.env`), frontend
`cd frontend && npm run dev` (port 3001). You must set `NEXT_PUBLIC_API_BASE_URL`
in `frontend/.env` to the backend URL.

---

## 2. STOREFRONT — pages & features

| Page / Feature | Status | What it does | Verify |
|---|---|---|---|
| **Landing `/`** | ✅ 🔵 | Hero marquee, Discover, Features, Steps, About, Unique sections | Open `/`; content/images are yours to refine |
| **Products `/products`** | ✅ | Catalog with DB-driven filters (category/model/type/edition) + sort (recent/price/trend) | Open `/products`; toggle filters; confirm counts match |
| **Product detail `/products/[id]`** | ✅ | Image slider, specs, price, rating, reviews, add-to-cart | Open any product; check images/specs |
| → **Reviews block** | ✅ | Shows **approved** reviews + average + "Verified purchase" badge + store reply | Approve a review in admin → it appears here |
| → **Back-in-stock** (out-of-stock) | ✅ | When `quantity ≤ 0`, replaces add-to-cart with "Notify me" email form | Set a product's stock to 0 in admin Inventory → open it on storefront |
| **Cart `/cart`** | ✅ | Line items, quantity counter, gift/note requests, totals | Add items; change qty; refresh — persists |
| **Checkout `/checkout`** | ✅ | Address form + payment method + order summary; places order | Place a test order end-to-end |
| → **Country→City dropdowns** | ✅ | GCC country drives city options; "Other" → free-text | Change country → city list changes |
| → **Use my location** | 🟡 | Geolocation autodetect button — **only shows if admin enables it** | Settings → Storefront → toggle on, then checkout |
| → **Payment** | ⚠️ | Cash on delivery + Card on delivery work; online card/Apple-Pay are **placeholders** | COD works; online is visually disabled |
| **Order success `/order-success`** | ✅ | Confirmation + order summary + "Your delivery" card (once assigned) | Auto-shown after checkout |
| **Track order `/track-order`** | ✅ | Lookup by number → status stepper + "Your delivery" card below journey | Open `/track-order?order=<num>` |
| **My orders `/my-orders`** | ✅ | Current/Previous tabs; per-product review form on delivered orders | Sign in → view orders; review a delivered item |
| **Liked / wishlist `/liked`** | ✅ | Saved products | Like a product → appears here |
| **Custom-it `/custom-it`** | ✅ | "Design your own cover" form → admin custom request | Submit → check admin Custom Requests |
| **Info pages** | ✅ 🔵 | `/about`, `/why-us`, `/terms`, `/privacy-policy` | Content is yours to finalize |
| **Auth (Google sign-in)** | 🟡 | Google login → JWT session; account menu (orders/liked/cart) | Needs valid `GOOGLE_CLIENT_ID`; sign in |
| **Toasts / errors / skeletons** | ✅ | Themed notifications, error boundaries, loading skeletons | Trigger an action → toast appears |
| **Smooth scrolling** | ✅ | Site-wide smooth scroll (reduced-motion aware) | Scroll / click anchor links |

---

## 3. ADMIN DASHBOARD — pages & features

> All `/admin/*` is gated server-side (`role=admin`). Sidebar groups: General /
> Commerce / People / System. Hover a nav item → info popover. Collapsible sidebar,
> light/dark theme, floating chrome.

| Page / Feature | Status | What it does | Verify |
|---|---|---|---|
| **Overview `/admin`** | ✅ | Revenue today/7d/30d, AOV, order-trend vs prev 30d, avg rating, **pending-actions panel** (links to screens), orders-by-status, recent orders, top products, low-stock, delivery-staff + system info | Open `/admin`; numbers should match real data |
| **Orders `/admin/orders`** | ✅ | Table (date+time, payment, status) + full detail drawer | Open; click a row's **View** |
| → Order detail | ✅ | Summary grid, customer (name/phone/email/since), address, **itemized lines** (unit×qty), gift/note | Open any order |
| → Update status | ✅ | Change status → emails customer + logs to timeline | Change status; check My Orders reflects it |
| → **Assign driver / tracking** | ✅ | Driver picker + carrier/ETA/tracking; **auto-marks Shipped** | Assign a driver → status becomes Shipped |
| → **Status-history timeline** | ✅ | Audit trail of every status change (who/when/note) | Visible at the bottom of the drawer |
| → **VAT invoice / packing slip** | ✅ | Printable doc: TRN + 5% VAT line (backed out of inclusive total); packing-slip toggle (no prices) | Click "🧾 Invoice / packing slip" → Print |
| **Inventory `/admin/inventory`** | ✅ | Stock / reserved / **available** / threshold / status badge per product | Open; sort columns |
| → Adjust stock | ✅ | +/- delta with **reason code** + note; logged to audit history | Adjust a product; check history list |
| → Low-stock threshold | ✅ | Per-product alert threshold | Set threshold; badge updates |
| → Back-in-stock notify | 🟡 | Restocking a 0→positive product emails subscribers | Needs `RESEND_API_KEY` to actually send |
| **Products `/admin/products`** | ✅ | Product CRUD (create/edit/delete, drawer form) | Create/edit/delete a test product |
| **Custom requests `/admin/custom-requests`** | ✅ | View "design your own" submissions + status updates | Submit one on storefront → manage here |
| **Reviews `/admin/reviews`** | ✅ | Moderation queue: filter tabs + counts, approve/reject/reply/flag/delete, verified badges | Approve/reject a review → check storefront |
| **Customers `/admin/customers`** | ✅ | List + full account management drawer | Open a customer's **Manage** |
| → Edit / role / delete | ✅ | Edit name/email/phone/address; change role; delete (guards self + last admin) | Edit a test customer; try role change |
| **Delivery `/admin/delivery`** | ✅ | Delivery-staff CRUD (contact, vehicle, GCC coverage, availability) | Create/edit a driver |
| → **Generate access code** | ✅ | Per-driver login code for the portal (copy button) | Edit a driver → Generate code |
| **Settings `/admin/settings`** | ✅ | Multi-column: Brand / Theme / Customization / Storefront | Open; change + save each section |
| → Brand (name + **logo upload**) | 🟡 | Cloudinary upload (or URL fallback) + TRN/contact | Logo upload needs Cloudinary keys (set ✅) |
| → Theme (mode + accent) | ✅ | Light/dark + accent color → drives `--ui-primary` | Change accent; admin recolors live |
| → Customization (font) | ✅ | SF Pro / Inter / Grotesk / Mono / Serif | Pick a font; admin re-fonts |
| → Storefront (location autodetect) | ✅ | Toggle the checkout geolocation button on/off | Toggle → check checkout |
| **Sortable columns** | ✅ | All tables show ▲▼ arrows; active sort highlighted | Click any sortable header |
| **Theme toggle / collapse / nav popovers** | ✅ | Light/dark, collapse sidebar, hover info | Use the shell controls |

---

## 4. DELIVERY PORTAL — pages & features

> Separate area for drivers. Admin coordinates (assigns + generates codes);
> drivers execute. Mobile-friendly.

| Page / Feature | Status | What it does | Verify |
|---|---|---|---|
| **Login `/delivery/login`** | ✅ | Driver enters their access code → delivery session | Generate a code in admin → log in with it |
| **Deliveries `/delivery`** | ✅ | Lists **only the driver's assigned orders** (active + completed) | Assign an order to a driver → see it here |
| → Order card | ✅ | Customer name + **clickable phone**, address, total/payment, note | Each assigned order shows full delivery info |
| → Advance status | ✅ | Pick up → Start delivery → Mark delivered → Confirm handover | Tap through the steps |
| → Note on completion | ✅ | Optional note/proof when marking delivered/handed over | Add a note when completing |
| → Auto-sync | ✅ | "Delivered" sets the main order status to Delivered + logs timeline | Check the order in admin after |
| **Scoping & guards** | ✅ | Driver can't see/act on others' orders; can't move backward | Verified: 403 on others' orders, 400 backward |

---

## 5. What I integrated (your verification checklist)

Everything below was **built and live-tested by me**. Re-test to confirm it behaves
as you expect in the real UI. Grouped by area; each was verified against its API.

**Storefront**
- [ ] Reviews block shows only approved + verified badge + store reply
- [ ] Back-in-stock form appears for out-of-stock products; subscribe works
- [ ] Checkout country→city dependent dropdowns; "Other" free-text
- [ ] "Use my location" appears only when enabled in Settings
- [ ] "Your delivery" card on Track Order (after admin assigns a driver)
- [ ] Smooth scrolling

**Admin**
- [ ] Overview KPIs/pending-actions match real data; links work
- [ ] Orders: full detail, status change (emails), driver assignment (auto-Shipped)
- [ ] Order status-history timeline records changes
- [ ] VAT invoice math (net + 5% = total) + TRN shown; packing slip toggle; print
- [ ] Inventory: adjust (reason + log), threshold, available = qty − reserved
- [ ] Reviews moderation: approve/reject/reply/flag/delete
- [ ] Customers: edit/role/delete with guards (can't delete self / last admin)
- [ ] Delivery staff CRUD + access-code generation
- [ ] Settings: brand/theme/customization/storefront all save + apply
- [ ] Sortable column arrows on every table

**Delivery portal**
- [ ] Access-code login; own-orders-only; status advance + note; auto-sync; guards

**Cross-cutting**
- [ ] Admin re-verified server-side (a demoted user loses access)
- [ ] `safeFetch` doesn't clobber the delivery token

---

## 6. What's STUBBED or needs configuration (won't fully work until set)

| Item | Why | What you do |
|---|---|---|
| **Email sending** | Resend not configured → mailer logs "would send" | Set `RESEND_API_KEY` + `EMAIL_FROM` in `backend/.env` |
| **Logo / image upload** | Cloudinary | ✅ keys now set — confirm `/admin/uploads/config` returns `configured:true` |
| **Online payments** | Card/Apple/Google Pay are visual placeholders | Integrate PayTabs/Stripe/Tabby/Tamara (future phase) |
| **Geolocation reverse-geocode** | Uses free OpenStreetMap Nominatim | Fine for low volume; swap to a paid geocoder if heavy |
| **Google sign-in** | Needs a valid client id | Set `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| **`JWT_SECRET`** | Was set to a Google secret (wrong) | Replace with the random value I generated; rotate Cloudinary secret too (pasted in chat) |

---

## 7. Known gaps / honest caveats

- **`reserved` stock isn't auto-incremented on pending orders yet.** The column +
  "available = qty − reserved" exist, but wiring "reserve on order, release on
  cancel/return" into checkout is not done. So `reserved` is currently always 0
  unless set manually. (Quick follow-up.)
- **Assigning a driver auto-ships, but the reverse isn't linked** (marking Shipped
  manually doesn't require a driver).
- **Access codes are stored in plaintext** (low-stakes login tokens, regenerable).
  Hash them if you prefer.
- **Invoice is browser-print HTML, not a downloadable PDF.** Add a PDF lib if needed.
- **Products are still "flat"** — no true per-variant SKU/price/stock/barcode/weight
  (that's the Products/Variants roadmap item).
- **No status-change history on the customer side** (admin-only timeline).
- **schema.sql** documents live columns but a few tables (e.g. `orders`) were
  extended in app code; the canonical source is the migrations in `backend/scripts/`.

---

## 8. PUNCH LIST — what's left for YOU

**Content / data you supply (🔵)**
- [ ] Finalize copy + images on landing + info pages (about/why-us/terms/privacy)
- [ ] Real product catalog, categories, images (or keep seeded data)
- [ ] Store profile in Settings: **TRN**, contact email/phone, logo
- [ ] VAT settings confirm (rate 5%, inclusive) + region/currency (AED)

**Config / keys you set (🟡)**
- [ ] `backend/.env`: regenerate `JWT_SECRET`; set `RESEND_API_KEY`+`EMAIL_FROM`;
      confirm Cloudinary keys; set `GOOGLE_CLIENT_ID`
- [ ] `frontend/.env`: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Rotate the Cloudinary API secret (it was pasted in chat)

**Decisions for the next build phases (⬜ — tell me which)**
- [ ] Wire **reserve-stock-on-order** (make `reserved`/available accurate)
- [ ] **Products/Variants** (per-variant SKU/price/stock/barcode/weight/image)
- [ ] **Orders++**: partial/split fulfillment, draft orders
- [ ] **Returns/RMA** flow (request → approve → restock → refund/store-credit)
- [ ] **CRM**: customer groups/segments + group pricing
- [ ] **Discounts/Promotions**: codes, bundles, scheduled sales, gift cards
- [ ] **Reports/Analytics**: exportable sales/VAT/customer/discount reports
- [ ] **Multi-currency** + per-region pricing
- [ ] **Roles & permissions** (manager/fulfillment/support) + audit log
- [ ] **Integrations**: PayTabs/Stripe/Tabby/Tamara, Aramex/Fetchr, WhatsApp
- [ ] **Arabic + RTL** localization
- [ ] (Strategy) the **reusable schema-driven admin engine** — see [The-Idea.md](The-Idea.md)

**Testing you should do**
- [ ] Walk the storefront purchase flow end-to-end on a real device
- [ ] Walk the admin order lifecycle (place → confirm → assign driver → deliver)
- [ ] Walk the delivery portal on a phone
- [ ] Verify emails actually arrive once Resend is set
- [ ] Confirm the VAT invoice numbers against a real tax expectation

---

## 9. Quick test script (fastest full walkthrough)

1. **Set env** (`NEXT_PUBLIC_API_BASE_URL`, `JWT_SECRET`, optionally Resend/Google).
2. Start backend + frontend.
3. **Storefront:** browse `/products` → open one → add to cart → `/checkout` → place order.
4. **Admin:** sign in as admin → `/admin` (KPIs) → Orders → open the new order →
   change status → assign a driver (watch it auto-Ship) → open the invoice → print.
5. **Inventory:** set a product to 0 stock → open it on the storefront → see the
   back-in-stock form → subscribe → restock in admin.
6. **Reviews:** (after a delivered order) leave a review in My Orders → moderate it
   in admin → see it on the product.
7. **Delivery:** in admin Delivery, generate a code → open `/delivery/login` →
   sign in → advance the assigned order → confirm it updates in admin.
8. **Settings:** change theme accent / font / brand → confirm they apply.
