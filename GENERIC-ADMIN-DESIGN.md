# Schema-Driven Admin Engine — Technical Design

> Design for turning the Mutual admin into a **reusable, schema-driven admin
> panel** that can (A) be sold as a configurable product to other businesses and
> (B) be pointed at the author's own future projects — while staying the author's
> own codebase and preserving the existing domain features.
> Status: **design for review — no code yet.** Last updated 2026-06-15.

---

## 1. Goals & non-goals

### Goals
- One admin engine that renders **any SQL table** from a **declarative config**,
  not from hand-written per-resource pages.
- **Reuse:** point at a new database → introspect → draft config → working admin.
- **Productizable:** config is stored **per install** (single-tenant, matching the
  existing deployment decision — no `tenant_id`).
- **Preserve domain features:** reviews moderation, driver assignment, VAT
  invoices, the rich dashboard, etc. must keep working.
- **Reuse existing primitives:** `DataTable`, `Drawer`, `Select`, `ConfirmDialog`,
  `FormField` become the rendering layer (they are already generic).

### Non-goals (explicitly rejected)
- ❌ The admin **never** creates or alters database schema (no DDL from the UI).
  The DB is the source of truth; the admin reflects it.
- ❌ No autonomous "ML builds the admin." ML is a **setup assistant only**
  (drafts labels/field-types, human confirms). Never touches data or DDL.
- ❌ Not multi-tenant SaaS (each buyer self-hosts their own copy + DB).
- ❌ Not adopting Directus/AdminJS as the product (used only as a design reference;
  resale/licensing + loss of IP make them wrong as the shipped product).

---

## 2. Architecture overview

```
Database ──introspect──▶ Schema metadata ──draft──▶ Resource config ──renders──▶ Generic admin UI
 (source of truth)        (information_schema)        (human-edited,              (existing primitives,
                                                       stored per install)         fed by config)
                                                            ▲
                                              ML/LLM setup assistant (drafts only)
```

Five layers:

1. **Introspection** — read-only read of `information_schema`.
2. **Resource config** — the declarative heart; generated as a draft, human-edited.
3. **Generic CRUD API** — one set of endpoints operating on any configured resource.
4. **Generic UI** — `/admin/r/[resource]` rendering from config.
5. **Extension points** — custom actions / field renderers / full custom pages for
   the domain 20%.

---

## 3. Layer 1 — Introspection

**Endpoint:** `GET /admin/_schema` (admin-only, read-only).

Reads MySQL `information_schema`:
- `TABLES` — table names (exclude system/unrelated tables via allowlist or prefix).
- `COLUMNS` — name, data type, nullable, default, char length, numeric precision,
  `COLUMN_KEY` (PRI/UNI/MUL), `EXTRA` (auto_increment), `COLUMN_TYPE` (for enums).
- `KEY_COLUMN_USAGE` / `REFERENTIAL_CONSTRAINTS` — foreign keys (which column
  references which table.column).
- `STATISTICS` — indexes (for sortable/searchable hints).

**Output shape (per table):**
```json
{
  "table": "products",
  "primaryKey": "id",
  "columns": [
    { "name": "id", "dbType": "bigint unsigned", "nullable": false, "auto": true },
    { "name": "price", "dbType": "decimal(10,2)", "nullable": false },
    { "name": "status", "dbType": "enum('a','b')", "enumValues": ["a","b"] },
    { "name": "type_id", "dbType": "bigint", "fk": { "table": "types", "column": "id" } }
  ]
}
```

This is the "dynamic fetching" instinct pointed the **right** way: read the schema,
never write it.

---

## 4. Layer 2 — Resource config (the heart)

A **resource** = one table exposed in the admin. Config is generated as a draft
from introspection, then edited by a human, then stored (see §8 storage).

### 4.1 Config schema (per resource)
```js
{
  resource: "products",            // url + api key (table name by default)
  table: "products",               // actual DB table
  label: "Products",               // sidebar + page title
  group: "Commerce",               // sidebar group
  icon: "<svg path d>",
  primaryKey: "id",
  defaultSort: { field: "created_at", dir: "desc" },

  fields: [
    {
      name: "price",
      label: "Price",
      type: "money",               // SEMANTIC type (see §4.2)
      currency: "AED",
      required: true,
      // visibility per view:
      inList: true, inDetail: true, inForm: true,
      sortable: true, searchable: false,
      readOnly: false,
    },
    {
      name: "image_url",
      label: "Image",
      type: "image",
      inList: true,                // renders thumbnail
    },
    {
      name: "type_id",
      label: "Type",
      type: "relation",            // FK
      relation: { table: "types", labelColumn: "type", valueColumn: "id" },
    },
    {
      name: "status",
      label: "Status",
      type: "enum",
      options: ["pending", "approved", "rejected"],
      badgeTones: { approved: "green", rejected: "red", pending: "gold" },
    },
  ],

  // domain extension points (see §7)
  actions: ["approve", "reject"],          // custom row actions by id
  customRenderers: { invoice: "vat-invoice" },

  permissions: { create: true, update: true, delete: false }, // per role later
}
```

