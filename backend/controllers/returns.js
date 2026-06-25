/**
 * Returns / Exchanges / Refunds (RMA) controllers.
 *
 * - Customer: request a return on their own (delivered) order, listing which
 *   items + quantities + a reason.
 * - Admin: list the queue, approve (restock + refund/store-credit/exchange) or
 *   reject. Approving restocks the items (if chosen), processes the refund via
 *   the refund-provider stub, or credits the customer's store-credit balance,
 *   and moves the order to "Returned".
 *
 * Refunds to a live payment provider are stubbed behind payments/refundProvider.
 */
const { query, withTransaction } = require("../dbClient");
const { badRequest, notFound, forbidden, conflict } = require("../errors/AppError");
const logger = require("../logger");
const { processRefund } = require("../payments/refundProvider");
const { audit } = require("../audit");

const STATUS_RETURNED = 6;

/** Build the line-items detail for a return id. */
const itemsForReturn = (id) =>
    query(
        `SELECT ri.product_id, ri.quantity, ri.price, p.model, p.category
         FROM return_items ri JOIN products p ON p.id = ri.product_id
         WHERE ri.return_id = ?`,
        [id]
    );

// --- Customer -------------------------------------------------------------

/** POST /returns — customer requests a return on their own order. */
const requestReturn = async (req, res) => {
    const userId = req.user.id;
    const { order_number, reason, items } = req.body;

    // The order must belong to the requester and be delivered.
    const orders = await query(
        "SELECT id, status_id FROM orders WHERE order_number = ? AND user_id = ?",
        [order_number, String(userId)],
        { op: "returns.request.findOrder" }
    );
    if (!orders.length) throw notFound("Order not found");
    const order = orders[0];
    if (Number(order.status_id) !== 4) {
        throw badRequest("Only delivered orders can be returned");
    }

    // Prevent a duplicate open request for the same order.
    const open = await query(
        "SELECT 1 FROM returns WHERE order_id = ? AND status IN ('requested','approved')",
        [order.id]
    );
    if (open.length) throw conflict("A return request for this order is already in progress");

    // Validate requested items against the order's actual line items.
    const orderItems = await query(
        "SELECT product_id, quantity, price FROM order_items WHERE order_id = ?",
        [order.id]
    );
    const byProduct = new Map(orderItems.map((it) => [Number(it.product_id), it]));
    const resolved = [];
    for (const it of items) {
        const oi = byProduct.get(Number(it.product_id));
        if (!oi) throw badRequest("An item isn't part of this order");
        const qty = Math.min(Math.max(1, Number(it.quantity) || 1), Number(oi.quantity));
        resolved.push({ product_id: Number(it.product_id), quantity: qty, price: Number(oi.price) });
    }
    if (!resolved.length) throw badRequest("Select at least one item to return");

    const id = await withTransaction(async (tx) => {
        const r = await tx(
            "INSERT INTO returns (order_id, user_id, status, reason) VALUES (?, ?, 'requested', ?)",
            [order.id, userId, reason || null]
        );
        for (const it of resolved) {
            await tx(
                "INSERT INTO return_items (return_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [r.insertId, it.product_id, it.quantity, it.price]
            );
        }
        return r.insertId;
    }, { op: "returns.request" });

    res.status(201).json({ message: "Return requested", id });
};

