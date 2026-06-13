/**
 * Liked / wishlist controllers.
 *
 * Mirrors the cart controller patterns: parameterized queries via dbClient,
 * handlers throw (wrapped by asyncHandler), bodies/params pre-validated.
 * Likes are unique per (user_id, product_id); a duplicate add is treated as a
 * no-op "exists" rather than an error.
 */
const { query } = require("../dbClient");
const { notFound } = require("../errors/AppError");

const LIKED_SELECT = `
    SELECT li.id, li.added_at, p.id AS product_id, p.trend, p.price, p.model,
           p.edition, p.category, p.stock_quantity_id, p.image_url_1,
           p.image_url_2, p.image_url_3, t.type, sq.quantity
    FROM liked_items li
    JOIN products p ON p.id = li.product_id
    JOIN types t ON t.id = p.type_id
    JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
    WHERE li.user_id = ?
    ORDER BY li.added_at DESC
`;

const addLike = async (req, res) => {
    const { user_id, product_id } = req.body;

    const existing = await query(
        "SELECT id FROM liked_items WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        { op: "addLike.check" }
    );
    if (existing.length) {
        return res.status(200).json({ message: "Already in your liked list", likeStatus: "exists" });
    }

    const result = await query(
        "INSERT INTO liked_items (user_id, product_id) VALUES (?, ?)",
        [user_id, product_id],
        { op: "addLike.insert" }
    );
    res.status(201).json({ message: "Added to your liked list", likeStatus: "added", id: result.insertId });
};

const removeLike = async (req, res) => {
    const { user_id, product_id } = req.body;
    const result = await query(
        "DELETE FROM liked_items WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        { op: "removeLike" }
    );
    if (!result.affectedRows) {
        throw notFound("That item is not in your liked list");
    }
    res.json({ message: "Removed from your liked list", likeStatus: "removed" });
};

const viewLiked = async (req, res) => {
    const { id } = req.params; // user id
    const rows = await query(LIKED_SELECT, [id], { op: "viewLiked" });
    res.json(rows);
};

/** Return just the set of liked product ids for a user (for hydrating UI state). */
const likedIds = async (req, res) => {
    const { id } = req.params; // user id
    const rows = await query(
        "SELECT product_id FROM liked_items WHERE user_id = ?",
        [id],
        { op: "likedIds" }
    );
    res.json(rows.map((r) => r.product_id));
};

module.exports = { addLike, removeLike, viewLiked, likedIds };
