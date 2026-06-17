/**
 * Reports / Analytics controllers (admin, read-only).
 *
 * Each report accepts an optional ?from=YYYY-MM-DD&to=YYYY-MM-DD range and
 * ?format=csv to download as CSV. Realized revenue uses confirmed/shipped/
 * delivered orders (status 2,3,4). VAT is derived from settings (inclusive by
 * default), backed out of the order totals.
 */
const { query } = require("../dbClient");

const REVENUE_STATUSES = "(2,3,4)";

/** Parse from/to into a safe WHERE fragment on o.order_date (parameterized). */
function dateRange(req) {
    const params = [];
    const clauses = [];
    const from = req.query.from;
    const to = req.query.to;
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) { clauses.push("o.order_date >= ?"); params.push(from + " 00:00:00"); }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) { clauses.push("o.order_date <= ?"); params.push(to + " 23:59:59"); }
    return { where: clauses.length ? "AND " + clauses.join(" AND ") : "", params };
}

/** Convert an array of flat objects to CSV. */
function toCsv(rows) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v) => {
        // Render Date columns as YYYY-MM-DD (mysql2 returns Date objects).
        if (v instanceof Date) v = v.toISOString().slice(0, 10);
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

/** Respond as JSON or CSV depending on ?format=csv. */
function respond(req, res, name, rows) {
    if (String(req.query.format).toLowerCase() === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${name}.csv"`);
        return res.send(toCsv(rows));
    }
    res.json(rows);
}

/** GET /admin/reports/summary — headline KPIs for the selected range. */
const summaryReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const [
        [realized],
        [allOrders],
        [refunds],
        [customers],
        [topCat],
    ] = await Promise.all([
        query(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue, COALESCE(AVG(total),0) AS aov FROM orders o WHERE o.status_id IN ${REVENUE_STATUSES} ${where}`, params),
        query(`SELECT COUNT(*) AS c FROM orders o WHERE 1=1 ${where}`, params),
        query(`SELECT COUNT(*) AS returns, COALESCE(SUM(refund_amount),0) AS refunded FROM returns r JOIN orders o ON o.id = r.order_id WHERE r.status = 'completed' ${where}`, params),
        query(`SELECT COUNT(DISTINCT o.user_id) AS buyers FROM orders o WHERE o.status_id IN ${REVENUE_STATUSES} ${where}`, params),
        query(`SELECT p.category, SUM(oi.quantity) AS units FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status_id IN ${REVENUE_STATUSES} ${where} JOIN products p ON p.id = oi.product_id GROUP BY p.category ORDER BY units DESC LIMIT 1`, params),
    ]);

    const orders = Number(realized.orders || 0);
    const totalOrders = Number(allOrders.c || 0);
    const returnsCount = Number(refunds.returns || 0);
    res.json({
        revenue: Math.round(Number(realized.revenue) * 100) / 100,
        orders,
        aov: Math.round(Number(realized.aov) * 100) / 100,
        buyers: Number(customers.buyers || 0),
        totalOrders,
        refunds: returnsCount,
        refundAmount: Math.round(Number(refunds.refunded) * 100) / 100,
        refundRate: totalOrders ? Math.round((returnsCount / totalOrders) * 1000) / 10 : 0,
        topCategory: topCat ? topCat.category : null,
    });
};

/** GET /admin/reports/sales — revenue + order count grouped by day. */
const salesReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT DATE(o.order_date) AS date,
                COUNT(*) AS orders,
                ROUND(SUM(o.total),2) AS revenue,
                ROUND(AVG(o.total),2) AS avg_order_value
         FROM orders o
         WHERE o.status_id IN ${REVENUE_STATUSES} ${where}
         GROUP BY DATE(o.order_date)
         ORDER BY date DESC`,
        params,
        { op: "admin.reports.sales" }
    );
    respond(req, res, "sales-report", rows);
};

/** GET /admin/reports/products — units + revenue per product (best/worst sellers). */
const productsReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT p.id AS product_id, p.category, p.model,
                COALESCE(SUM(oi.quantity),0) AS units_sold,
                ROUND(COALESCE(SUM(oi.quantity * oi.price),0),2) AS revenue
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN orders o ON o.id = oi.order_id AND o.status_id IN ${REVENUE_STATUSES} ${where}
         GROUP BY p.id
         ORDER BY units_sold DESC`,
        params,
        { op: "admin.reports.products" }
    );
    respond(req, res, "products-report", rows);
};

/** GET /admin/reports/customers — per-customer orders + lifetime spend. */
const customersReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT u.id AS customer_id, u.name, u.email,
                COUNT(o.id) AS orders,
                ROUND(COALESCE(SUM(o.total),0),2) AS lifetime_spend,
                MIN(o.order_date) AS first_order,
                MAX(o.order_date) AS last_order,
                CASE WHEN COUNT(o.id) > 1 THEN 'returning' ELSE 'new' END AS segment
         FROM users u
         JOIN orders o ON o.user_id = CAST(u.id AS CHAR) COLLATE utf8mb4_0900_ai_ci
              AND o.status_id IN ${REVENUE_STATUSES} ${where}
         WHERE u.role = 'customer'
         GROUP BY u.id
         ORDER BY lifetime_spend DESC`,
        params,
        { op: "admin.reports.customers" }
    );
    respond(req, res, "customers-report", rows);
};

