/**
 * Migration: Discounts / Promotions.
 *
 *   discounts        — discount codes:
 *       code (unique), type (percent|fixed|free_shipping), value,
 *       min_spend, max_uses, used_count, per_customer_limit,
 *       starts_at, expires_at, active
 *   discount_redemptions — usage log (which code, which order, which user)
 *   orders.discount_code / orders.discount_amount — what was applied to an order
 *
 * Idempotent. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDiscounts.js
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
    await query(
        `CREATE TABLE IF NOT EXISTS discounts (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            code varchar(40) NOT NULL,
            type enum('percent','fixed','free_shipping') NOT NULL DEFAULT 'percent',
            value decimal(10,2) NOT NULL DEFAULT 0,
            min_spend decimal(10,2) NOT NULL DEFAULT 0,
            max_uses int DEFAULT NULL,
            used_count int NOT NULL DEFAULT 0,
            per_customer_limit int DEFAULT NULL,
            starts_at timestamp NULL DEFAULT NULL,
            expires_at timestamp NULL DEFAULT NULL,
            active tinyint(1) NOT NULL DEFAULT 1,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_discount_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ discounts table ready");

    await query(
        `CREATE TABLE IF NOT EXISTS discount_redemptions (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            discount_id bigint unsigned NOT NULL,
            order_id bigint DEFAULT NULL,
            user_id bigint unsigned DEFAULT NULL,
            amount decimal(10,2) NOT NULL DEFAULT 0,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_redemption_discount (discount_id),
            KEY idx_redemption_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ discount_redemptions table ready");

    await addColumn("orders", "discount_code", "`discount_code` varchar(40) DEFAULT NULL");
    await addColumn("orders", "discount_amount", "`discount_amount` decimal(10,2) NOT NULL DEFAULT 0");

    console.log("Discounts migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
