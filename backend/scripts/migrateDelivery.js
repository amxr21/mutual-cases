/**
 * Migration: add the 'delivery' user role and a per-user delivery profile.
 *
 *   - users.role enum gains 'delivery'.
 *   - delivery_profiles: 1:1 with a user (the delivery person), holding the
 *     logistics info a driver needs:
 *       vehicle_type, plate_number, license_number  (vehicle)
 *       zone, emirate, country                       (coverage)
 *       status enum(active|inactive|on_shift)        (availability)
 *
 * Idempotent: enum is only widened if 'delivery' is missing; table uses
 * CREATE TABLE IF NOT EXISTS. Mirror of schema.sql.
 *
 * Run: node scripts/migrateDelivery.js
 */
const { query, pool } = require("../dbClient");

const main = async () => {
    // 1) Widen the role enum to include 'delivery' (only if needed).
    const col = await query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
    );
    const type = col[0]?.COLUMN_TYPE || "";
    if (!type.includes("'delivery'")) {
        await query(
            "ALTER TABLE users MODIFY COLUMN `role` enum('customer','admin','delivery') NOT NULL DEFAULT 'customer'"
        );
        console.log("✓ added 'delivery' to users.role enum");
    } else {
        console.log("• users.role already has 'delivery' — skipping");
    }

    // 2) delivery_profiles (1:1 with users).
    await query(
        `CREATE TABLE IF NOT EXISTS delivery_profiles (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint unsigned NOT NULL,
            vehicle_type varchar(60) DEFAULT NULL,
            plate_number varchar(40) DEFAULT NULL,
            license_number varchar(60) DEFAULT NULL,
            zone varchar(120) DEFAULT NULL,
            emirate varchar(60) DEFAULT NULL,
            country varchar(60) DEFAULT NULL,
            status enum('active','inactive','on_shift') NOT NULL DEFAULT 'active',
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_delivery_user (user_id),
            CONSTRAINT fk_delivery_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    console.log("✓ delivery_profiles table ready");

    console.log("Delivery migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
