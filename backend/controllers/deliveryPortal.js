/**
 * Delivery-person portal controllers.
 *
 * Drivers (role='delivery', created by admin) have no Google account, so they
 * sign in with a per-driver access code (admin-generated). On success they get a
 * JWT just like any user; driver routes are gated by requireDelivery.
 *
 * A driver can ONLY see/act on orders assigned to them (delivery_user_id = self).
 * They advance a delivery sub-status; the main order status auto-syncs and the
 * change is recorded in the order status-history timeline.
 */
const jwt = require("jsonwebtoken");
const config = require("../config");
const { query, withTransaction } = require("../dbClient");
const { unauthorized, badRequest, notFound, forbidden } = require("../errors/AppError");

// Delivery sub-lifecycle + the main order status each step implies.
// (order_status: 3 Shipped, 4 Delivered)
const SUB_FLOW = ["assigned", "picked_up", "out_for_delivery", "delivered", "handed_over"];
const SUB_TO_MAIN = {
    picked_up: 3, // Shipped
    out_for_delivery: 3, // Shipped
    delivered: 4, // Delivered
    handed_over: 4, // Delivered
};
const SUB_LABEL = {
    assigned: "Assigned",
    picked_up: "Picked up",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    handed_over: "Handed over",
};

/** POST /delivery/auth — exchange a driver access code for a JWT. */
const driverAuth = async (req, res) => {
    const code = String(req.body.access_code || "").trim();
    if (!code) throw badRequest("Access code is required");

    const rows = await query(
        "SELECT id, name, email FROM users WHERE access_code = ? AND role = 'delivery'",
        [code],
        { op: "delivery.auth" }
    );
    if (!rows.length) throw unauthorized("Invalid access code");
    const driver = rows[0];

    const token = jwt.sign({ id: driver.id, email: driver.email, role: "delivery" }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn,
    });
    res.json({ success: true, token, name: driver.name, userId: driver.id, role: "delivery" });
};

/** GET /delivery/me — the signed-in driver's own profile + a delivery summary. */
const getMyProfile = async (req, res) => {
    const driverId = req.user.id;
    const rows = await query(
        `SELECT u.id, u.name, u.email, u.phone, u.created_at,
                d.vehicle_type, d.plate_number, d.license_number,
                d.zone, d.emirate, d.country, d.status
         FROM users u JOIN delivery_profiles d ON d.user_id = u.id
         WHERE u.id = ? AND u.role = 'delivery'`,
        [driverId],
        { op: "delivery.getMyProfile" }
    );
    if (!rows.length) throw notFound("Profile not found");

    // Small counts for the portal header.
    const [counts] = await query(
        `SELECT
            SUM(delivery_status IS NULL OR delivery_status NOT IN ('handed_over')) AS active,
            SUM(delivery_status = 'handed_over') AS completed
         FROM orders WHERE delivery_user_id = ?`,
        [driverId],
        { op: "delivery.getMyProfile.counts" }
    );
    res.json({ ...rows[0], activeCount: Number(counts.active || 0), completedCount: Number(counts.completed || 0) });
};

// A driver can only toggle between these; 'inactive' is admin-only (deactivation).
const DRIVER_SELF_STATUSES = new Set(["active", "on_shift"]);

/** PATCH /delivery/me/status — driver sets their own availability. */
const setMyStatus = async (req, res) => {
    const driverId = req.user.id;
    const status = String(req.body.status || "").toLowerCase();
    if (!DRIVER_SELF_STATUSES.has(status)) throw badRequest("Invalid status");

    const result = await query(
        "UPDATE delivery_profiles SET status = ? WHERE user_id = ?",
        [status, driverId],
        { op: "delivery.setMyStatus" }
    );
    if (!result.affectedRows) throw notFound("Profile not found");
    res.json({ message: "Status updated", status });
};

/** GET /delivery/orders — the signed-in driver's assigned orders (active first). */
const listMyDeliveries = async (req, res) => {
    const driverId = req.user.id;
    const orders = await query(
        `SELECT o.id, o.order_number, o.order_date, o.total, o.payment_method,
                o.delivery_status, o.delivery_status_at, o.delivery_note, o.eta,
                s.status AS order_status,
                u.name AS customer_name, u.phone AS customer_phone,
                a.country, a.city, a.area, a.address
         FROM orders o
         JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.order_id = o.id
         WHERE o.delivery_user_id = ?
         ORDER BY FIELD(o.delivery_status,'handed_over','delivered') ASC, o.order_date DESC`,
        [driverId],
        { op: "delivery.listMyDeliveries" }
    );
    res.json(
        orders.map((o) => ({
            ...o,
            delivery_status: o.delivery_status || "assigned",
            delivery_status_label: SUB_LABEL[o.delivery_status || "assigned"],
        }))
    );
};

