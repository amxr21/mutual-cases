# The Idea — Reusing & Productizing the Admin Dashboard

> **Purpose:** a complete map of every option for turning the Mutual admin
> dashboard into something **reusable across projects and/or sellable as a
> product** — each option explained in depth, with what it requires, what's
> possible, the tech involved, where ML/AI can (and cannot) help, costs,
> trade-offs, and a recommendation.
>
> Companion docs: [GENERIC-ADMIN-DESIGN.md](GENERIC-ADMIN-DESIGN.md) (deep technical
> design of the recommended "schema-driven" option) and
> [ARCHITECTURE.md](ARCHITECTURE.md) (current codebase).
>
> Status: strategy/options reference. Last updated 2026-06-15.

---

## 0. TL;DR — the landscape in one paragraph

There are **seven realistic options**, sitting on a spectrum from "barely any work,
limited reuse" to "build a product platform, huge work." The two ideas originally
floated — *"admin auto-creates the database tables"* and *"an ML model infers and
builds the project"* — are **anti-patterns** as literally stated (they're unsafe and
don't work reliably), but the **good versions** of both instincts live inside
Option 4 (schema-driven) and Option 7 (AI-assisted setup). The honest recommendation
is a **hybrid of Options 2 + 4 + 7**: extract the admin into its own app, make it
schema-driven so it renders any database from config, and add an AI **setup
assistant** that drafts that config (human confirms).

---

## 1. First principles — what "reuse" actually means

1. **The admin is deeply coupled to this store's schema.** The primitives
   (`DataTable`, `Drawer`, `Select`, `ConfirmDialog`, `FormField`) are generic; the
   pages and controllers are not. Reuse = moving coupling out of pages into config.
2. **The value is in domain features, not grids.** VAT invoices, review moderation,
   driver assignment, RMA — exactly what generic "table editor" tools do badly. Any
   reuse strategy must preserve these.
3. **Deployment is decided: self-hosted, single-tenant.** Each buyer/project runs
   its own copy + DB. No `tenant_id`. Simplifies most options; rules out shared SaaS.

**Golden rule:** the database schema is the source of truth; the admin reflects it.
An admin must **never author or mutate schema** (no `CREATE TABLE` from the UI).

---

## 2. Requirements any winning option must satisfy

- Connect to an existing DB and present tables for view/search/sort/filter/CRUD.
- Render by data meaning (money/enum/image/relation/date/PII).
- Preserve domain features via extension points.
- Per-project config (labels, visible columns, views, roles) stored per install.
- Auth + roles; safe writes (parameterized, transactional, allowlisted).
- Stay your IP (for resale); extraction-friendly; config/env-driven; maintainable.
- (If selling) setup/onboarding, licensing/distribution, versioning, docs.

---

## 3. The options

### Option 1 — Copy & adapt per project ("fork it")
Lowest effort: copy `app/admin/*` into each new project, hand-edit per schema.
**Pros:** no upfront build, full flexibility, domain features trivially preserved.
**Cons:** doesn't scale, fixes don't propagate, not sellable. **Best when:** ≤3 of
your own projects, no intent to sell.

### Option 2 — Extract into a standalone admin app (same schema)
Lift the admin into its own Next app talking to the same API. **Pros:** clean
product boundary, independent deploys, low risk. **Cons:** still single-schema —
a packaging win, not genericity. **Best when:** always, as step zero to productizing.

### Option 3 — Adopt an existing framework (Directus / AdminJS / Forest)
Point a ready tool at any SQL DB. **Pros:** days not weeks, battle-tested.
**Cons (decisive):** you discard your primitives + domain modules; not your IP/UX;
Directus is **BSL-licensed** (resale restrictions); domain features fight the
framework. **Best when:** internal tool, fast, not for resale. Study it as a
reference for "collection config"; don't ship its code.

### Option 4 — Build your own schema-driven engine ⭐ (recommended core)
Your own admin renders any table from a declarative **config** (generated as a draft
by introspecting the DB, then human-edited). Existing primitives become the render
layer. **Pros:** your IP/UX (sellable moat), reuses existing work, works on any
schema, hybrid keeps domain features. **Cons:** real upfront cost (4–8 weeks v1);
generic CRUD needs an extension system for domain logic. **Best when:** reuse across
projects AND sell as your product. De-risk with a 3–4 day read-only PoC first. See
[GENERIC-ADMIN-DESIGN.md](GENERIC-ADMIN-DESIGN.md).

