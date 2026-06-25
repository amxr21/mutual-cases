/**
 * Cart controllers.
 *
 * All queries parameterized and run through dbClient. Handlers throw (wrapped by
 * asyncHandler); bodies/params are pre-validated. Duplicate adds and missing
 * rows are surfaced with correct status codes via the central error handler.
 */
const { query } = require("../dbClient");
const { notFound } = require("../errors/AppError");

const CART_SELECT = `
    SELECT ci.id, ci.quantity, ci.added_at, p.id AS product_id, p.price, p.model,
           p.edition, p.category, p.stock_quantity_id, p.image_url_1, t.type
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN types t ON t.id = p.type_id
    JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
    WHERE ci.user_id = ?
`;

const addToCart = async (req, res) => {
    const user_id = req.user.id; // from JWT, not the body
    const { product_id, quantity } = req.body;
    const qty = quantity || 1;

    // Atomic upsert keyed on (user_id, product_id): insert a new line, or bump
    // the quantity if this user already has the product. Relies on the composite
    // UNIQUE(user_id, product_id) key (scripts/migrateCartUnique.js). This avoids
    // the read-then-write race and the old product-only unique key that wrongly
    // blocked a second customer from adding a product another user had in cart.
    const result = await query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [user_id, product_id, qty],
        { op: "addToCart.upsert" }
    );

    // mysql2 affectedRows: 1 = inserted new row, 2 = updated existing (incremented).
    const incremented = result.affectedRows === 2;

    // Read back the resulting quantity so the client shows the truth.
    const rows = await query(
        "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        { op: "addToCart.read" }
    );
    const newQty = rows.length ? Number(rows[0].quantity) : qty;

    res
        .status(incremented ? 200 : 201)
        .json({
            message: incremented ? "Cart updated" : "Item added to cart",
            itemStatus: incremented ? "incremented" : "added",
            quantity: newQty,
        });
};

const viewCart = async (req, res) => {
    // Always the authenticated user's own cart (URL param is ignored for safety).
    const userId = req.user.id;
    const rows = await query(CART_SELECT, [userId], { op: "viewCart" });
    res.json(rows);
};

const updateCart = async (req, res) => {
    const userId = req.user.id;
    const { id, quantity } = req.body; // id = product_id

    // quantity 0 == remove the line item (scoped to this user).
    if (quantity === 0) {
        const del = await query(
            "DELETE FROM cart_items WHERE product_id = ? AND user_id = ?",
            [id, userId],
            { op: "updateCart.delete" }
        );
        if (!del.affectedRows) throw notFound("Item not in cart");
        return res.json({ message: "Item removed", itemStatus: "removed" });
    }

    const result = await query(
        "UPDATE cart_items SET quantity = ? WHERE product_id = ? AND user_id = ?",
        [quantity, id, userId],
        { op: "updateCart" }
    );
    if (!result.affectedRows) {
        throw notFound("Item not in cart");
    }
    res.json({ message: "Item updated", itemStatus: "updated" });
};

const removeFromCart = async (req, res) => {
    const userId = req.user.id;
    const { product_id } = req.body;
    const result = await query(
        "DELETE FROM cart_items WHERE product_id = ? AND user_id = ?",
        [product_id, userId],
        { op: "removeFromCart" }
    );
    if (!result.affectedRows) {
        throw notFound("Item not in cart");
    }
    res.json({ message: "Item removed from cart" });
};

module.exports = {
    addToCart,
    viewCart,
    removeFromCart,
    updateCart,
};
