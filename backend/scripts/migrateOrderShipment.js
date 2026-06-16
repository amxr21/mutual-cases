/**
 * Migration: link orders to a delivery person + carry shipment/tracking detail,
 * so the assigned driver and tracking info can surface on the customer's
 * My Orders / Track Order pages.
 *
 *   delivery_user_id  -> users.id of the assigned driver (nullable, SET NULL on delete)
 *   tracking_number   varchar
 *   carrier           varchar (e.g. Aramex, Fetchr, in-house)
 *   eta               date (estimated delivery date)
 *
 * Idempotent: checks information_schema before each ALTER. Mirror of schema.sql.
 *
 * Run: node scripts/migrateOrderShipment.js
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
        console.log(`• ${column} already present — skipping`);
        return;
    }
    await query(`ALTER TABLE orders ADD COLUMN ${ddl}`);
    console.log(`✓ added ${column}`);
};

const main = async () => {
    await addColumn("delivery_user_id", "`delivery_user_id` bigint unsigned DEFAULT NULL");
    await addColumn("tracking_number", "`tracking_number` varchar(120) DEFAULT NULL");
    await addColumn("carrier", "`carrier` varchar(80) DEFAULT NULL");
    await addColumn("eta", "`eta` date DEFAULT NULL");

    // FK to users (the driver). Only add if missing. ON DELETE SET NULL so
    // removing a driver doesn't orphan/break their past orders.
    const fk = await query(
        `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
           AND CONSTRAINT_NAME = 'fk_orders_delivery_user'`
    );
    if (!fk.length) {
        await query(
            "ALTER TABLE orders ADD INDEX `idx_orders_delivery_user` (`delivery_user_id`)"
        );
        await query(
            `ALTER TABLE orders ADD CONSTRAINT \`fk_orders_delivery_user\`
             FOREIGN KEY (\`delivery_user_id\`) REFERENCES users (id) ON DELETE SET NULL`
        );
        console.log("✓ added fk_orders_delivery_user");
    } else {
        console.log("• fk_orders_delivery_user already present — skipping");
    }

    console.log("Order shipment migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