### Option 5 — Config-only "headless" admin (no introspection)
Same generic UI/CRUD as Option 4, but the developer hand-writes a config file per
project (no auto-draft). **Pros:** most of Option 4's reuse, less to build; config
explicit + versioned. **Cons:** manual config per project. **Best when:** reuse
across your own projects is primary; a great Phase-1 milestone toward Option 4.

### Option 6 — Full multi-tenant SaaS platform
Hosted platform, many businesses, tenant isolation + billing + ops. **Pros:** the
SaaS dream. **Cons:** contradicts the single-tenant decision; months of work + ops
burden + security/compliance surface. **Best when:** only if you pivot to hosted
product. Out of scope today.

### Option 7 — AI/ML-assisted layer (overlay on 4/5)
The correct, safe home for the "ML infers the project" instinct. **Where it helps:**
(1) **setup assistant** — reads the introspected schema and drafts the config
(field types, labels, views), human confirms; (2) NL data queries → validated,
parameterized filters; (3) smart search/summarization; (4) anomaly hints; (5)
content help. **Hard boundaries:** never authors/alters schema; never emits raw SQL
that executes; never auto-applies without confirmation; never a hard dependency
(rules-first, ML-enhanced). **Tech:** Claude API (matches stack) for the assistant;
rules/heuristics cover ~80% with zero model. **Best when:** always, as a thin layer
once 4/5 exists — especially for the productized setup wizard.

---

## 4. Reshaping the two original ideas

| Idea (as stated) | Verdict | Good version |
|---|---|---|
| Admin **creates the tables** from the admin side | ❌ unsafe/backwards | ✅ **introspect** the existing schema (read, don't write) — Option 4 |
| **ML infers the project and builds it** | ❌ autonomous build is unreliable | ✅ ML **setup assistant** drafts config from the schema, human confirms — Option 7 |

Both instincts are right in *direction*; they just must point at the schema
(read-only) with a human in the loop.

---

## 5. Comparison matrix

| Option | Reuse | Sellable as yours | Effort | Keeps domain features | Your IP | ML role |
|---|---|---|---|---|---|---|
| 1 Copy & adapt | Weak | No | None | ✅ | ✅ | Coding assist |
| 2 Extract standalone | No | Resell *this* admin | Low | ✅ | ✅ | — |
| 3 Adopt Directus/AdminJS | ✅ | ❌ (their product) | Low–Med | ❌ awkward | ❌ | Minor |
| **4 Schema-driven (own)** ⭐ | ✅ | ✅ | High | ✅ (extensions) | ✅ | Setup assistant |
| 5 Config-only (own) | ✅ | ✅ (tech buyers) | Med | ✅ (extensions) | ✅ | Config drafting |
| 6 Multi-tenant SaaS | ✅ Max | ✅ SaaS | Very high | ✅ | ✅ | At scale |
| 7 AI assist (overlay) | (enhancer) | (enhancer) | Low–Med | n/a | ✅ | **Core** |

---

## 6. Recommended path

A hybrid of **2 + 4 + 7**, reached incrementally, de-risked first:
1. **Extract** the admin (Option 2) — packaging win, prerequisite.
2. **PoC** (Option 4, read-only): introspection + config-draft generator + one
   generic table page. 3–4 days; answers "is this worth it?".
3. **Generic CRUD** (4/5): config-driven create/edit/delete + relations.
4. **Extensions** (4): action + renderer registries + custom pages → domain features.
5. **Productize + AI assist** (4 + 7): config storage + setup wizard (rules-first,
   ML-polished).
6. (Later, only if pivoting) **SaaS** (Option 6).

Domain modules stay hand-built; simple tables go generic first. Hybrid is the design.

---

## 7. Open decisions

- Greenlight the Phase-A read-only PoC? (Recommended.)
- DB targets: MySQL only, or also Postgres? (Affects introspection.)
- Config storage: file vs DB vs both?
- ML provider: Claude API vs rules-only to start?
- Sell model: one-time license vs support/subscription?
- Timeline: 4–8 weeks for a v1 engine, or the lighter Option 5 first?

---

## 8. One-line recommendation

Extract the admin (Option 2), build your own schema-driven engine (Option 4) in a
hybrid with custom extension points, overlay an AI setup-assistant (Option 7,
rules-first), study Directus (Option 3) only as a reference, and start with the
Phase-A read-only proof-of-concept before committing the rest. Avoid Options 1
(doesn't scale) and 6 (contradicts single-tenant) for now.