/**
 * PATCH /delivery/orders/:orderNumber/status — driver advances the delivery
 * sub-status (and optionally adds a note). Only allowed forward, only on the
 * driver's own order. Syncs the main order status + logs the timeline.
 */
const updateMyDeliveryStatus = async (req, res) => {
    const driverId = req.user.id;
    const { orderNumber } = req.params;
    const next = String(req.body.delivery_status || "").trim();
    const note = req.body.note ? String(req.body.note).slice(0, 500) : null;

    if (!SUB_FLOW.includes(next)) throw badRequest("Invalid delivery status");

    const rows = await query(
        "SELECT id, delivery_user_id, delivery_status, status_id FROM orders WHERE order_number = ?",
        [orderNumber],
        { op: "delivery.updateStatus.find" }
    );
    if (!rows.length) throw notFound("Order not found");
    const order = rows[0];

    // Ownership: a driver may only touch their own assigned orders.
    if (Number(order.delivery_user_id) !== Number(driverId)) {
        throw forbidden("This delivery isn't assigned to you");
    }

    // Forward-only: can't move backward in the sub-flow.
    const currentIdx = SUB_FLOW.indexOf(order.delivery_status || "assigned");
    const nextIdx = SUB_FLOW.indexOf(next);
    if (nextIdx < currentIdx) throw badRequest("Can't move a delivery backwards");

    const mainStatus = SUB_TO_MAIN[next]; // may be undefined for 'assigned'

    await withTransaction(async (tx) => {
        await tx(
            "UPDATE orders SET delivery_status = ?, delivery_status_at = NOW(), delivery_note = COALESCE(?, delivery_note) WHERE id = ?",
            [next, note, order.id]
        );
        // Sync the main order status if this step implies one and it changed.
        if (mainStatus && Number(order.status_id) !== mainStatus) {
            await tx("UPDATE orders SET status_id = ? WHERE id = ?", [mainStatus, order.id]);
            await tx(
                "INSERT INTO order_status_history (order_id, status_id, changed_by, note) VALUES (?, ?, ?, ?)",
                [order.id, mainStatus, driverId, `Driver: ${SUB_LABEL[next]}`]
            );
        }
    }, { op: "delivery.updateStatus" });

    res.json({ message: "Delivery updated", delivery_status: next, delivery_status_label: SUB_LABEL[next] });
};

const UNDO_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * PATCH /delivery/orders/:orderNumber/undo — revert the LAST delivery step if it
 * happened within the 2-hour window. Re-syncs the main order status to match the
 * reverted sub-status and logs it.
 */
const undoLastDeliveryStatus = async (req, res) => {
    const driverId = req.user.id;
    const { orderNumber } = req.params;

    const rows = await query(
        "SELECT id, delivery_user_id, delivery_status, delivery_status_at FROM orders WHERE order_number = ?",
        [orderNumber],
        { op: "delivery.undo.find" }
    );
    if (!rows.length) throw notFound("Order not found");
    const order = rows[0];

    if (Number(order.delivery_user_id) !== Number(driverId)) {
        throw forbidden("This delivery isn't assigned to you");
    }

    const curIdx = SUB_FLOW.indexOf(order.delivery_status || "assigned");
    if (curIdx <= 0) throw badRequest("Nothing to undo");
    if (!order.delivery_status_at) throw badRequest("This step can no longer be undone");
    const age = Date.now() - new Date(order.delivery_status_at).getTime();
    if (age > UNDO_WINDOW_MS) throw badRequest("The 2-hour undo window has passed");

    const prev = SUB_FLOW[curIdx - 1];
    const prevMain = SUB_TO_MAIN[prev] || 1; // 'assigned' has no main mapping → back to Pending(1)

    await withTransaction(async (tx) => {
        await tx(
            "UPDATE orders SET delivery_status = ?, delivery_status_at = NOW(), status_id = ? WHERE id = ?",
            [prev, prevMain, order.id]
        );
        await tx(
            "INSERT INTO order_status_history (order_id, status_id, changed_by, note) VALUES (?, ?, ?, ?)",
            [order.id, prevMain, driverId, `Driver undo → ${SUB_LABEL[prev]}`]
        );
    }, { op: "delivery.undo" });

    res.json({ message: "Reverted", delivery_status: prev, delivery_status_label: SUB_LABEL[prev] });
};

module.exports = {
    driverAuth,
    getMyProfile,
    setMyStatus,
    listMyDeliveries,
    updateMyDeliveryStatus,
    undoLastDeliveryStatus,
    SUB_FLOW,
    SUB_LABEL,
};
