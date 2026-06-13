const express = require("express");

const { addToCart, viewCart, removeFromCart, updateCart } = require("../controllers/cart");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { idParam, cartAddSchema, cartUpdateSchema, cartRemoveSchema } = require("../validation/schemas");

const router = express.Router();

// View a user's cart by user id.
router.get("/:id", validate({ params: idParam }), asyncHandler(viewCart));

// Add an item.
router.post("/", validate({ body: cartAddSchema }), asyncHandler(addToCart));

// Remove an item. The client sends product_id in the body (URL :id is the same
// value for backward-compat); we validate the body as the source of truth.
router.delete("/:id", validate({ body: cartRemoveSchema }), asyncHandler(removeFromCart));

// Update quantity (0 removes the line).
router.patch("/", validate({ body: cartUpdateSchema }), asyncHandler(updateCart));

module.exports = router;