/** GET /admin/reports/vat — VAT collected, backed out of inclusive totals. */
const vatReport = async (req, res) => {
    const { where, params } = dateRange(req);
    // Read VAT rate from settings (default 5%, inclusive).
    const s = await query("SELECT `value` FROM settings WHERE `key` = 'vat'", []);
    let rate = 5;
    try { const v = s.length ? (typeof s[0].value === "object" ? s[0].value : JSON.parse(s[0].value)) : {}; rate = Number(v.rate ?? 5); } catch { /* default */ }
    const rows = await query(
        `SELECT DATE(o.order_date) AS date,
                COUNT(*) AS orders,
                ROUND(SUM(o.total),2) AS gross,
                ROUND(SUM(o.total) / (1 + ?/100), 2) AS net,
                ROUND(SUM(o.total) - SUM(o.total) / (1 + ?/100), 2) AS vat
         FROM orders o
         WHERE o.status_id IN ${REVENUE_STATUSES} ${where}
         GROUP BY DATE(o.order_date)
         ORDER BY date DESC`,
        [rate, rate, ...params],
        { op: "admin.reports.vat" }
    );
    respond(req, res, "vat-report", rows);
};

/** GET /admin/reports/discounts — usage + amount per discount code. */
const discountsReport = async (req, res) => {
    const rows = await query(
        `SELECT d.code, d.type, d.value, d.used_count,
                COUNT(r.id) AS redemptions,
                ROUND(COALESCE(SUM(r.amount),0),2) AS total_discount
         FROM discounts d
         LEFT JOIN discount_redemptions r ON r.discount_id = d.id
         GROUP BY d.id
         ORDER BY total_discount DESC`,
        [],
        { op: "admin.reports.discounts" }
    );
    respond(req, res, "discounts-report", rows);
};

// --- Detailed (row-level) reports ----------------------------------------

/** Read the configured VAT rate (default 5). */
async function vatRate() {
    const s = await query("SELECT `value` FROM settings WHERE `key` = 'vat'", []);
    try { const v = s.length ? (typeof s[0].value === "object" ? s[0].value : JSON.parse(s[0].value)) : {}; return Number(v.rate ?? 5); } catch { return 5; }
}

/** GET /admin/reports/orders-detail — every order, full detail, one row each. */
const ordersDetailReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rate = await vatRate();
    const rows = await query(
        `SELECT o.order_number, o.order_date, s.status, o.payment_method,
                u.name AS customer, u.email AS email, u.phone AS phone,
                a.country, a.city, a.area,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items,
                (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS units,
                o.discount_code, o.discount_amount,
                ROUND(o.total / (1 + ?/100), 2) AS net,
                ROUND(o.total - o.total / (1 + ?/100), 2) AS vat,
                o.total AS grand,
                d.name AS driver, o.tracking_number, o.carrier, o.delivery_status
         FROM orders o
         JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN users d ON d.id = o.delivery_user_id
         LEFT JOIN addresses a ON a.order_id = o.id
         WHERE 1=1 ${where}
         ORDER BY o.order_date DESC`,
        [rate, rate, ...params],
        { op: "admin.reports.ordersDetail" }
    );
    respond(req, res, "orders-detail", rows);
};

