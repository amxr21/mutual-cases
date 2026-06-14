const express = require("express");

const {
    getOverview,
    listOrders,
    getOrderDetail,
    updateOrderStatus,
    listCustomRequests,
    updateCustomStatus,
    listCustomers,
} = require("../controllers/admin");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Everything here requires a DB-verified admin role.
router.use(requireAdmin);

router.get("/overview", asyncHandler(getOverview));

router.get("/orders", asyncHandler(listOrders));
router.get("/orders/:orderNumber", asyncHandler(getOrderDetail));
router.patch("/orders/:orderNumber/status", asyncHandler(updateOrderStatus));

router.get("/custom-requests", asyncHandler(listCustomRequests));
router.patch("/custom-requests/:id/status", asyncHandler(updateCustomStatus));

router.get("/customers", asyncHandler(listCustomers));

module.exports = router;
