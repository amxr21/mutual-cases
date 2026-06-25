/**
 * Migration: add the 'developer' staff role.
 *
 * Extends users.staff_role enum to include 'developer'. A developer has full
 * operational + technical access (settings, integrations, every module); the
 * only thing reserved for owners is managing owner/developer accounts, so a
 * developer can never lock the business owner out.
 *
 * Idempotent — safe to run repeatedly. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDeveloperRole.js
 */
const { query, pool } = require("../dbClient");

const main = async () => {
    // Read the current column definition so we only ALTER if 'developer' is absent.
    const rows = await query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'staff_role'`
    );
    if (!rows.length) {
        console.error("✗ users.staff_role not found — run migrateRoles.js first");
        await pool.end();
        process.exit(1);
    }

    const colType = String(rows[0].COLUMN_TYPE || "");
    if (colType.includes("'developer'")) {
        console.log("• users.staff_role already includes 'developer' — skipping");
    } else {
        await query(
            "ALTER TABLE users MODIFY COLUMN `staff_role` enum('owner','developer','manager','fulfillment','support') DEFAULT NULL"
        );
        console.log("✓ added 'developer' to users.staff_role enum");
    }

    console.log("Developer-role migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
