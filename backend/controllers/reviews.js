/**
 * Reviews & ratings controllers.
 *
 * - Public: list APPROVED reviews for a product + the average rating over
 *   approved reviews only. Each review carries a `verified` flag (the author
 *   actually purchased the product) and an optional store `admin_reply`.
 * - Auth: submit/update a review, but only for a product the user actually
 *   ordered (purchase-gated). One review per user per product (upsert). A
 *   (re)submitted review returns to 'pending' so it is re-moderated.
 * - Admin moderation controllers live below (see adminReviews* exports); their
 *   routes are mounted behind requireAdmin in adminRoutes.
 */
const { query } = require("../dbClient");
const { forbidden, notFound, badRequest } = require("../errors/AppError");

/** GET /reviews/product/:id — APPROVED reviews + aggregate for a product. */
const getProductReviews = async (req, res) => {
    const productId = req.params.id;

    const [reviews, agg] = await Promise.all([
        query(
            `SELECT r.id, r.rating, r.comment, r.admin_reply, r.created_at, u.name AS author,
                    EXISTS(
                        SELECT 1 FROM order_items oi
                        JOIN orders o ON o.id = oi.order_id
                        WHERE o.user_id = CAST(r.user_id AS CHAR) COLLATE utf8mb4_0900_ai_ci
                          AND oi.product_id = r.product_id
                    ) AS verified
             FROM reviews r JOIN users u ON u.id = r.user_id
             WHERE r.product_id = ? AND r.status = 'approved'
             ORDER BY r.created_at DESC`,
            [productId],
            { op: "getProductReviews" }
        ),
        query(
            `SELECT COUNT(*) AS count, COALESCE(AVG(rating),0) AS average
             FROM reviews WHERE product_id = ? AND status = 'approved'`,
            [productId],
            { op: "getProductReviews.agg" }
        ),
    ]);

    res.json({
        average: Math.round(Number(agg[0].average) * 10) / 10,
        count: agg[0].count,
        reviews: reviews.map((r) => ({ ...r, verified: !!Number(r.verified) })),
    });
};

