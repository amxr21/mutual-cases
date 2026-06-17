const express = require("express");

const {
    driverAuth,
    getMyProfile,
    setMyStatus,
    listMyDeliveries,
    updateMyDeliveryStatus,
    undoLastDeliveryStatus,
} = require("../controllers/deliveryPortal");
const asyncHandler = require("../middleware/asyncHandler");
const { requireDelivery } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
    driverAuthSchema,
    driverStatusSchema,
    driverAvailabilitySchema,
    orderNumberParam,
} = require("../validation/schemas");

const router = express.Router();

// Public: exchange an access code for a driver JWT.
router.post("/auth", validate({ body: driverAuthSchema }), asyncHandler(driverAuth));

// Driver-gated: own profile + availability.
router.get("/me", requireDelivery, asyncHandler(getMyProfile));
router.patch("/me/status", requireDelivery, validate({ body: driverAvailabilitySchema }), asyncHandler(setMyStatus));

// Driver-gated: only the signed-in delivery person's own assigned orders.
router.get("/orders", requireDelivery, asyncHandler(listMyDeliveries));
router.patch(
    "/orders/:orderNumber/status",
    requireDelivery,
    validate({ params: orderNumberParam, body: driverStatusSchema }),
    asyncHandler(updateMyDeliveryStatus)
);
router.patch(
    "/orders/:orderNumber/undo",
    requireDelivery,
    validate({ params: orderNumberParam }),
    asyncHandler(undoLastDeliveryStatus)
);

module.exports = router;