### 4.2 Semantic field types (the key abstraction)
DB types are too low-level. The config uses **semantic** types that map to
renderers + form inputs + validators:

| Semantic type | Inferred from | List render | Form input |
|---|---|---|---|
| `text` | varchar | text | text input |
| `longtext` | text/varchar(>255) | truncated | textarea |
| `number` | int/bigint | right-aligned | number input |
| `money` | decimal + name~price/total/amount | `1,200 AED` | number input |
| `boolean` | tinyint(1) | badge/✓ | toggle |
| `enum` | `enum(...)` | badge | Select |
| `date` / `datetime` | date/datetime/timestamp | formatted | date picker / read-only |
| `image` | varchar + name~image/photo/logo/url | thumbnail | ImageUpload |
| `email` | name~email | mailto | email input |
| `phone` | name~phone | text | tel input |
| `relation` | FK | resolved label | Select of related rows |
| `json` | json | collapsed | textarea/json editor |
| `id` | PRI auto | `#id` mono | hidden |

These map **directly** onto components you already have: `Select`, `ImageUpload`,
`Badge`, `FormField`, plus the `Toggle` from settings.

---

## 5. Layer 3 — Generic CRUD API

One controller, parameterized by `:resource`, replacing per-resource controllers
for CRUD-shaped tables.

| Method & path | Purpose |
|---|---|
| `GET /admin/r/:resource?search=&sort=&dir=&page=&filter[x]=` | list (paginated) |
| `GET /admin/r/:resource/:id` | detail (+ resolved relations) |
| `POST /admin/r/:resource` | create |
| `PATCH /admin/r/:resource/:id` | update |
| `DELETE /admin/r/:resource/:id` | delete |
| `GET /admin/r/:resource/_relations/:field` | options for a relation Select |

**Safety rules (non-negotiable, mirrors current backend conventions):**
- `:resource` and field names are **validated against the loaded config allowlist**
  before touching SQL — never interpolate raw request strings into SQL identifiers.
- All **values** parameterized (`?`), as everywhere else in the codebase.
- Column/table identifiers come only from config (which came from introspection),
  quoted with backticks; never from the request body directly.
- Writes that touch multiple tables → `withTransaction`.
- Same `requireAdmin` gate; later, per-resource permissions by role.
- Reuses `dbClient.query` / error mapping / `AppError`.

**Why this is safe despite being "dynamic":** the set of allowed tables/columns is
fixed at config-load time (from the DB's own schema), so a request can only ever
name things that already exist and are explicitly exposed. It's dynamic *dispatch*,
not dynamic *SQL construction*.

---

## 6. Layer 4 — Generic UI

**Route:** `/admin/r/[resource]/page.jsx` (one file, any resource).

- Loads the resource config (from a config endpoint or bundled config).
- Builds `DataTable` `columns` from `fields` where `inList`, using a
  `renderer(field)` switch keyed on semantic type (reusing `Badge`, thumbnails,
  money formatting, relation labels).
- `Drawer` detail/edit form built from `fields` where `inDetail`/`inForm`, using
  `FormField` + the right input per semantic type (`Select`, `ImageUpload`,
  `Toggle`, date, text…).
- `ConfirmDialog` for delete.
- Sidebar (`AdminGuard` NAV_GROUPS) generated from the set of resource configs +
  their `group`/`label`/`icon`.

**Result:** adding a new simple table to the admin = add a config entry, zero new
page code.

---

## 7. Layer 5 — Extension points (preserving the domain 20%)

The generic engine handles CRUD-shaped tables. Domain features need escape hatches:

1. **Custom row/detail actions.** Config lists `actions: ["approve"]`; a registry
   maps action id → handler (API call + UI). Example: reviews `approve/reject`,
   orders `assign-driver`. Rendered as buttons in the row/drawer.

2. **Custom field renderers.** Config `type: "custom", renderer: "rating-stars"`;
   a registry maps renderer id → React component. Example: star ratings, a
   "Generate VAT invoice" button, the delivery card.

3. **Custom full pages.** Some screens aren't a table grid (the **dashboard
   overview**, the **VAT invoice** view, **RMA** workflow). These stay as
   hand-built pages, registered in the sidebar alongside generic resources. The
   engine doesn't force everything through a grid.

