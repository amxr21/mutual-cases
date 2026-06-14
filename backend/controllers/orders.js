/**
 * Orders controller — checkout (create), fetch by number (track), and a simple
 * "mark paid" placeholder that advances status (stands in for a real payment
 * webhook). All writes are transactional; queries parameterized.
 */
const { query, withTransaction } = require("../dbClient");
const { notFound, badRequest } = require("../errors/AppError");

const STATUS = { PENDING: 1, CONFIRMED: 2, SHIPPED: 3, DELIVERED: 4, CANCELED: 5, RETURNED: 6 };

const genOrderNumber = () =>
    "MTL-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 9000 + 1000);

/**
 * POST /orders — create an order from the user's cart snapshot + address.
 * Body: { user_id, address:{country,city,area,address}, items:[{product_id,quantity}],
 *         note, gift, gift_message }
 * Server re-reads prices/lookup ids from the DB (never trusts client prices).
 */
const createOrder = async (req, res) => {
    const user_id = req.user.id; // from JWT
    const { address, items, note = "", gift = 0, gift_message = "", payment_method = "cod" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        throw badRequest("Your cart is empty");
    }

    const orderNumber = genOrderNumber();

    const result = await withTransaction(async (tx) => {
        // Resolve each cart item against the DB for trusted price + lookup ids.
        let total = 0;
        const resolved = [];
        for (const it of items) {
            const rows = await tx(
                `SELECT p.id, p.price, p.edition, p.model, p.category,
                        sq.edition_id, sq.model_id, sq.category_id
                 FROM products p
                 JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
                 WHERE p.id = ?`,
                [it.product_id]
            );
            if (!rows.length) continue;
            const p = rows[0];
            const qty = Math.max(1, Number(it.quantity) || 1);
            total += Number(p.price) * qty;
            resolved.push({ ...p, qty });
        }

        if (!resolved.length) throw badRequest("None of the cart items are valid");

        const orderRes = await tx(
            `INSERT INTO orders (user_id, order_date, status_id, note, gift, gift_message, total, order_number, payment_method)
             VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
            [String(user_id), STATUS.PENDING, note, gift ? 1 : 0, gift_message, total, orderNumber, payment_method]
        );
        const orderId = orderRes.insertId;

        for (const r of resolved) {
            await tx(
                `INSERT INTO order_items (order_id, product_id, quantity, price, edition_id, model_id, category_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, r.id, r.qty, r.price, r.edition_id, r.model_id, r.category_id]
            );
        }

        await tx(
            `INSERT INTO addresses (order_id, country, city, area, address) VALUES (?, ?, ?, ?, ?)`,
            [orderId, address.country, address.city, address.area, address.address || null]
        );

        // Clear the user's cart now that it's an order.
        await tx(`DELETE FROM cart_items WHERE user_id = ?`, [user_id]);

        return { orderId, orderNumber, total };
    }, { op: "createOrder" });

    res.status(201).json({
        message: "Order created",
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
    });
};

/** GET /orders — list the authenticated user's orders (newest first). */
const getMyOrders = async (req, res) => {
    const userId = req.user.id;
    const rows = await query(
        `SELECT o.order_number, o.order_date, o.status_id, s.status, o.total, o.payment_method,
                COUNT(oi.id) AS item_count
         FROM orders o
         JOIN order_status s ON s.id = o.status_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ?
         GROUP BY o.id
         ORDER BY o.order_date DESC`,
        [String(userId)],
        { op: "getMyOrders" }
    );
    res.json(rows);
};

/** GET /orders/:orderNumber — full order for the success + track pages.
 *  Owner-only: the order must belong to the authenticated user. */
const getOrder = async (req, res) => {
    const { orderNumber } = req.params;
    const userId = req.user.id;

    const orders = await query(
        `SELECT o.id, o.order_number, o.order_date, o.status_id, s.status, o.note, o.gift,
                o.gift_message, o.total, o.payment_method
         FROM orders o JOIN order_status s ON s.id = o.status_id
         WHERE o.order_number = ? AND o.user_id = ?`,
        [orderNumber, String(userId)],
        { op: "getOrder" }
    );
    // Same message whether missing or not-owned, so we don't leak existence.
    if (!orders.length) throw notFound("No order found with that number");
    const order = orders[0];

    const items = await query(
        `SELECT oi.product_id, oi.quantity, oi.price, p.model, p.edition, p.category,
                p.image_url_1, t.type
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN types t ON t.id = p.type_id
         WHERE oi.order_id = ?`,
        [order.id],
        { op: "getOrder.items" }
    );

    const addr = await query(
        `SELECT country, city, area, address FROM addresses WHERE order_id = ? LIMIT 1`,
        [order.id],
        { op: "getOrder.address" }
    );

    res.json({ ...order, items, address: addr[0] || null });
};

/** POST /orders/:orderNumber/pay — placeholder: marks the order Confirmed. */
const markPaid = async (req, res) => {
    const { orderNumber } = req.params;
    const userId = req.user.id;
    const result = await query(
        `UPDATE orders SET status_id = ? WHERE order_number = ? AND user_id = ? AND status_id = ?`,
        [STATUS.CONFIRMED, orderNumber, String(userId), STATUS.PENDING],
        { op: "markPaid" }
    );
    if (!result.affectedRows) {
        // Either already paid or not owned/found — surface a clean message.
        const exists = await query(
            "SELECT id FROM orders WHERE order_number = ? AND user_id = ?",
            [orderNumber, String(userId)]
        );
        if (!exists.length) throw notFound("No order found with that number");
    }
    res.json({ message: "Payment confirmed", status: "Confirmed" });
};

module.exports = { createOrder, getMyOrders, getOrder, markPaid, STATUS };
