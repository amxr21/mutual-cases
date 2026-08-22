/**
 * Migration: core order fields that controllers/orders.js has always assumed
 * but which were never captured in a migration script (they existed on the
 * original RDS database from early manual/ad-hoc ALTERs). Mirror of schema.sql
 * comment: "the live orders table also has order_number, total, payment_method,
 * gift, gift_message, note (added in app code)".
 *
 *   orders.order_number   — customer-facing order code (e.g. MTL-XXXX-1234), unique
 *   orders.total          — order total, trusted server-computed amount
 *   orders.payment_method — e.g. 'cod' | 'card'
 *   orders.note           — optional customer note on the order
 *   orders.gift           — 0/1 gift flag
 *   orders.gift_message   — optional gift message
 *
 * Idempotent: checks information_schema before each ALTER.
 *
 * Run: node scripts/migrateOrderCore.js
 */
const { query, pool } = require("../dbClient");

const hasColumn = async (column) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
        [column]
    );
    return rows.length > 0;
};

const addColumn = async (column, ddl) => {
    if (await hasColumn(column)) {
        console.log(`• orders.${column} already present — skipping`);
        return;
    }
    await query(`ALTER TABLE \`orders\` ADD COLUMN ${ddl}`);
    console.log(`✓ added orders.${column}`);
};

const main = async () => {
    await addColumn("order_number", "`order_number` varchar(40) DEFAULT NULL");
    await addColumn("total", "`total` decimal(10,2) NOT NULL DEFAULT 0.00");
    await addColumn("payment_method", "`payment_method` varchar(40) DEFAULT NULL");
    await addColumn("note", "`note` varchar(500) DEFAULT NULL");
    await addColumn("gift", "`gift` tinyint(1) NOT NULL DEFAULT 0");
    await addColumn("gift_message", "`gift_message` varchar(500) DEFAULT NULL");

    const idx = await query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'uniq_order_number'`
    );
    if (!idx.length) {
        await query("ALTER TABLE `orders` ADD UNIQUE KEY `uniq_order_number` (`order_number`)");
        console.log("✓ added uniq_order_number");
    } else {
        console.log("• uniq_order_number already present — skipping");
    }

    console.log("Order core migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
