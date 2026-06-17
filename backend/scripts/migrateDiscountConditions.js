/**
 * Migration: extra discount conditions / types.
 *
 *   discounts.first_order_only — only valid on a customer's first order.
 *   discounts.featured         — surfaced as a banner on the storefront
 *                                (for limited/seasonal promos worth showing).
 *
 * Seasonal/scheduled codes are already covered by starts_at/expires_at.
 * Idempotent. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDiscountConditions.js
 */
const { query, pool } = require("../dbClient");

const hasColumn = async (column) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'discounts' AND COLUMN_NAME = ?`,
        [column]
    );
    return rows.length > 0;
};

const addColumn = async (column, ddl) => {
    if (await hasColumn(column)) { console.log(`• ${column} already present — skipping`); return; }
    await query(`ALTER TABLE discounts ADD COLUMN ${ddl}`);
    console.log(`✓ added ${column}`);
};

const main = async () => {
    await addColumn("first_order_only", "`first_order_only` tinyint(1) NOT NULL DEFAULT 0");
    await addColumn("featured", "`featured` tinyint(1) NOT NULL DEFAULT 0");
    console.log("Discount conditions migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => { console.error("Migration failed:", e.message); process.exit(1); });
