/**
 * Migration: add editable customer profile / logistics fields to `users` so the
 * admin can maintain a single source of truth per customer (phone + default
 * shipping address). Order-level `addresses` rows are unchanged.
 *
 *   phone, address_line, area, city, country  (all nullable varchars)
 *
 * Idempotent: checks information_schema before each ALTER. Mirror of the columns
 * added to schema.sql.
 *
 * Run: node scripts/migrateUserProfile.js
 */
const { query, pool } = require("../dbClient");

const hasColumn = async (column) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [column]
    );
    return rows.length > 0;
};

const addColumn = async (column, ddl) => {
    if (await hasColumn(column)) {
        console.log(`• ${column} already present — skipping`);
        return;
    }
    await query(`ALTER TABLE users ADD COLUMN ${ddl}`);
    console.log(`✓ added ${column}`);
};

const main = async () => {
    await addColumn("phone", "`phone` varchar(40) DEFAULT NULL");
    await addColumn("address_line", "`address_line` varchar(255) DEFAULT NULL");
    await addColumn("area", "`area` varchar(255) DEFAULT NULL");
    await addColumn("city", "`city` varchar(100) DEFAULT NULL");
    await addColumn("country", "`country` varchar(100) DEFAULT NULL");

    console.log("User profile migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
