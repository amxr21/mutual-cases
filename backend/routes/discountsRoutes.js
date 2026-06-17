const express = require("express");

const { validateDiscount, featuredDiscounts } = require("../controllers/discounts");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { discountValidateSchema } = require("../validation/schemas");

const router = express.Router();

// Public: featured/limited promos for the storefront banner.
router.get("/featured", asyncHandler(featuredDiscounts));

// Public: validate a discount code against a cart subtotal (used at checkout).
// Auth is optional — if a token is present the per-customer limit is enforced.
router.post("/validate", validate({ body: discountValidateSchema }), asyncHandler(validateDiscount));

module.exports = router;