**Migration stance:** existing modules (reviews, delivery, orders, settings,
overview) **stay hand-built initially**. Simple tables (category, types, editions,
customers-as-data) move to generic first. Move more over only when it's clearly a
win. Hybrid is the design, not a temporary state.

---

## 8. Config storage & the multi-project story

- Config is **per install** (single-tenant). Two storage options:
  - **File** (`admin.config.js`) checked into each project — simplest, versioned.
  - **DB** (`admin_resources` table) — editable in-app via a config UI.
  - Likely: **draft to DB, export to file** so it's both editable and versionable.
- **Reuse across your own projects:** new project → run introspection → generate
  draft config → tweak → commit `admin.config.js`. Admin works against the new DB.
- **Sell as product:** buyer installs → setup wizard introspects their DB → ML
  assistant drafts config → buyer confirms/edits → saved. Same engine binary,
  different config.

---

## 9. The ML/LLM assist — exact boundary

**Where it runs:** one-time, at setup, on the **introspected schema** (not on data).

**What it does:** drafts the resource config — suggests per column:
- semantic type (`price decimal` → `money`; `*_url`/`image` → `image`;
  `status enum` → `enum` + badge tones; `email` → `email`; `created_at` → read-only
  `datetime`),
- human label (`license_number` → "License number"),
- which view(s) to show it in, sortable/searchable hints,
- sidebar grouping guesses.

**Hard constraints:**
- Output is a **draft config object** — a human reviews/edits before it's active.
- It **never** writes data, never emits SQL, never alters schema.
- Fully functional **without** ML (rule-based inference covers most cases; ML just
  improves labels/edge cases). ML is an enhancer, not a dependency.
- Could be the existing Claude API (the project already targets Anthropic models)
  or a tiny local heuristic model — but rules-first.

This is the *only* safe, useful place for ML here. It turns "30 minutes of config
tweaking" into "5 minutes of confirming."

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Generic engine can't express domain features | Hybrid: extension points + keep custom pages. Proven pattern. |
| 8 weeks spent, then domain features don't fit | **Build the read-only PoC first** (§12) — days, not weeks, to validate. |
| Dynamic SQL injection surface | Identifiers only from config allowlist; values always parameterized. |
| Relation/label resolution gets slow | Cache relation option lists; paginate; index FKs. |
| Config drifts from schema after a migration | Re-run introspection → diff against config → flag new/removed columns. |
| Over-generalizing early | Migrate only simple tables first; complex stays hand-built. |

---

## 11. Build-vs-Directus (decision record)

Chosen: **build in-house (Option B)**, Directus as design reference only.
Reasons: resale needs it to be *our* IP/UX; domain features fight generic tools;
existing primitives + modules would be discarded by adopting Directus; Directus
BSL licensing complicates resale. Directus/AdminJS are worth studying for their
**collection-config shape** — copy the idea, not the code.

---

## 12. Phased plan

**Phase A — Proof of concept (≈3–4 days, read-only, zero risk):**
1. `GET /admin/_schema` introspection endpoint.
2. Config-draft generator (pure function: introspection → draft config, rule-based
   type inference).
3. One generic page `/admin/r/:resource` rendering `DataTable` from config for one
   simple table (e.g. `category` or `customers`), **read-only**.
4. Review: feel the gaps, refine the config format.

**Phase B — Generic CRUD:**
5. Generic CRUD API (`GET/POST/PATCH/DELETE /admin/r/:resource`) with config
   allowlisting + parameterized values.
6. Generic Drawer form (create/edit) from config, reusing `FormField`/`Select`/
   `ImageUpload`/`Toggle`.
7. Relations: resolve FK labels + relation Select options.

**Phase C — Extension system:**
8. Action registry (custom row/detail actions).
9. Custom field-renderer registry.
10. Sidebar generated from configs + registered custom pages.

**Phase D — Productization:**
11. Config storage (DB + export to file) + in-app config editor.
12. Setup wizard: introspect → (rule-based, optional ML) draft → confirm.
13. Migrate simple existing tables to generic; keep domain modules custom.

Stop after any phase and reassess. Phase A alone answers "is this worth it?"

---

## 13. One-line recommendation

Build your own schema-driven engine (Option B), **hybrid** (generic CRUD + custom
extension points), reuse the existing primitives as the render layer, put ML only
in a confirm-required setup assistant, and **start with the Phase-A read-only PoC**
before committing to the rest.
