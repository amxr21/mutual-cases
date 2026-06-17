/**
 * Migration: granular admin roles + audit log.
 *
 *   users.staff_role — sub-role for admin users:
 *       owner | manager | fulfillment | support
 *       (owner = full access; the others are scoped via PERMISSIONS in code.)
 *       NULL for non-admins; existing admins default to 'owner'.
 *
 *   audit_log — record of admin actions (who/what/when + small detail).
 *
 * Idempotent. Mirror of schema.sql.
 *
 * Run: node scripts/migrateRoles.js
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
    if (!(await hasColumn("users", "staff_role"))) {
        await query(
            "ALTER TABLE users ADD COLUMN `staff_role` enum('owner','manager','fulfillment','support') DEFAULT NULL"
        );
        console.log("✓ added users.staff_role");
        // Existing admins become 'owner' so nothing loses access.
        const r = await query("UPDATE users SET staff_role = 'owner' WHERE role = 'admin' AND staff_role IS NULL");
        console.log(`✓ defaulted ${r.affectedRows} existing admin(s) to 'owner'`);
    } else {
        console.log("• users.staff_role already present — skipping");
    }

    await query(
        `CREATE TABLE IF NOT EXISTS audit_log (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint unsigned DEFAULT NULL,
            user_name varchar(255) DEFAULT NULL,
            action varchar(80) NOT NULL,
            entity varchar(80) DEFAULT NULL,
            entity_id varchar(80) DEFAULT NULL,
            detail varchar(500) DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_audit_created (created_at),
            KEY idx_audit_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ audit_log table ready");

    console.log("Roles + audit migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
