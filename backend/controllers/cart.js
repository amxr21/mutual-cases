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
    const { user_id, product_id, quantity } = req.body;

    const existing = await query(
        "SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        { op: "addToCart.check" }
    );
    if (existing.length) {
        // Already present — not an error to the user, but signal it clearly.
        return res.status(200).json({ message: "Item already in cart", itemStatus: "exists" });
    }

    const result = await query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [user_id, product_id, quantity],
        { op: "addToCart.insert" }
    );

    res.status(201).json({ message: "Item added to cart", itemStatus: "added", id: result.insertId });
};

const viewCart = async (req, res) => {
    const { id } = req.params; // user id, validated
    const rows = await query(CART_SELECT, [id], { op: "viewCart" });
    res.json(rows);
};

const updateCart = async (req, res) => {
    const { id, quantity } = req.body; // id = product_id

    // quantity 0 == remove the line item.
    if (quantity === 0) {
        const del = await query("DELETE FROM cart_items WHERE product_id = ?", [id], {
            op: "updateCart.delete",
        });
        if (!del.affectedRows) throw notFound("Item not in cart");
        return res.json({ message: "Item removed", itemStatus: "removed" });
    }

    const result = await query(
        "UPDATE cart_items SET quantity = ? WHERE product_id = ?",
        [quantity, id],
        { op: "updateCart" }
    );
    if (!result.affectedRows) {
        throw notFound("Item not in cart");
    }
    res.json({ message: "Item updated", itemStatus: "updated" });
};

const removeFromCart = async (req, res) => {
    const { product_id } = req.body;
    const result = await query("DELETE FROM cart_items WHERE product_id = ?", [product_id], {
        op: "removeFromCart",
    });
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
