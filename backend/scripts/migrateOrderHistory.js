/**
 * Migration: order status-change history (audit timeline).
 *
 * Each row records a status transition on an order: which status, who changed it
 * (admin user id, NULL for system/customer-driven), an optional note, and when.
 * Powers the "Status history" timeline in the admin order detail.
 *
 * Idempotent: CREATE TABLE IF NOT EXISTS. Also backfills one "current status"
 * row per order that has no history yet, so existing orders show something.
 *
 * Run: node scripts/migrateOrderHistory.js
 */
const { query, pool } = require("../dbClient");

const main = async () => {
    await query(
        `CREATE TABLE IF NOT EXISTS order_status_history (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            order_id bigint NOT NULL,
            status_id bigint NOT NULL,
            changed_by bigint unsigned DEFAULT NULL,
            note varchar(255) DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_osh_order (order_id),
            KEY idx_osh_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ order_status_history table ready");

    // Backfill: for every order with no history, seed a row at the order's
    // current status (timestamped at order_date) so the timeline isn't empty.
    const res = await query(
        `INSERT INTO order_status_history (order_id, status_id, changed_by, note, created_at)
         SELECT o.id, o.status_id, NULL, 'Order placed', o.order_date
         FROM orders o
         WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id)`
    );
    console.log(`✓ backfilled ${res.affectedRows} order(s) with an initial history row`);

    console.log("Order history migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
