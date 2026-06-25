/**
 * Admin controllers — power the owner dashboard. Every route that mounts these
 * is behind requireAdmin (DB-verified role), so these handlers assume an admin.
 * All queries parameterized; status updates validated against a fixed set.
 */
const { query } = require("../dbClient");
const { badRequest, notFound } = require("../errors/AppError");
const config = require("../config");
const logger = require("../logger");
const { audit } = require("../audit");
const { sendEmail } = require("../email/mailer");
const { orderStatusEmail } = require("../email/templates");
const { notifications } = require("../integrations");
const whatsapp = notifications.whatsapp;

const VALID_STATUS_IDS = new Set([1, 2, 3, 4, 5, 6]); // order_status table
const STATUS_LABEL = { 1: "Pending", 2: "Confirmed", 3: "Shipped", 4: "Delivered", 5: "Canceled", 6: "Returned" };
const STATUS_SHIPPED = 3;
const STATUS_CANCELED = 5;
const STATUS_RETURNED = 6;

/**
 * Fire (best-effort) a status-change notification email to the order's owner.
 * Never throws — a mail problem must not fail the admin action.
 */
async function notifyOrderStatus(orderNumber, newStatusId) {
    try {
        const rows = await query(
            `SELECT o.id, o.order_number, o.total, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
             FROM orders o LEFT JOIN users u ON u.id = o.user_id
             WHERE o.order_number = ?`,
            [orderNumber]
        );
        if (!rows.length || !rows[0].customer_email) return;
        const o = rows[0];

        // WhatsApp order-update hook alongside email (stub until configured).
        if (o.customer_phone) {
            whatsapp.sendOrderUpdate({ to: o.customer_phone, orderNumber: o.order_number, status: STATUS_LABEL[newStatusId] })
                .catch((e) => logger.error("whatsapp order update failed", { orderNumber, message: e?.message }));
        }

        const items = await query(
            `SELECT oi.quantity, oi.price, p.model, p.category
             FROM order_items oi JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`,
            [o.id]
        );

        const msg = orderStatusEmail({
            orderNumber: o.order_number,
            status: STATUS_LABEL[newStatusId],
            customerName: o.customer_name,
            total: o.total,
            items,
            trackUrl: `${config.email.siteUrl}/track-order?order=${encodeURIComponent(o.order_number)}`,
        });

        await sendEmail({ to: o.customer_email, subject: msg.subject, html: msg.html, text: msg.text });
    } catch (err) {
        logger.error("notifyOrderStatus failed", { orderNumber, message: err?.message });
    }
}

// Status ids whose orders count as realized revenue (confirmed/shipped/delivered).
const REVENUE_STATUSES = "(2,3,4)";