/** GET /admin/reports/returns-detail — every RMA, full detail. */
const returnsDetailReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT r.id AS rma, o.order_number, u.name AS customer, u.email AS email,
                r.status, r.reason, r.resolution, r.refund_amount,
                r.restock, r.created_at, r.resolved_at,
                (SELECT SUM(ri.quantity) FROM return_items ri WHERE ri.return_id = r.id) AS units
         FROM returns r
         JOIN orders o ON o.id = r.order_id
         LEFT JOIN users u ON u.id = r.user_id
         WHERE 1=1 ${where.replace(/o\.order_date/g, "r.created_at")}
         ORDER BY r.created_at DESC`,
        params,
        { op: "admin.reports.returnsDetail" }
    );
    respond(req, res, "returns-detail", rows);
};

/** GET /admin/reports/inventory-detail — per-product stock snapshot. */
const inventoryDetailReport = async (req, res) => {
    const rows = await query(
        `SELECT p.id AS product_id, p.category, p.model, p.edition, t.type, p.price,
                sq.quantity, sq.reserved, (sq.quantity - sq.reserved) AS available,
                sq.low_stock_threshold,
                CASE WHEN sq.quantity <= 0 THEN 'out_of_stock'
                     WHEN sq.quantity <= sq.low_stock_threshold THEN 'low'
                     ELSE 'in_stock' END AS stock_status
         FROM products p
         JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
         JOIN types t ON t.id = p.type_id
         ORDER BY sq.quantity ASC`,
        [],
        { op: "admin.reports.inventoryDetail" }
    );
    respond(req, res, "inventory-detail", rows);
};

/** GET /admin/reports/stock-log — full stock-adjustment audit log. */
const stockLogReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT a.created_at, p.category, p.model, a.delta, a.reason, a.note,
                a.resulting_qty, u.name AS adjusted_by
         FROM stock_adjustments a
         JOIN products p ON p.id = a.product_id
         LEFT JOIN users u ON u.id = a.adjusted_by
         WHERE 1=1 ${where.replace(/o\.order_date/g, "a.created_at")}
         ORDER BY a.created_at DESC LIMIT 1000`,
        params,
        { op: "admin.reports.stockLog" }
    );
    respond(req, res, "stock-log", rows);
};

/** GET /admin/reports/custom-requests — all custom-it submissions. */
const customRequestsReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT c.id, c.created_at, c.status, c.model, c.type, c.design, c.sentence,
                c.comments, u.name AS customer, u.email AS email
         FROM custom_orders c LEFT JOIN users u ON u.id = c.user_id
         WHERE 1=1 ${where.replace(/o\.order_date/g, "c.created_at")}
         ORDER BY c.created_at DESC`,
        params,
        { op: "admin.reports.customRequests" }
    );
    respond(req, res, "custom-requests", rows);
};

/** GET /admin/reports/reviews-detail — all reviews + moderation state. */
const reviewsDetailReport = async (req, res) => {
    const { where, params } = dateRange(req);
    const rows = await query(
        `SELECT rv.id, rv.created_at, p.category, p.model, u.name AS author,
                rv.rating, rv.status, rv.flagged, rv.comment, rv.admin_reply
         FROM reviews rv
         JOIN products p ON p.id = rv.product_id
         JOIN users u ON u.id = rv.user_id
         WHERE 1=1 ${where.replace(/o\.order_date/g, "rv.created_at")}
         ORDER BY rv.created_at DESC`,
        params,
        { op: "admin.reports.reviewsDetail" }
    );
    respond(req, res, "reviews-detail", rows);
};

module.exports = {
    summaryReport,
    salesReport,
    productsReport,
    customersReport,
    vatReport,
    discountsReport,
    ordersDetailReport,
    returnsDetailReport,
    inventoryDetailReport,
    stockLogReport,
    customRequestsReport,
    reviewsDetailReport,
};
