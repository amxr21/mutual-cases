/**
 * Inventory controllers (admin).
 *
 * Stock lives in stock_quantity.quantity (joined to products via stock_id).
 * This module adds: reserved-vs-available, per-product low-stock thresholds,
 * an audit log of every stock change (reason + who + when), and back-in-stock
 * email notifications fired when a product goes from 0 to in-stock.
 *
 * Mounted behind requireAdmin in adminRoutes (except the public subscribe route,
 * which lives in productsRoutes).
 */
const { query, withTransaction } = require("../dbClient");
const { badRequest, notFound } = require("../errors/AppError");
const logger = require("../logger");
const { sendEmail } = require("../email/mailer");
const { backInStockEmail } = require("../email/templates");
const config = require("../config");
const { audit } = require("../audit");

const REASONS = new Set(["restock", "correction", "damaged", "lost", "return", "manual"]);

/** Shared SELECT: per-product stock with available = quantity - reserved. */
const INVENTORY_SELECT = `
    SELECT p.id, p.model, p.edition, p.category, t.type, p.price,
           sq.quantity, sq.reserved, sq.low_stock_threshold,
           (sq.quantity - sq.reserved) AS available
    FROM products p
    JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
    JOIN types t ON t.id = p.type_id
`;

/** GET /admin/inventory — all products with stock + reserved + available + flags. */
const listInventory = async (_req, res) => {
    const rows = await query(`${INVENTORY_SELECT} ORDER BY sq.quantity ASC`, [], {
        op: "admin.listInventory",
    });
    res.json(
        rows.map((r) => ({
            ...r,
            outOfStock: Number(r.quantity) <= 0,
            lowStock: Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.low_stock_threshold),
        }))
    );
};

/**
 * POST /admin/inventory/:id/adjust — change a product's stock by `delta`.
 * Body: { delta:int (non-zero), reason, note? }
 * Transactional: updates quantity, logs the adjustment, and (if stock rose from
 * 0 to positive) fires back-in-stock notifications.
 */
const adjustStock = async (req, res) => {
    const productId = Number(req.params.id);
    const delta = Number(req.body.delta);
    const reason = String(req.body.reason || "manual");
    const note = req.body.note ? String(req.body.note).slice(0, 255) : null;

    if (!Number.isInteger(delta) || delta === 0) throw badRequest("Delta must be a non-zero integer");
    if (!REASONS.has(reason)) throw badRequest("Invalid reason");

    const { resultingQty, wasZero } = await withTransaction(async (tx) => {
        // Lock the stock row for this product.
        const rows = await tx(
            `SELECT sq.id, sq.quantity FROM stock_quantity sq
             JOIN products p ON p.stock_quantity_id = sq.stock_id
             WHERE p.id = ? FOR UPDATE`,
            [productId]
        );
        if (!rows.length) throw notFound("Product not found");
        const current = Number(rows[0].quantity);
        const next = current + delta;
        if (next < 0) throw badRequest("Adjustment would make stock negative");

        await tx(`UPDATE stock_quantity SET quantity = ? WHERE id = ?`, [next, rows[0].id]);
        await tx(
            `INSERT INTO stock_adjustments (product_id, delta, reason, note, resulting_qty, adjusted_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, delta, reason, note, next, req.user.id]
        );
        return { resultingQty: next, wasZero: current <= 0 };
    }, { op: "admin.adjustStock" });

    await audit(req, "inventory.adjust", { entity: "product", entityId: productId, detail: `${delta > 0 ? "+" : ""}${delta} (${reason}) → ${resultingQty}` });
    res.json({ message: "Stock adjusted", quantity: resultingQty });

    // If stock just came back (0 -> positive), notify subscribers (best-effort).
    if (wasZero && resultingQty > 0) {
        notifyBackInStock(productId).catch((e) =>
            logger.error("notifyBackInStock failed", { productId, message: e?.message })
        );
    }
};

/** Email everyone subscribed to this product's back-in-stock list, then mark sent. */
async function notifyBackInStock(productId) {
    const subs = await query(
        "SELECT id, email FROM stock_notifications WHERE product_id = ? AND notified = 0",
        [productId],
        { op: "inventory.notifyBackInStock.list" }
    );
    if (!subs.length) return;

    const prodRows = await query(
        `SELECT p.id, p.model, p.category FROM products p WHERE p.id = ?`,
        [productId]
    );
    const product = prodRows[0];
    if (!product) return;

    for (const s of subs) {
        const msg = backInStockEmail({
            product,
            url: `${config.email.siteUrl}/products/${productId}`,
        });
        await sendEmail({ to: s.email, subject: msg.subject, html: msg.html, text: msg.text });
    }
    await query("UPDATE stock_notifications SET notified = 1 WHERE product_id = ? AND notified = 0", [
        productId,
    ]);
    logger.info("back-in-stock notifications sent", { productId, count: subs.length });
}

/** GET /admin/inventory/:id/adjustments — adjustment history for one product. */
const listAdjustments = async (req, res) => {
    const productId = Number(req.params.id);
    const rows = await query(
        `SELECT a.delta, a.reason, a.note, a.resulting_qty, a.created_at, u.name AS adjusted_by_name
         FROM stock_adjustments a LEFT JOIN users u ON u.id = a.adjusted_by
         WHERE a.product_id = ?
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT 100`,
        [productId],
        { op: "admin.listAdjustments" }
    );
    res.json(rows);
};

/** PATCH /admin/inventory/:id/threshold — set the low-stock alert threshold. */
const setThreshold = async (req, res) => {
    const productId = Number(req.params.id);
    const threshold = Number(req.body.low_stock_threshold);
    if (!Number.isInteger(threshold) || threshold < 0) throw badRequest("Invalid threshold");

    const result = await query(
        `UPDATE stock_quantity sq
         JOIN products p ON p.stock_quantity_id = sq.stock_id
         SET sq.low_stock_threshold = ?
         WHERE p.id = ?`,
        [threshold, productId],
        { op: "admin.setThreshold" }
    );
    if (!result.affectedRows) throw notFound("Product not found");
    await audit(req, "inventory.threshold", { entity: "product", entityId: Number(req.params.id), detail: `= ${threshold}` });
    res.json({ message: "Threshold updated", low_stock_threshold: threshold });
};

/** POST /products/:id/notify-stock — PUBLIC: subscribe an email for back-in-stock. */
const subscribeBackInStock = async (req, res) => {
    const productId = Number(req.params.id);
    const email = String(req.body.email || "").trim();

    const prod = await query("SELECT 1 FROM products p WHERE p.id = ?", [productId]);
    if (!prod.length) throw notFound("Product not found");

    await query(
        `INSERT INTO stock_notifications (product_id, email) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE notified = 0`,
        [productId, email],
        { op: "inventory.subscribeBackInStock" }
    );
    res.status(201).json({ message: "You'll be emailed when this is back in stock" });
};

module.exports = {
    listInventory,
    adjustStock,
    listAdjustments,
    setThreshold,
    subscribeBackInStock,
};
