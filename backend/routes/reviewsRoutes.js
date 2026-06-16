const express = require("express");

const { getProductReviews, submitReview, getMyReviews } = require("../controllers/reviews");
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam, reviewSchema } = require("../validation/schemas");

const router = express.Router();

// Public: a product's reviews + average.
router.get("/product/:id", validate({ params: idParam }), asyncHandler(getProductReviews));

// Auth: the user's own reviews, and submitting a (purchase-gated) review.
router.get("/mine", requireAuth, asyncHandler(getMyReviews));
router.post("/", requireAuth, validate({ body: reviewSchema }), asyncHandler(submitReview));

module.exports = router;
