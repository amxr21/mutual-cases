/**
 * Migration: Inventory module.
 *
 *   stock_quantity.low_stock_threshold  — per-product alert threshold (default 5)
 *   stock_quantity.reserved             — units reserved by pending orders
 *
 *   stock_adjustments  — audit log of every manual/automatic stock change:
 *       product_id, delta (+/-), reason (enum), note, resulting_qty,
 *       adjusted_by (admin user id, NULL for system), created_at
 *
 *   stock_notifications — "notify me when back in stock" subscriptions:
 *       product_id, email, notified (0/1), created_at
 *
 * Idempotent: information_schema checks + CREATE TABLE IF NOT EXISTS.
 * Mirror of schema.sql.
 *
 * Run: node scripts/migrateInventory.js
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
    await addColumn("stock_quantity", "low_stock_threshold", "`low_stock_threshold` bigint NOT NULL DEFAULT 5");
    await addColumn("stock_quantity", "reserved", "`reserved` bigint NOT NULL DEFAULT 0");

    await query(
        `CREATE TABLE IF NOT EXISTS stock_adjustments (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            product_id bigint unsigned NOT NULL,
            delta bigint NOT NULL,
            reason enum('restock','correction','damaged','lost','return','manual') NOT NULL DEFAULT 'manual',
            note varchar(255) DEFAULT NULL,
            resulting_qty bigint NOT NULL,
            adjusted_by bigint unsigned DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_adj_product (product_id),
            KEY idx_adj_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ stock_adjustments table ready");

    await query(
        `CREATE TABLE IF NOT EXISTS stock_notifications (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            product_id bigint unsigned NOT NULL,
            email varchar(255) NOT NULL,
            notified tinyint(1) NOT NULL DEFAULT 0,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_notify (product_id, email),
            KEY idx_notify_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ stock_notifications table ready");

    console.log("Inventory migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
