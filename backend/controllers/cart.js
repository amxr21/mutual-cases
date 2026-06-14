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

    const existing = await query(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        { op: "addToCart.check" }
    );

    if (existing.length) {
        // Already in the cart — increment the quantity instead of blocking.
        const newQty = Number(existing[0].quantity) + qty;
        await query(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [newQty, existing[0].id],
            { op: "addToCart.increment" }
        );
        return res
            .status(200)
            .json({ message: "Cart updated", itemStatus: "incremented", quantity: newQty });
    }

    const result = await query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [user_id, product_id, qty],
        { op: "addToCart.insert" }
    );

    res
        .status(201)
        .json({ message: "Item added to cart", itemStatus: "added", id: result.insertId, quantity: qty });
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
