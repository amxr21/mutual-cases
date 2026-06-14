const express = require("express");

const { createOrder, getMyOrders, getOrder, markPaid } = require("../controllers/orders");
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { orderCreateSchema, orderNumberParam } = require("../validation/schemas");

const router = express.Router();

// All order routes require auth; user comes from the JWT, and order access is
// restricted to the owner.
router.post("/", requireAuth, validate({ body: orderCreateSchema }), asyncHandler(createOrder));

// The authenticated user's own order history.
router.get("/", requireAuth, asyncHandler(getMyOrders));

router.get("/:orderNumber", requireAuth, validate({ params: orderNumberParam }), asyncHandler(getOrder));

router.post("/:orderNumber/pay", requireAuth, validate({ params: orderNumberParam }), asyncHandler(markPaid));

module.exports = router;
