/**
 * Migration: add moderation columns to the `reviews` table.
 *
 *   - status      enum(pending|approved|rejected) — moderation state.
 *                 Existing rows default to 'approved' so reviews already shown on
 *                 the storefront don't suddenly disappear after this migration.
 *   - admin_reply varchar(1000) — optional public reply from the store.
 *   - flagged     tinyint(1)    — marked as potential abuse for review.
 *   - moderated_at / moderated_by — audit of who actioned it and when.
 *
 * Idempotent: checks information_schema before each ALTER, so it's safe to
 * re-run. Mirror of the columns added to schema.sql.
 *
 * Run: node scripts/migrateReviewsModeration.js
 */
const { query, pool } = require("../dbClient");

/** Does `reviews` already have the given column? */
const hasColumn = async (column) => {
    const rows = await query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = ?`,
        [column]
    );
    return rows.length > 0;
};

const addColumn = async (column, ddl) => {
    if (await hasColumn(column)) {
        console.log(`• ${column} already present — skipping`);
        return;
    }
    await query(`ALTER TABLE reviews ADD COLUMN ${ddl}`);
    console.log(`✓ added ${column}`);
};

const main = async () => {
    // New reviews default to 'pending' (must be moderated), but pre-existing rows
    // are backfilled to 'approved' just below so nothing already-live vanishes.
    await addColumn(
        "status",
        "`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending'"
    );
    await addColumn("admin_reply", "`admin_reply` varchar(1000) DEFAULT NULL");
    await addColumn("flagged", "`flagged` tinyint(1) NOT NULL DEFAULT 0");
    await addColumn("moderated_at", "`moderated_at` timestamp NULL DEFAULT NULL");
    await addColumn("moderated_by", "`moderated_by` bigint unsigned DEFAULT NULL");

    // Index to make the moderation queue + public (approved) reads fast.
    const idx = await query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND INDEX_NAME = 'idx_reviews_status'`
    );
    if (!idx.length) {
        await query("ALTER TABLE reviews ADD INDEX `idx_reviews_status` (`status`)");
        console.log("✓ added idx_reviews_status");
    }

    // Backfill: anything created before this migration is treated as approved so
    // the storefront keeps showing the reviews it already showed. Newly-inserted
    // rows after this point start as 'pending' via the column default.
    const res = await query(
        "UPDATE reviews SET status = 'approved' WHERE status = 'pending' AND created_at < NOW()"
    );
    console.log(`✓ backfilled ${res.affectedRows} existing review(s) to 'approved'`);

    console.log("Reviews moderation migration complete.");
    await pool.end();
    process.exit(0);
};

main().catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
});
