const express = require("express");

const { requestReturn, myReturns } = require("../controllers/returns");
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { returnRequestSchema } = require("../validation/schemas");

const router = express.Router();

// Customer-initiated returns (own orders only; enforced in the controller).
router.post("/", requireAuth, validate({ body: returnRequestSchema }), asyncHandler(requestReturn));
router.get("/mine", requireAuth, asyncHandler(myReturns));

module.exports = router;
