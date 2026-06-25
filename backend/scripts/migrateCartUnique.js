/**
 * Migration: fix the cart_items uniqueness bug.
 *
 * The original schema had `UNIQUE KEY product_id_UNIQUE (product_id)`, which
 * made a product globally unique across ALL carts — so only one customer could
 * ever have a given product in their cart at a time. A second customer adding
 * the same product hit ER_DUP_ENTRY ("That record already exists") even with an
 * empty cart.
 *
 * The correct constraint is per-user: UNIQUE (user_id, product_id). This also
 * matches what the addToCart controller already assumes (it looks the line up by
 * user_id + product_id and increments).
 *
 * Idempotent: only drops/creates the keys if needed.
 *
 * Run: node scripts/migrateCartUnique.js
 */
const { query, pool } = require("../dbClient");

const indexExists = async (name) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND INDEX_NAME = ?`,
        [name]
    );
    return rows.length > 0;
};

const main = async () => {
    // 1. Drop the wrong product-only unique key if it's still there.
    if (await indexExists("product_id_UNIQUE")) {
        await query("ALTER TABLE cart_items DROP INDEX `product_id_UNIQUE`");
        console.log("✓ dropped product-only UNIQUE(product_id)");
    } else {
        console.log("• product_id_UNIQUE not present — skipping drop");
    }

    // 2. Collapse any duplicate (user_id, product_id) rows that the broken key
    //    may have allowed to diverge, keeping the lowest id and summing qty.
    //    (Harmless if there are none.)
    await query(
        `UPDATE cart_items c
         JOIN (
            SELECT MIN(id) AS keep_id, user_id, product_id, SUM(quantity) AS total_qty, COUNT(*) AS n
            FROM cart_items GROUP BY user_id, product_id HAVING n > 1
         ) d ON c.id = d.keep_id
         SET c.quantity = d.total_qty`
    );
    await query(
        `DELETE c FROM cart_items c
         JOIN (
            SELECT MIN(id) AS keep_id, user_id, product_id
            FROM cart_items GROUP BY user_id, product_id HAVING COUNT(*) > 1
         ) d ON c.user_id = d.user_id AND c.product_id = d.product_id AND c.id <> d.keep_id`
    );
    console.log("✓ de-duplicated any (user_id, product_id) collisions");

    // 3. Add the correct composite unique key.
    if (await indexExists("uniq_user_product")) {
        console.log("• uniq_user_product already present — skipping create");
    } else {
        await query("ALTER TABLE cart_items ADD UNIQUE KEY `uniq_user_product` (`user_id`, `product_id`)");
        console.log("✓ added UNIQUE(user_id, product_id)");
    }

    console.log("cart_items uniqueness migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
