/**
 * Discounts / Promotions controllers.
 *
 * - Public: validate a code against a cart subtotal (returns the computed
 *   discount, or a clear reason it doesn't apply).
 * - Admin: CRUD for discount codes + a redemptions view.
 *
 * `evaluateDiscount` is the single source of truth used by both the public
 * validate endpoint and order creation, so checkout and the server agree.
 */
const { query } = require("../dbClient");
const { badRequest, notFound, conflict } = require("../errors/AppError");
const { audit } = require("../audit");

/**
 * Evaluate a code for a given subtotal + user. Returns
 * { ok, discount, reason } where discount = { id, code, type, value, amount,
 * freeShipping }. Pure read — does not record redemption.
 */
async function evaluateDiscount(code, subtotal, userId) {
    const norm = String(code || "").trim().toUpperCase();
    if (!norm) return { ok: false, reason: "Enter a code" };

    const rows = await query("SELECT * FROM discounts WHERE code = ?", [norm], {
        op: "discounts.evaluate",
    });
    if (!rows.length) return { ok: false, reason: "Invalid code" };
    const d = rows[0];

    const now = Date.now();
    if (!d.active) return { ok: false, reason: "This code is no longer active" };
    if (d.starts_at && new Date(d.starts_at).getTime() > now) return { ok: false, reason: "This code isn't active yet" };
    if (d.expires_at && new Date(d.expires_at).getTime() < now) return { ok: false, reason: "This code has expired" };
    if (d.max_uses != null && Number(d.used_count) >= Number(d.max_uses)) {
        return { ok: false, reason: "This code has reached its usage limit" };
    }
    if (Number(subtotal) < Number(d.min_spend)) {
        return { ok: false, reason: `Spend at least ${Number(d.min_spend)} AED to use this code` };
    }
    // Per-customer limit.
    if (d.per_customer_limit != null && userId) {
        const [used] = await query(
            "SELECT COUNT(*) AS c FROM discount_redemptions WHERE discount_id = ? AND user_id = ?",
            [d.id, String(userId)]
        );
        if (Number(used.c) >= Number(d.per_customer_limit)) {
            return { ok: false, reason: "You've already used this code" };
        }
    }
    // First-order-only: reject if the customer already has any order.
    if (d.first_order_only) {
        if (!userId) return { ok: false, reason: "Sign in to use this first-order offer" };
        const [prior] = await query(
            "SELECT COUNT(*) AS c FROM orders WHERE user_id = ?",
            [String(userId)]
        );
        if (Number(prior.c) > 0) {
            return { ok: false, reason: "This code is for first orders only" };
        }
    }

    // Compute the discount amount.
    let amount = 0;
    let freeShipping = false;
    if (d.type === "percent") amount = (Number(subtotal) * Number(d.value)) / 100;
    else if (d.type === "fixed") amount = Number(d.value);
    else if (d.type === "free_shipping") freeShipping = true;
    amount = Math.min(Math.round(amount * 100) / 100, Number(subtotal)); // never exceed subtotal

    return {
        ok: true,
        discount: { id: d.id, code: d.code, type: d.type, value: Number(d.value), amount, freeShipping },
    };
}

/** GET /discounts/featured — public: active, featured, currently-valid codes for the storefront banner. */
const featuredDiscounts = async (_req, res) => {
    const rows = await query(
        `SELECT code, type, value, min_spend, first_order_only, expires_at
         FROM discounts
         WHERE featured = 1 AND active = 1
           AND (starts_at IS NULL OR starts_at <= NOW())
           AND (expires_at IS NULL OR expires_at >= NOW())
           AND (max_uses IS NULL OR used_count < max_uses)
         ORDER BY expires_at IS NULL, expires_at ASC
         LIMIT 5`,
        [],
        { op: "discounts.featured" }
    );
    res.json(rows);
};

/** POST /discounts/validate — public: check a code against a subtotal. */
const validateDiscount = async (req, res) => {
    const { code, subtotal } = req.body;
    const userId = req.user?.id || null; // optional auth
    const result = await evaluateDiscount(code, Number(subtotal) || 0, userId);
    if (!result.ok) throw badRequest(result.reason);
    res.json(result.discount);
};

// --- Admin CRUD -----------------------------------------------------------

const listDiscounts = async (_req, res) => {
    const rows = await query("SELECT * FROM discounts ORDER BY created_at DESC", [], {
        op: "admin.listDiscounts",
    });
    res.json(rows);
};

const createDiscount = async (req, res) => {
    const b = req.body;
    const code = String(b.code).trim().toUpperCase();
    const existing = await query("SELECT 1 FROM discounts WHERE code = ?", [code]);
    if (existing.length) throw conflict("A discount with that code already exists");

    const result = await query(
        `INSERT INTO discounts
            (code, type, value, min_spend, max_uses, per_customer_limit, starts_at, expires_at, active, first_order_only, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            code, b.type, b.value || 0, b.min_spend || 0,
            b.max_uses ?? null, b.per_customer_limit ?? null,
            b.starts_at || null, b.expires_at || null, b.active ? 1 : 0,
            b.first_order_only ? 1 : 0, b.featured ? 1 : 0,
        ],
        { op: "admin.createDiscount" }
    );
    await audit(req, "discount.create", { entity: "discount", entityId: result.insertId, detail: code });
    res.status(201).json({ id: result.insertId, message: "Discount created" });
};

const updateDiscount = async (req, res) => {
    const id = Number(req.params.id);
    const fields = ["type", "value", "min_spend", "max_uses", "per_customer_limit", "starts_at", "expires_at", "active", "first_order_only", "featured"];
    const sets = [];
    const params = [];
    for (const f of fields) {
        if (f in req.body) {
            sets.push(`\`${f}\` = ?`);
            let v = req.body[f];
            if (f === "active" || f === "first_order_only" || f === "featured") v = v ? 1 : 0;
            if ((f === "max_uses" || f === "per_customer_limit" || f === "starts_at" || f === "expires_at") && (v === "" || v == null)) v = null;
            params.push(v);
        }
    }
    if (!sets.length) throw badRequest("Provide at least one field to update");
    params.push(id);
    const result = await query(`UPDATE discounts SET ${sets.join(", ")} WHERE id = ?`, params, {
        op: "admin.updateDiscount",
    });
    if (!result.affectedRows) {
        const exists = await query("SELECT 1 FROM discounts WHERE id = ?", [id]);
        if (!exists.length) throw notFound("Discount not found");
    }
    await audit(req, "discount.update", { entity: "discount", entityId: id, detail: sets.map((s) => s.split(" ")[0].replace(/`/g, "")).join(",") });
    res.json({ message: "Discount updated" });
};

const deleteDiscount = async (req, res) => {
    const id = Number(req.params.id);
    const result = await query("DELETE FROM discounts WHERE id = ?", [id], { op: "admin.deleteDiscount" });
    if (!result.affectedRows) throw notFound("Discount not found");
    await audit(req, "discount.delete", { entity: "discount", entityId: id });
    res.json({ message: "Discount deleted" });
};

module.exports = {
    evaluateDiscount,
    validateDiscount,
    featuredDiscounts,
    listDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
};
