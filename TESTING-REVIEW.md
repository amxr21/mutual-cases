# Testing & Recent Changes — Review Notes

> **Status: NOT committed / NOT pushed.** This document lists everything done in
> the current working session for your review before anything ships. Created
> 2026-06-25.

---

## 1. What this session added

### Automated test suites (new — the project previously had ZERO tests)

| Tier | Tool | Location | Count |
|---|---|---|---|
| Backend | **Jest + supertest** (DB layer mocked) | `backend/tests/` | 16 tests, 3 suites |
| Frontend | **Vitest + Testing Library** (jsdom) | `frontend/app/**/__tests__/` | 11 tests, 2 suites |

**Total: 27 tests, all passing.** Fast and offline — no real DB, no network.

Run them:
```bash
cd backend  && npm test     # jest
cd frontend && npm test     # vitest run
```

### A real bug the tests caught
While writing the RBAC tests, a test failed and exposed a **production bug**:
the Zod validation schemas (`staffRoleSchema`, `staffCreateSchema`) were never
updated to include the new `developer` role. So in production, **assigning the
developer role would have failed with a 422 validation error** before reaching
the controller — the DB/permissions/UI all knew about `developer`, but the
request validator rejected it. **Fixed** in `backend/validation/schemas.js`.

---

## 2. Files changed / added (this session)

### Backend
| File | Change |
|---|---|
| `backend/app.js` | **New.** Express app factory (`createApp({ rateLimit })`) — builds the app **without** binding a port or touching the DB, so tests can drive it with supertest. |
| `backend/server.js` | Slimmed to import `createApp()` and call `listen()`. Behaviour identical in production. |
| `backend/validation/schemas.js` | **Bug fix:** added `developer` to `staffRoleSchema` + `staffCreateSchema` enums. |
| `backend/package.json` | `test` / `test:watch` scripts; `jest` + `supertest` devDeps. |
| `backend/jest.config.js` | **New.** Jest config (node env, `tests/` matcher, silent logger). |
| `backend/tests/setupEnv.js` | **New.** Sets minimal env vars so config/app import cleanly in tests. |
| `backend/tests/helpers.js` | **New.** `tokenFor()` / `authHeader()` — mint valid JWTs for requests. |
| `backend/tests/accessControl.test.js` | **New.** RBAC + owner/developer governance rail (6 tests). |
| `backend/tests/cart.test.js` | **New.** Add-to-cart upsert + IDOR scoping (5 tests). |
| `backend/tests/orders.test.js` | **New.** Server-authoritative pricing + Buy Now cart behaviour (5 tests). |

### Frontend
| File | Change |
|---|---|
| `frontend/vitest.config.mjs` | **New.** Vitest config (jsdom, react plugin, `__tests__` matcher). |
| `frontend/vitest.setup.js` | **New.** jest-dom matchers. |
| `frontend/package.json` | `test` / `test:watch` scripts; vitest + testing-library devDeps. |
| `frontend/app/admin/lib/__tests__/permissions.test.js` | **New.** Client permissions mirror — role model + governance (6 tests). |
| `frontend/app/components/__tests__/PromoPopup.test.jsx` | **New.** 7-day cooldown logic for the promo popup (5 tests). |

### Docs
| File | Change |
|---|---|
| `TESTING-REVIEW.md` | **New** (this file). |
| `README.md` | Added a Testing section + recent-feature notes. |
| `ARCHITECTURE.md` | Appended a "Recent changes (2026-06-25)" section + testing infrastructure. |

---

## 3. What the tests cover (and why these)

These target the **highest-risk** surfaces — money and access control:

**Backend**
- **Admin gating:** anonymous → 401; customer → 403; a forged `role=admin` JWT
  claim is ignored because `requireAdmin` re-reads the role from the DB.
- **Governance rail:** a `developer` cannot promote anyone to owner/developer nor
  demote an existing owner (403); an `owner` can.
- **Cart upsert:** new line → 201 "added"; existing → 200 "incremented"; the
  upsert is keyed on the **JWT user id**, never a body-supplied `user_id` (the
  fix for the "record already exists" bug, now regression-guarded).
- **IDOR:** `GET /cart/:id` always queries the JWT user's id, ignoring the URL id.
- **Server-authoritative pricing:** a client sending `price: 1` for a qty-2 order
  still gets billed the DB price × 2 (the "pay 1 AED" attack is blocked).
- **Buy Now:** a normal order clears the whole cart; a `buy_now` order removes
  **only** the purchased item, leaving the rest of the cart intact.

**Frontend**
- **Permissions mirror** stays in lockstep with the backend (owner/developer full
  access; only owner governs owner/developer; manager/fulfillment/support scoped;
  null role grants nothing).
- **PromoPopup cooldown:** shows on a fresh visit, stays hidden within 7 days,
  reappears after, renders nothing with no featured codes, and stamps "seen".

---

## 4. Notes / decisions for your review

- **Mocked DB (your call).** Backend tests stub `dbClient`, so they verify
  **logic, auth, pricing, and the SQL emitted** — they do **not** catch real
  SQL/collation issues (e.g. the `orders.user_id` varchar gotcha). If you later
  want that fidelity, we can add a Dockerized MySQL integration suite.
- **No CI yet.** Tests run locally via `npm test`. A natural next step is a GitHub
  Action running both suites on push — say the word and I'll add it.
- **`server.js` refactor is behaviourally identical** in production (same
  middleware order, same routes). It only moved app construction into `app.js`.
- Nothing here touches the database or requires a migration.

---

## 5. Open items from earlier sessions (unrelated to tests)
- Swiper v11→v12 (1 critical advisory) — deferred, needs a breaking major bump.
- Social links are still `#` placeholders.
- Broader accessibility pass (alt text, labels, focus) not yet done.
