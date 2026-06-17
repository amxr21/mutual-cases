/**
 * Migration: support driver "undo last step within 2h".
 *
 *   orders.delivery_status_at — timestamp of the last delivery sub-status change.
 *                               Used to enforce the 2-hour undo window.
 *
 * Idempotent. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDeliveryUndo.js
 */
const { query, pool } = require("../dbClient");

const main = async () => {
    const has = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_status_at'`
    );
    if (has.length) {
        console.log("• orders.delivery_status_at already present — skipping");
    } else {
        await query("ALTER TABLE orders ADD COLUMN `delivery_status_at` timestamp NULL DEFAULT NULL");
        console.log("✓ added orders.delivery_status_at");
    }
    console.log("Delivery undo migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => { console.error("Migration failed:", e.message); process.exit(1); });