/** Has the authenticated user purchased this product (in any order)? */
const hasPurchased = async (userId, productId) => {
    const rows = await query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? LIMIT 1`,
        [String(userId), productId],
        { op: "reviews.hasPurchased" }
    );
    return rows.length > 0;
};

/** POST /reviews — submit/update a review for a purchased product (-> pending). */
const submitReview = async (req, res) => {
    const userId = req.user.id;
    const { product_id, rating, comment } = req.body;

    if (!(await hasPurchased(userId, product_id))) {
        throw forbidden("You can only review products you've ordered");
    }

    // Upsert: one review per user per product. A new or edited review always
    // returns to 'pending' so an admin re-moderates it before it shows publicly.
    await query(
        `INSERT INTO reviews (product_id, user_id, rating, comment, status)
         VALUES (?, ?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE
            rating = VALUES(rating), comment = VALUES(comment),
            status = 'pending', admin_reply = NULL, flagged = 0,
            moderated_at = NULL, moderated_by = NULL,
            created_at = CURRENT_TIMESTAMP`,
        [product_id, userId, rating, comment],
        { op: "submitReview" }
    );

    res.status(201).json({ message: "Review submitted and awaiting moderation" });
};

/** GET /reviews/mine — the user's own reviews (to prefill / show state). */
const getMyReviews = async (req, res) => {
    const rows = await query(
        "SELECT product_id, rating, comment, status FROM reviews WHERE user_id = ?",
        [req.user.id],
        { op: "getMyReviews" }
    );
    res.json(rows);
};

// --- Admin moderation -----------------------------------------------------

const MOD_STATUS = new Set(["pending", "approved", "rejected"]);

/**
 * GET /admin/reviews — moderation queue. Optional ?status= filter (defaults to
 * all) and ?flagged=1. Includes product label, author, verified flag and reply.
 */
const adminListReviews = async (req, res) => {
    const status = req.query.status ? String(req.query.status).toLowerCase() : null;
    const flaggedOnly = req.query.flagged === "1" || req.query.flagged === "true";

    const where = [];
    const params = [];
    if (status) {
        if (!MOD_STATUS.has(status)) throw badRequest("Invalid status filter");
        where.push("r.status = ?");
        params.push(status);
    }
    if (flaggedOnly) where.push("r.flagged = 1");

    const rows = await query(
        `SELECT r.id, r.product_id, r.rating, r.comment, r.status, r.admin_reply,
                r.flagged, r.created_at, r.moderated_at,
                u.name AS author, u.email AS author_email,
                p.model, p.edition, p.category,
                EXISTS(
                    SELECT 1 FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE o.user_id = CAST(r.user_id AS CHAR) COLLATE utf8mb4_0900_ai_ci
                      AND oi.product_id = r.product_id
                ) AS verified
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN products p ON p.id = r.product_id
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY r.flagged DESC,
                  FIELD(r.status,'pending','approved','rejected'),
                  r.created_at DESC`,
        params,
        { op: "admin.listReviews" }
    );

    res.json(rows.map((r) => ({ ...r, verified: !!Number(r.verified), flagged: !!Number(r.flagged) })));
};

/** Aggregate counts for the moderation queue tabs/badges. */
const adminReviewCounts = async (_req, res) => {
    const rows = await query(
        `SELECT
            SUM(status = 'pending')  AS pending,
            SUM(status = 'approved') AS approved,
            SUM(status = 'rejected') AS rejected,
            SUM(flagged = 1)         AS flagged,
            COUNT(*)                 AS total
         FROM reviews`,
        [],
        { op: "admin.reviewCounts" }
    );
    const r = rows[0] || {};
    res.json({
        pending: Number(r.pending || 0),
        approved: Number(r.approved || 0),
        rejected: Number(r.rejected || 0),
        flagged: Number(r.flagged || 0),
        total: Number(r.total || 0),
    });
};

/** PATCH /admin/reviews/:id/status — approve or reject a review. */
const adminSetReviewStatus = async (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();
    if (!MOD_STATUS.has(status)) throw badRequest("Invalid status");

    const result = await query(
        `UPDATE reviews
         SET status = ?, moderated_at = CURRENT_TIMESTAMP, moderated_by = ?
         WHERE id = ?`,
        [status, req.user.id, id],
        { op: "admin.setReviewStatus" }
    );
    if (!result.affectedRows) throw notFound("Review not found");
    res.json({ message: "Review status updated", status });
};

/** PATCH /admin/reviews/:id/reply — set/clear the store's public reply. */
const adminReplyReview = async (req, res) => {
    const id = Number(req.params.id);
    const reply = (req.body.admin_reply ?? "").toString().trim();

    const result = await query(
        "UPDATE reviews SET admin_reply = ? WHERE id = ?",
        [reply || null, id],
        { op: "admin.replyReview" }
    );
    if (!result.affectedRows) throw notFound("Review not found");
    res.json({ message: reply ? "Reply saved" : "Reply removed", admin_reply: reply || null });
};

/** PATCH /admin/reviews/:id/flag — flag/unflag a review as potential abuse. */
const adminFlagReview = async (req, res) => {
    const id = Number(req.params.id);
    const flagged = req.body.flagged ? 1 : 0;
    const result = await query(
        "UPDATE reviews SET flagged = ? WHERE id = ?",
        [flagged, id],
        { op: "admin.flagReview" }
    );
    if (!result.affectedRows) throw notFound("Review not found");
    res.json({ message: flagged ? "Review flagged" : "Flag cleared", flagged: !!flagged });
};

/** DELETE /admin/reviews/:id — permanently remove an abusive review. */
const adminDeleteReview = async (req, res) => {
    const id = Number(req.params.id);
    const result = await query("DELETE FROM reviews WHERE id = ?", [id], {
        op: "admin.deleteReview",
    });
    if (!result.affectedRows) throw notFound("Review not found");
    res.json({ message: "Review deleted" });
};

module.exports = {
    getProductReviews,
    submitReview,
    getMyReviews,
    // admin moderation
    adminListReviews,
    adminReviewCounts,
    adminSetReviewStatus,
    adminReplyReview,
    adminFlagReview,
    adminDeleteReview,
};