/** GET /returns/mine — the customer's own return requests. */
const myReturns = async (req, res) => {
    const rows = await query(
        `SELECT r.id, r.status, r.reason, r.resolution, r.refund_amount, r.created_at,
                o.order_number
         FROM returns r JOIN orders o ON o.id = r.order_id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [req.user.id],
        { op: "returns.mine" }
    );
    res.json(rows);
};

// --- Admin ----------------------------------------------------------------

/** GET /admin/returns[?status=] — the RMA queue. */
const listReturns = async (req, res) => {
    const status = req.query.status ? String(req.query.status) : null;
    const params = [];
    let where = "";
    if (status) {
        if (!["requested", "approved", "rejected", "completed"].includes(status)) {
            throw badRequest("Invalid status filter");
        }
        where = "WHERE r.status = ?";
        params.push(status);
    }
    const rows = await query(
        `SELECT r.id, r.status, r.reason, r.resolution, r.refund_amount, r.restock,
                r.created_at, r.resolved_at, o.order_number, o.total, o.payment_method,
                u.name AS customer_name, u.email AS customer_email,
                (SELECT COUNT(*) FROM return_items ri WHERE ri.return_id = r.id) AS item_count
         FROM returns r
         JOIN orders o ON o.id = r.order_id
         LEFT JOIN users u ON u.id = r.user_id
         ${where}
         ORDER BY FIELD(r.status,'requested','approved','rejected','completed'), r.created_at DESC`,
        params,
        { op: "admin.listReturns" }
    );
    res.json(rows);
};

/** GET /admin/returns/:id — one return with its items. */
const getReturn = async (req, res) => {
    const id = Number(req.params.id);
    const rows = await query(
        `SELECT r.*, o.order_number, o.total, o.payment_method,
                u.name AS customer_name, u.email AS customer_email
         FROM returns r JOIN orders o ON o.id = r.order_id
         LEFT JOIN users u ON u.id = r.user_id
         WHERE r.id = ?`,
        [id],
        { op: "admin.getReturn" }
    );
    if (!rows.length) throw notFound("Return not found");
    res.json({ ...rows[0], items: await itemsForReturn(id) });
};

/**
 * PATCH /admin/returns/:id/approve — approve a return.
 * Body: { resolution: refund|store_credit|exchange, restock?:bool, refund_amount?:number, admin_note? }
 * Restocks items (if chosen), issues the refund/credit, sets the order to Returned.
 */
const approveReturn = async (req, res) => {
    const id = Number(req.params.id);
    const { resolution, restock = true, refund_amount, admin_note } = req.body;
    if (!["refund", "store_credit", "exchange"].includes(resolution)) {
        throw badRequest("Invalid resolution");
    }

    const rows = await query(
        `SELECT r.*, o.order_number, o.payment_method
         FROM returns r JOIN orders o ON o.id = r.order_id WHERE r.id = ?`,
        [id],
        { op: "admin.approveReturn.find" }
    );
    if (!rows.length) throw notFound("Return not found");
    const ret = rows[0];
    if (ret.status !== "requested") throw badRequest("This return is no longer pending");

    const items = await itemsForReturn(id);
    // Default the refund/credit amount to the value of the returned items.
    const itemsValue = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
    const amount = resolution === "exchange" ? 0 : Number(refund_amount ?? itemsValue);

    await withTransaction(async (tx) => {
        // Restock returned items.
        if (restock) {
            for (const it of items) {
                await tx(
                    `UPDATE stock_quantity sq JOIN products p ON p.stock_quantity_id = sq.stock_id
                     SET sq.quantity = sq.quantity + ? WHERE p.id = ?`,
                    [it.quantity, it.product_id]
                );
                await tx(
                    `INSERT INTO stock_adjustments (product_id, delta, reason, note, resulting_qty, adjusted_by)
                     SELECT ?, ?, 'return', ?, sq.quantity, ?
                     FROM stock_quantity sq JOIN products p ON p.stock_quantity_id = sq.stock_id
                     WHERE p.id = ?`,
                    [it.product_id, it.quantity, `Return #${id}`, req.user.id, it.product_id]
                );
            }
        }

        // Store-credit resolution: add to the customer's balance.
        if (resolution === "store_credit" && ret.user_id) {
            await tx("UPDATE users SET store_credit = store_credit + ? WHERE id = ?", [amount, ret.user_id]);
        }

        await tx(
            `UPDATE returns
             SET status = 'completed', resolution = ?, restock = ?, refund_amount = ?,
                 admin_note = ?, resolved_at = NOW(), resolved_by = ?
             WHERE id = ?`,
            [resolution, restock ? 1 : 0, amount, admin_note || null, req.user.id, id]
        );

        // Move the order to Returned + log the timeline.
        await tx("UPDATE orders SET status_id = ? WHERE id = ?", [STATUS_RETURNED, ret.order_id]);
        await tx(
            "INSERT INTO order_status_history (order_id, status_id, changed_by, note) VALUES (?, ?, ?, ?)",
            [ret.order_id, STATUS_RETURNED, req.user.id, `Return ${resolution}`]
        );
    }, { op: "admin.approveReturn" });

    // Process the actual money refund via the provider stub (best-effort).
    let refund = null;
    if (resolution === "refund" && amount > 0) {
        refund = await processRefund({ orderNumber: ret.order_number, amount, method: ret.payment_method }).catch(
            (e) => {
                logger.error("processRefund failed", { id, message: e?.message });
                return { ok: false };
            }
        );
    }

    await audit(req, "return.approve", { entity: "return", entityId: id, detail: `${resolution} ${amount} AED` });
    res.json({ message: "Return approved", resolution, refund_amount: amount, refund });
};

/** PATCH /admin/returns/:id/reject — reject a return. */
const rejectReturn = async (req, res) => {
    const id = Number(req.params.id);
    const result = await query(
        "UPDATE returns SET status = 'rejected', admin_note = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ? AND status = 'requested'",
        [req.body.admin_note || null, req.user.id, id],
        { op: "admin.rejectReturn" }
    );
    if (!result.affectedRows) {
        const exists = await query("SELECT 1 FROM returns WHERE id = ?", [id]);
        if (!exists.length) throw notFound("Return not found");
        throw badRequest("This return is no longer pending");
    }
    await audit(req, "return.reject", { entity: "return", entityId: id });
    res.json({ message: "Return rejected" });
};

module.exports = {
    requestReturn,
    myReturns,
    listReturns,
    getReturn,
    approveReturn,
    rejectReturn,
};