/** Dashboard overview: headline counts, revenue windows, AOV, ops + system detail. */
const getOverview = async (req, res) => {
    // Current admin's staff role — lets the UI hide controls they can't use.
    const meRows = await query("SELECT staff_role FROM users WHERE id = ?", [req.user?.id], {
        op: "overview.myRole",
    });
    const myStaffRole = meRows.length ? meRows[0].staff_role || "owner" : "owner";

    const [
        [products],
        [orders],
        [customers],
        [customs],
        revenueRows,
        statusBreakdown,
        recent,
        revenueWindows,
        orderWindows,
        [aovRow],
        [reviewsRow],
        deliveryStatus,
        lowStock,
        [pendingReviews],
        [pendingCustoms],
        [topProductsRow],
    ] = await Promise.all([
        query("SELECT COUNT(*) AS c FROM products"),
        query("SELECT COUNT(*) AS c FROM orders"),
        query("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'"),
        query("SELECT COUNT(*) AS c FROM custom_orders"),
        // Revenue from confirmed+ orders (exclude pending/canceled).
        query(`SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status_id IN ${REVENUE_STATUSES}`),
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
        // Realized revenue in today / last 7d / last 30d windows.
        query(
            `SELECT
                COALESCE(SUM(CASE WHEN o.order_date >= CURDATE() THEN o.total END),0) AS today,
                COALESCE(SUM(CASE WHEN o.order_date >= (NOW() - INTERVAL 7 DAY) THEN o.total END),0) AS last7,
                COALESCE(SUM(CASE WHEN o.order_date >= (NOW() - INTERVAL 30 DAY) THEN o.total END),0) AS last30
             FROM orders o WHERE o.status_id IN ${REVENUE_STATUSES}`
        ),
        // Order counts: current 30d window vs the previous 30d window (for trend).
        query(
            `SELECT
                SUM(o.order_date >= (NOW() - INTERVAL 30 DAY)) AS current30,
                SUM(o.order_date >= (NOW() - INTERVAL 60 DAY) AND o.order_date < (NOW() - INTERVAL 30 DAY)) AS previous30
             FROM orders o`
        ),
        // Average order value over realized orders.
        query(`SELECT COALESCE(AVG(total),0) AS aov FROM orders WHERE status_id IN ${REVENUE_STATUSES}`),
        query("SELECT COUNT(*) AS c, COALESCE(AVG(rating),0) AS avg FROM reviews WHERE status = 'approved'"),
        // Delivery staff grouped by availability status.
        query(
            `SELECT status, COUNT(*) AS count FROM delivery_profiles GROUP BY status`
        ),
        // Low-stock products (<= 5 units), most urgent first.
        query(
            `SELECT p.id, p.model, p.edition, p.category, sq.quantity
             FROM products p JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
             WHERE sq.quantity <= 5 ORDER BY sq.quantity ASC LIMIT 8`
        ),
        query("SELECT COUNT(*) AS c FROM reviews WHERE status = 'pending'"),
        query("SELECT COUNT(*) AS c FROM custom_orders WHERE status = 'pending'"),
        // Best-selling products by units sold (realized orders only).
        query(
            `SELECT p.id, p.model, p.category, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.price) AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id AND o.status_id IN ${REVENUE_STATUSES}
             JOIN products p ON p.id = oi.product_id
             GROUP BY p.id ORDER BY units DESC LIMIT 5`
        ).then((rows) => [rows]), // wrap so destructuring [topProductsRow] yields the array
    ]);

    const rw = revenueWindows[0] || {};
    const ow = orderWindows[0] || {};
    const current30 = Number(ow.current30 || 0);
    const previous30 = Number(ow.previous30 || 0);
    const orderTrendPct =
        previous30 > 0 ? Math.round(((current30 - previous30) / previous30) * 1000) / 10 : null;

    const deliveryByStatus = { active: 0, inactive: 0, on_shift: 0 };
    for (const row of deliveryStatus) deliveryByStatus[row.status] = Number(row.count);

    res.json({
        totals: {
            products: products.c,
            orders: orders.c,
            customers: customers.c,
            customRequests: customs.c,
            revenue: Number(revenueRows[0]?.revenue || 0),
            pending: statusBreakdown.find((s) => s.status === "Pending")?.count || 0,
        },
        // --- Technical / KPI detail ---
        metrics: {
            revenueToday: Number(rw.today || 0),
            revenue7d: Number(rw.last7 || 0),
            revenue30d: Number(rw.last30 || 0),
            aov: Math.round(Number(aovRow?.aov || 0) * 100) / 100,
            orders30d: current30,
            ordersPrev30d: previous30,
            orderTrendPct, // % change vs previous 30d (null if no prior data)
            reviewCount: Number(reviewsRow?.c || 0),
            reviewAvg: Math.round(Number(reviewsRow?.avg || 0) * 10) / 10,
        },
        pendingActions: {
            ordersToFulfill: statusBreakdown.find((s) => s.status === "Pending")?.count || 0,
            reviewsToModerate: Number(pendingReviews?.c || 0),
            customRequestsPending: Number(pendingCustoms?.c || 0),
        },
        delivery: {
            total: deliveryByStatus.active + deliveryByStatus.inactive + deliveryByStatus.on_shift,
            ...deliveryByStatus,
        },
        lowStock,
        topProducts: topProductsRow,
        system: {
            now: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            node: process.version,
            env: config.env,
            dbPool: {
                connectionLimit: config.db.connectionLimit,
            },
        },
        statusBreakdown,
        recentOrders: recent,
        myStaffRole,
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

/** Full detail of one order (admin can view any), including assigned driver. */
const getOrderDetail = async (req, res) => {
    const { orderNumber } = req.params;
    const orders = await query(
        `SELECT o.id, o.order_number, o.order_date, o.status_id, s.status, o.total, o.payment_method,
                o.gift, o.gift_message, o.note,
                o.delivery_user_id, o.tracking_number, o.carrier, o.eta,
                u.id AS customer_id, u.name AS customer_name, u.email AS customer_email,
                u.phone AS customer_phone, u.created_at AS customer_since,
                d.name AS driver_name, d.phone AS driver_phone
         FROM orders o JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN users d ON d.id = o.delivery_user_id
         WHERE o.order_number = ?`,
        [orderNumber],
        { op: "admin.getOrderDetail" }
    );
    if (!orders.length) throw notFound("Order not found");
    const order = orders[0];

    const [items, addr, history] = await Promise.all([
        query(
            `SELECT oi.product_id, oi.quantity, oi.price, p.model, p.edition, p.category, t.type
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             JOIN types t ON t.id = p.type_id
             WHERE oi.order_id = ?`,
            [order.id]
        ),
        query(`SELECT country, city, area, address FROM addresses WHERE order_id = ? LIMIT 1`, [order.id]),
        query(
            `SELECT h.status_id, s.status, h.note, h.created_at, u.name AS changed_by_name
             FROM order_status_history h
             JOIN order_status s ON s.id = h.status_id
             LEFT JOIN users u ON u.id = h.changed_by
             WHERE h.order_id = ?
             ORDER BY h.created_at ASC, h.id ASC`,
            [order.id],
            { op: "admin.getOrderDetail.history" }
        ),
    ]);

    res.json({ ...order, items, address: addr[0] || null, history });
};

/** Read a JSON setting value by key (returns {} if absent). */
async function readSetting(key) {
    const rows = await query("SELECT `value` FROM settings WHERE `key` = ?", [key], {
        op: "admin.readSetting",
    });
    if (!rows.length) return {};
    const v = rows[0].value;
    if (v == null) return {};
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch { return {}; }
}

/**
 * GET /admin/orders/:orderNumber/invoice — VAT-compliant invoice + packing-slip
 * data for one order. VAT settings (rate, inclusive) + store TRN/profile come
 * from the settings store. UAE default is VAT-inclusive pricing, so the tax line
 * is backed out of the order total.
 */
const getOrderInvoice = async (req, res) => {
    const { orderNumber } = req.params;
    const orders = await query(
        `SELECT o.id, o.order_number, o.order_date, s.status, o.total, o.payment_method,
                o.tracking_number, o.carrier,
                u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
         FROM orders o JOIN order_status s ON s.id = o.status_id
         LEFT JOIN users u ON u.id = o.user_id
         WHERE o.order_number = ?`,
        [orderNumber],
        { op: "admin.getOrderInvoice" }
    );
    if (!orders.length) throw notFound("Order not found");
    const order = orders[0];

    const [items, addr, vat, store, region] = await Promise.all([
        query(
            `SELECT oi.quantity, oi.price, p.model, p.edition, p.category, t.type
             FROM order_items oi JOIN products p ON p.id = oi.product_id
             JOIN types t ON t.id = p.type_id WHERE oi.order_id = ?`,
            [order.id]
        ),
        query(`SELECT country, city, area, address FROM addresses WHERE order_id = ? LIMIT 1`, [order.id]),
        readSetting("vat"),
        readSetting("store_profile"),
        readSetting("region"),
    ]);

    const rate = Number(vat.rate ?? 5);
    const enabled = vat.enabled !== false;
    const inclusive = vat.inclusive !== false; // UAE default: prices include VAT
    const currency = region.baseCurrency || "AED";
    const grand = Number(order.total);

    // Compute the VAT breakdown.
    let net, tax;
    if (!enabled || rate === 0) {
        net = grand; tax = 0;
    } else if (inclusive) {
        // total already includes VAT: net = total / (1 + rate/100)
        net = grand / (1 + rate / 100);
        tax = grand - net;
    } else {
        // exclusive: tax added on top (total here is treated as net+tax already stored, so net = total - tax)
        net = grand / (1 + rate / 100);
        tax = grand - net;
    }
    const round2 = (n) => Math.round(n * 100) / 100;

    res.json({
        order: {
            order_number: order.order_number,
            order_date: order.order_date,
            status: order.status,
            payment_method: order.payment_method,
            tracking_number: order.tracking_number,
            carrier: order.carrier,
        },
        customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
        },
        address: addr[0] || null,
        items: items.map((it) => ({
            ...it,
            lineTotal: round2(Number(it.price) * Number(it.quantity)),
        })),
        store: {
            name: store.name || "Mutual",
            trn: store.trn || "",
            email: store.email || "",
            phone: store.phone || "",
            logoUrl: store.logoUrl || "",
        },
        totals: {
            currency,
            vatEnabled: enabled,
            vatRate: rate,
            vatInclusive: inclusive,
            net: round2(net),
            tax: round2(tax),
            grand: round2(grand),
        },
    });
};

/** List active/on-shift delivery staff for the order assignment picker. */
const listDeliveryOptions = async (_req, res) => {
    const rows = await query(
        `SELECT u.id, u.name, u.phone, d.status, d.emirate, d.zone
         FROM users u JOIN delivery_profiles d ON d.user_id = u.id
         WHERE u.role = 'delivery' AND d.status IN ('active','on_shift')
         ORDER BY u.name`,
        [],
        { op: "admin.listDeliveryOptions" }
    );
    res.json(rows);
};

/** Assign (or clear) a driver + set tracking/carrier/ETA on an order.
 *  Assigning a driver to an order that's still Pending/Confirmed auto-advances it
 *  to Shipped (and logs + notifies), since handing it to a driver means it shipped. */
const assignDelivery = async (req, res) => {
    const { orderNumber } = req.params;
    const { delivery_user_id = null, tracking_number = null, carrier = null, eta = null } = req.body;

    // If a driver id is provided, verify they're actually a delivery user.
    if (delivery_user_id != null) {
        const d = await query(
            "SELECT 1 FROM users WHERE id = ? AND role = 'delivery'",
            [delivery_user_id],
            { op: "admin.assignDelivery.checkDriver" }
        );
        if (!d.length) throw badRequest("Selected user is not a delivery person");
    }

    const existing = await query(
        "SELECT id, status_id FROM orders WHERE order_number = ?",
        [orderNumber],
        { op: "admin.assignDelivery.find" }
    );
    if (!existing.length) throw notFound("Order not found");
    const { id: orderId, status_id: currentStatus } = existing[0];

    await query(
        `UPDATE orders
         SET delivery_user_id = ?, tracking_number = ?, carrier = ?, eta = ?
         WHERE order_number = ?`,
        [delivery_user_id || null, tracking_number || null, carrier || null, eta || null, orderNumber],
        { op: "admin.assignDelivery" }
    );

    // Auto-advance to Shipped when a driver is newly assigned and the order is
    // still before shipping (Pending=1 / Confirmed=2).
    let autoShipped = false;
    if (delivery_user_id && Number(currentStatus) < STATUS_SHIPPED) {
        await query("UPDATE orders SET status_id = ? WHERE id = ?", [STATUS_SHIPPED, orderId], {
            op: "admin.assignDelivery.autoShip",
        });
        await recordStatusChange(orderId, STATUS_SHIPPED, req.user.id, "Auto-set on driver assignment");
        autoShipped = true;
    }

    await audit(req, "order.assign_delivery", { entity: "order", entityId: orderNumber, detail: delivery_user_id ? `driver=${delivery_user_id}${autoShipped ? " (auto-shipped)" : ""}` : "cleared" });
    res.json({ message: "Delivery details updated", autoShipped });

    if (autoShipped) notifyOrderStatus(orderNumber, STATUS_SHIPPED);
};

/** Update an order's status (admin-controlled transition). */
const updateOrderStatus = async (req, res) => {
    const { orderNumber } = req.params;
    const statusId = Number(req.body.status_id);
    if (!VALID_STATUS_IDS.has(statusId)) throw badRequest("Invalid status");

    // Read the current status so we only notify when it actually changes.
    const existing = await query(
        "SELECT id, status_id FROM orders WHERE order_number = ?",
        [orderNumber],
        { op: "admin.updateOrderStatus.check" }
    );
    if (!existing.length) throw notFound("Order not found");
    const orderId = existing[0].id;
    const prevStatus = Number(existing[0].status_id);
    const changed = prevStatus !== statusId;

    // Releasing reserved stock when an order becomes Canceled/Returned — but only
    // on the transition *into* that state (so it isn't released twice).
    const RELEASED_STATES = new Set([STATUS_CANCELED, STATUS_RETURNED]);
    const shouldRelease = changed && RELEASED_STATES.has(statusId) && !RELEASED_STATES.has(prevStatus);

    if (shouldRelease) {
        await releaseReservation(orderId);
    }

    await query(
        "UPDATE orders SET status_id = ? WHERE order_number = ?",
        [statusId, orderNumber],
        { op: "admin.updateOrderStatus" }
    );

    // Record the transition in the audit timeline (only when it actually changed).
    if (changed) {
        await recordStatusChange(orderId, statusId, req.user.id);
        await audit(req, "order.status_change", { entity: "order", entityId: orderNumber, detail: `${prevStatus} → ${statusId}` });
    }

    // Respond immediately; send the notification in the background (best-effort).
    res.json({ message: "Order status updated", status_id: statusId });

    if (changed) {
        notifyOrderStatus(orderNumber, statusId);
    }
};

/**
 * Release the reserved stock for an order's items (on cancel/return). Caps the
 * decrement at the current reserved so it can never go negative. Best-effort.
 */
async function releaseReservation(orderId) {
    try {
        await query(
            `UPDATE stock_quantity sq
             JOIN products p ON p.stock_quantity_id = sq.stock_id
             JOIN order_items oi ON oi.product_id = p.id
             SET sq.reserved = GREATEST(sq.reserved - oi.quantity, 0)
             WHERE oi.order_id = ?`,
            [orderId],
            { op: "admin.releaseReservation" }
        );
    } catch (err) {
        logger.error("releaseReservation failed", { orderId, message: err?.message });
    }
}

/** Append a row to the order status-history timeline (best-effort, never throws). */
async function recordStatusChange(orderId, statusId, changedBy, note = null) {
    try {
        await query(
            "INSERT INTO order_status_history (order_id, status_id, changed_by, note) VALUES (?, ?, ?, ?)",
            [orderId, statusId, changedBy || null, note],
            { op: "admin.recordStatusChange" }
        );
    } catch (err) {
        logger.error("recordStatusChange failed", { orderId, statusId, message: err?.message });
    }
}

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
    await audit(req, "custom_request.status_change", { entity: "custom_order", entityId: id, detail: `→ ${status}` });
    res.json({ message: "Request updated", status });
};

/** List customers (users). */
const listCustomers = async (_req, res) => {
    const rows = await query(
        `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
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

/** Full detail of one user: profile + lifetime stats + recent orders. */
const getCustomerDetail = async (req, res) => {
    const id = Number(req.params.id);
    const rows = await query(
        `SELECT u.id, u.name, u.email, u.role, u.phone, u.address_line, u.area, u.city,
                u.country, u.profile_picture, u.created_at,
                COUNT(DISTINCT o.id) AS order_count,
                COALESCE(SUM(CASE WHEN o.status_id IN (2,3,4) THEN o.total ELSE 0 END),0) AS spent
         FROM users u LEFT JOIN orders o ON o.user_id = u.id
         WHERE u.id = ?
         GROUP BY u.id`,
        [id],
        { op: "admin.getCustomerDetail" }
    );
    if (!rows.length) throw notFound("Customer not found");

    const orders = await query(
        `SELECT o.order_number, o.order_date, o.total, s.status
         FROM orders o JOIN order_status s ON s.id = o.status_id
         WHERE o.user_id = ?
         ORDER BY o.order_date DESC LIMIT 10`,
        [String(id)],
        { op: "admin.getCustomerDetail.orders" }
    );

    res.json({ ...rows[0], orders });
};

/** Update a user's editable profile / logistics fields (admin-only). */
const updateCustomer = async (req, res) => {
    const id = Number(req.params.id);
    // Body is validated by userUpdateSchema; only known fields arrive here.
    const allowed = ["name", "email", "phone", "address_line", "area", "city", "country"];
    const updates = [];
    const params = [];
    for (const field of allowed) {
        if (field in req.body) {
            updates.push(`\`${field}\` = ?`);
            // Normalize empty strings to NULL for the nullable profile fields.
            const v = req.body[field];
            params.push(field === "name" || field === "email" ? v : v === "" ? null : v);
        }
    }
    if (!updates.length) throw badRequest("Provide at least one field to update");

    params.push(id);
    const result = await query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params,
        { op: "admin.updateCustomer" }
    );
    if (!result.affectedRows) {
        // affectedRows is 0 if the row doesn't exist OR nothing changed; check existence.
        const exists = await query("SELECT 1 FROM users WHERE id = ?", [id]);
        if (!exists.length) throw notFound("Customer not found");
    }
    await audit(req, "customer.update", { entity: "user", entityId: id, detail: updates.map((u) => u.split(" ")[0].replace(/`/g, "")).join(",") });
    res.json({ message: "Customer updated" });
};

/** Change a user's role (customer <-> admin), guarding the last admin. */
const updateCustomerRole = async (req, res) => {
    const id = Number(req.params.id);
    const role = String(req.body.role || "").toLowerCase();
    if (role !== "customer" && role !== "admin") throw badRequest("Invalid role");

    const target = await query("SELECT role FROM users WHERE id = ?", [id], {
        op: "admin.updateCustomerRole.find",
    });
    if (!target.length) throw notFound("Customer not found");

    // Don't allow demoting the last remaining admin.
    if (target[0].role === "admin" && role === "customer") {
        const admins = await query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
        if (Number(admins[0].c) <= 1) throw badRequest("Cannot demote the last remaining admin");
    }

    await query("UPDATE users SET role = ? WHERE id = ?", [role, id], {
        op: "admin.updateCustomerRole",
    });
    await audit(req, "customer.role_change", { entity: "user", entityId: id, detail: `${target[0].role} → ${role}` });
    res.json({ message: "Role updated", role });
};

/** Delete a user account, guarding self-deletion and the last admin. */
const deleteCustomer = async (req, res) => {
    const id = Number(req.params.id);

    if (id === Number(req.user.id)) throw badRequest("You can't delete your own account");

    const target = await query("SELECT role FROM users WHERE id = ?", [id], {
        op: "admin.deleteCustomer.find",
    });
    if (!target.length) throw notFound("Customer not found");

    if (target[0].role === "admin") {
        const admins = await query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
        if (Number(admins[0].c) <= 1) throw badRequest("Cannot delete the last remaining admin");
    }

    await query("DELETE FROM users WHERE id = ?", [id], { op: "admin.deleteCustomer" });
    await audit(req, "customer.delete", { entity: "user", entityId: id, detail: `role=${target[0].role}` });
    res.json({ message: "Customer deleted" });
};

module.exports = {
    getOverview,
    listOrders,
    getOrderDetail,
    updateOrderStatus,
    getOrderInvoice,
    listDeliveryOptions,
    assignDelivery,
    listCustomRequests,
    updateCustomStatus,
    listCustomers,
    getCustomerDetail,
    updateCustomer,
    updateCustomerRole,
    deleteCustomer,
};
