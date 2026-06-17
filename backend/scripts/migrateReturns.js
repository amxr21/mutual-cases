/**
 * Migration: Returns / Exchanges / Refunds (RMA).
 *
 *   returns          — one RMA request per submission:
 *       order_id, user_id, status (requested|approved|rejected|completed),
 *       reason, resolution (refund|store_credit|exchange), refund_amount,
 *       restock (0/1), admin_note, created_at / resolved_at / resolved_by
 *   return_items     — the order items + quantities being returned
 *   users.store_credit — store-credit balance (for store-credit refunds)
 *
 * Idempotent: information_schema checks + CREATE TABLE IF NOT EXISTS.
 * Mirror of schema.sql.
 *
 * Run: node scripts/migrateReturns.js
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

const main = async () => {
    if (!(await hasColumn("users", "store_credit"))) {
        await query("ALTER TABLE users ADD COLUMN `store_credit` decimal(10,2) NOT NULL DEFAULT 0");
        console.log("✓ added users.store_credit");
    } else {
        console.log("• users.store_credit already present — skipping");
    }

    await query(
        `CREATE TABLE IF NOT EXISTS returns (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            order_id bigint NOT NULL,
            user_id bigint unsigned DEFAULT NULL,
            status enum('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
            reason varchar(255) DEFAULT NULL,
            resolution enum('refund','store_credit','exchange') DEFAULT NULL,
            refund_amount decimal(10,2) NOT NULL DEFAULT 0,
            restock tinyint(1) NOT NULL DEFAULT 1,
            admin_note varchar(500) DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            resolved_at timestamp NULL DEFAULT NULL,
            resolved_by bigint unsigned DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_returns_order (order_id),
            KEY idx_returns_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ returns table ready");

    await query(
        `CREATE TABLE IF NOT EXISTS return_items (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            return_id bigint unsigned NOT NULL,
            product_id bigint unsigned NOT NULL,
            quantity bigint NOT NULL,
            price decimal(10,2) NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY idx_return_items_return (return_id),
            CONSTRAINT fk_return_items_return FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ return_items table ready");

    console.log("Returns/RMA migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
