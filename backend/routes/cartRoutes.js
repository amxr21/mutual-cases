const express = require("express");

const { addToCart, viewCart, removeFromCart, updateCart } = require("../controllers/cart");
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { cartAddSchema, cartUpdateSchema, cartRemoveSchema } = require("../validation/schemas");

const router = express.Router();

// All cart routes require auth; the user is taken from the JWT, never the body/URL.

// View the authenticated user's cart. (:id kept for URL back-compat but ignored.)
router.get("/:id", requireAuth, asyncHandler(viewCart));
router.get("/", requireAuth, asyncHandler(viewCart));

// Add an item.
router.post("/", requireAuth, validate({ body: cartAddSchema }), asyncHandler(addToCart));

// Remove an item (by product_id in the body).
router.delete("/:id", requireAuth, validate({ body: cartRemoveSchema }), asyncHandler(removeFromCart));

// Update quantity (0 removes the line).
router.patch("/", requireAuth, validate({ body: cartUpdateSchema }), asyncHandler(updateCart));

module.exports = router;
