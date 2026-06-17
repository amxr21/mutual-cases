/**
 * Admin notifications.
 *
 * Notifications are *derived* from existing data (no separate events table):
 * new custom requests, new pending orders, new return requests, and reviews
 * awaiting moderation. "Unread" = created after the admin's last "seen"
 * timestamp, which is stored in the settings store under `notifications_seen`.
 *
 * - GET  /admin/notifications        → recent items + unread counts
 * - POST /admin/notifications/seen   → mark everything read (bump the timestamp)
 */
const { query } = require("../dbClient");

const SEEN_KEY = "notifications_seen";

async function getSeenAt() {
    const rows = await query("SELECT `value` FROM settings WHERE `key` = ?", [SEEN_KEY]);
    if (!rows.length) return new Date(0);
    let v = rows[0].value;
    try { v = typeof v === "object" ? v : JSON.parse(v); } catch { v = {}; }
    return v && v.at ? new Date(v.at) : new Date(0);
}

/** GET /admin/notifications — recent items (newest first) + unread counts. */
const listNotifications = async (_req, res) => {
    const seenAt = await getSeenAt();
    const seenIso = seenAt.toISOString().slice(0, 19).replace("T", " ");

    const [customs, orders, returns, reviews] = await Promise.all([
        query(
            `SELECT c.id, c.model, c.created_at, u.name AS who
             FROM custom_orders c LEFT JOIN users u ON u.id = c.user_id
             WHERE c.status = 'pending'
             ORDER BY c.created_at DESC LIMIT 20`
        ),
        query(
            `SELECT o.order_number, o.order_date AS created_at, o.total, u.name AS who
             FROM orders o LEFT JOIN users u ON u.id = o.user_id
             WHERE o.status_id = 1
             ORDER BY o.order_date DESC LIMIT 20`
        ),
        query(
            `SELECT r.id, r.created_at, o.order_number, u.name AS who
             FROM returns r JOIN orders o ON o.id = r.order_id LEFT JOIN users u ON u.id = r.user_id
             WHERE r.status = 'requested'
             ORDER BY r.created_at DESC LIMIT 20`
        ),
        query(
            `SELECT rv.id, rv.created_at, p.model, u.name AS who
             FROM reviews rv JOIN products p ON p.id = rv.product_id JOIN users u ON u.id = rv.user_id
             WHERE rv.status = 'pending'
             ORDER BY rv.created_at DESC LIMIT 20`
        ),
    ]);

    const items = [];
    const push = (type, id, created_at, title, href) =>
        items.push({ type, id, created_at, title, href, unread: new Date(created_at) > seenAt });

    for (const c of customs) push("custom", c.id, c.created_at, `Custom request — ${c.model}${c.who ? ` (${c.who})` : ""}`, "/admin/custom-requests");
    for (const o of orders) push("order", o.order_number, o.created_at, `New order ${o.order_number} — ${o.total} AED`, "/admin/orders");
    for (const r of returns) push("return", r.id, r.created_at, `Return requested — ${r.order_number}`, "/admin/returns");
    for (const rv of reviews) push("review", rv.id, rv.created_at, `Review to moderate — ${rv.model}`, "/admin/reviews");

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const counts = {
        custom: customs.filter((x) => new Date(x.created_at) > seenAt).length,
        order: orders.filter((x) => new Date(x.created_at) > seenAt).length,
        return: returns.filter((x) => new Date(x.created_at) > seenAt).length,
        review: reviews.filter((x) => new Date(x.created_at) > seenAt).length,
    };
    counts.total = counts.custom + counts.order + counts.return + counts.review;

    res.json({ items: items.slice(0, 50), counts, seenAt: seenIso });
};

/** POST /admin/notifications/seen — mark all as read (now). */
const markSeen = async (_req, res) => {
    const at = new Date().toISOString();
    await query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [SEEN_KEY, JSON.stringify({ at })],
        { op: "admin.markNotificationsSeen" }
    );
    res.json({ message: "Marked as read", seenAt: at });
};

module.exports = { listNotifications, markSeen };
