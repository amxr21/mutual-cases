/**
 * Migration: delivery-person portal.
 *
 *   users.access_code            — per-driver login code (admin-generated). Lets
 *                                  delivery staff (who have no Google account)
 *                                  sign into their portal.
 *   orders.delivery_status       — driver-controlled delivery sub-lifecycle:
 *                                  assigned → picked_up → out_for_delivery →
 *                                  delivered → handed_over.
 *   orders.delivery_note         — driver's note/proof on completion.
 *
 * Idempotent: information_schema checks. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDeliveryPortal.js
 */
const { query, pool } = require("../dbClient");

const hasColumn = async (table, column) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
};

const addColumn = async (table, column, ddl) => {
    if (await hasColumn(table, column)) {
        console.log(`• ${table}.${column} already present — skipping`);
        return;
    }
    await query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    console.log(`✓ added ${table}.${column}`);
};

const main = async () => {
    await addColumn("users", "access_code", "`access_code` varchar(20) DEFAULT NULL");
    // Unique index on access_code (only enforced for non-null values).
    const idx = await query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uniq_access_code'`
    );
    if (!idx.length) {
        await query("ALTER TABLE users ADD UNIQUE KEY `uniq_access_code` (`access_code`)");
        console.log("✓ added uniq_access_code");
    }

    await addColumn(
        "orders",
        "delivery_status",
        "`delivery_status` enum('assigned','picked_up','out_for_delivery','delivered','handed_over') DEFAULT NULL"
    );
    await addColumn("orders", "delivery_note", "`delivery_note` varchar(500) DEFAULT NULL");

    console.log("Delivery portal migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
