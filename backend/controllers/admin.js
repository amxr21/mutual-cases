/**
 * Admin controllers — power the owner dashboard. Every route that mounts these
 * is behind requireAdmin (DB-verified role), so these handlers assume an admin.
 * All queries parameterized; status updates validated against a fixed set.
 */
const { query } = require("../dbClient");
const { badRequest, notFound } = require("../errors/AppError");

const VALID_STATUS_IDS = new Set([1, 2, 3, 4, 5, 6]); // order_status table

/** Dashboard overview: headline counts + revenue + recent orders. */
const getOverview = async (_req, res) => {
    const [[products], [orders], [customers], [customs], revenueRows, statusBreakdown, recent] =
        await Promise.all([
            query("SELECT COUNT(*) AS c FROM products"),
            query("SELECT COUNT(*) AS c FROM orders"),
            query("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'"),
            query("SELECT COUNT(*) AS c FROM custom_orders"),
            // Revenue from confirmed+ orders (exclude pending/canceled).
            query("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status_id IN (2,3,4)"),
            query(
                `SELECT s.status, COUNT(o.id) AS count
                 FROM order_status s LEFT JOIN orders o ON o.status_id = s.id
                 GROUP BY s.id ORDER BY s.id`
            ),
            query(
                `SELECT o.order_number, o.order_date, o.total, s.status
                 FROM orders o JOIN order_status s ON s.id = o.status_id
                 ORDER BY o.order_date DESC LIMIT 8`
            ),
        ]);

    res.json({
        totals: {
            products: products.c,
            orders: orders.c,
            customers: customers.c,
            customRequests: customs.c,
            revenue: Number(revenueRows[0]?.revenue || 0),
            pending: statusBreakdown.find((s) => s.status === "Pending")?.count || 0,
        },
        statusBreakdown,
        recentOrders: recent,
    });
};

/** All orders (optionally filtered by status_id). */
const listOrders = async (req, res) => {
    const statusId = req.query.status ? Number(req.query.status) : null;
    const params = [];
    let where = "";
    if (statusId) {
        if (!VALID_STATUS_IDS.has(statusId)) throw badRequest("Invalid status filter");
        where = "WHERE o.status_id = ?";
        params.push(statusId);
    }

    const rows = await query(
        `SELECT o.id, o.order_number, o.order_date, o.status_id, s.status, o.total,
                o.payment_method, o.gift, o.note, u.name AS customer_name, u.email AS customer_email,
                COUNT(oi.id) AS item_count
         FROM orders o
         JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         ${where}
         GROUP BY o.id
         ORDER BY o.order_date DESC`,
        params,
        { op: "admin.listOrders" }
    );
    res.json(rows);
};

/** Full detail of one order (admin can view any). */
const getOrderDetail = async (req, res) => {
    const { orderNumber } = req.params;
    const orders = await query(
        `SELECT o.id, o.order_number, o.order_date, o.status_id, s.status, o.total, o.payment_method,
                o.gift, o.gift_message, o.note, u.name AS customer_name, u.email AS customer_email
         FROM orders o JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         WHERE o.order_number = ?`,
        [orderNumber],
        { op: "admin.getOrderDetail" }
    );
    if (!orders.length) throw notFound("Order not found");
    const order = orders[0];

    const [items, addr] = await Promise.all([
        query(
            `SELECT oi.product_id, oi.quantity, oi.price, p.model, p.edition, p.category, t.type
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             JOIN types t ON t.id = p.type_id
             WHERE oi.order_id = ?`,
            [order.id]
        ),
        query(`SELECT country, city, area, address FROM addresses WHERE order_id = ? LIMIT 1`, [order.id]),
    ]);

    res.json({ ...order, items, address: addr[0] || null });
};

/** Update an order's status (admin-controlled transition). */
const updateOrderStatus = async (req, res) => {
    const { orderNumber } = req.params;
    const statusId = Number(req.body.status_id);
    if (!VALID_STATUS_IDS.has(statusId)) throw badRequest("Invalid status");

    const result = await query(
        "UPDATE orders SET status_id = ? WHERE order_number = ?",
        [statusId, orderNumber],
        { op: "admin.updateOrderStatus" }
    );
    if (!result.affectedRows) throw notFound("Order not found");
    res.json({ message: "Order status updated", status_id: statusId });
};

/** List custom-it requests. */
const listCustomRequests = async (_req, res) => {
    const rows = await query(
        `SELECT c.id, c.model, c.sentence, c.type, c.design, c.comments, c.status, c.created_at,
                u.name AS customer_name, u.email AS customer_email
         FROM custom_orders c LEFT JOIN users u ON u.id = c.user_id
         ORDER BY c.created_at DESC`,
        [],
        { op: "admin.listCustomRequests" }
    );
    res.json(rows);
};

const CUSTOM_STATUSES = new Set(["pending", "in_review", "approved", "rejected", "completed"]);

/** Update a custom request's status. */
const updateCustomStatus = async (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();
    if (!CUSTOM_STATUSES.has(status)) throw badRequest("Invalid status");
    const result = await query("UPDATE custom_orders SET status = ? WHERE id = ?", [status, id], {
        op: "admin.updateCustomStatus",
    });
    if (!result.affectedRows) throw notFound("Request not found");
    res.json({ message: "Request updated", status });
};

/** List customers (users). */
const listCustomers = async (_req, res) => {
    const rows = await query(
        `SELECT u.id, u.name, u.email, u.role, u.created_at,
                COUNT(DISTINCT o.id) AS order_count,
                COALESCE(SUM(CASE WHEN o.status_id IN (2,3,4) THEN o.total ELSE 0 END),0) AS spent
         FROM users u LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
        [],
        { op: "admin.listCustomers" }
    );
    res.json(rows);
};

module.exports = {
    getOverview,
    listOrders,
    getOrderDetail,
    updateOrderStatus,
    listCustomRequests,
    updateCustomStatus,
    listCustomers,
};
