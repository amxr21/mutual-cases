const express = require("express");

const {
    getOverview,
    listOrders,
    getOrderDetail,
    updateOrderStatus,
    getOrderInvoice,
    listDeliveryOptions,
    assignDelivery,
    listCustomRequests,
    updateCustomStatus,
    listCustomers,
    getCustomerDetail,
    updateCustomer,
    updateCustomerRole,
    deleteCustomer,
} = require("../controllers/admin");
const {
    adminListReviews,
    adminReviewCounts,
    adminSetReviewStatus,
    adminReplyReview,
    adminFlagReview,
    adminDeleteReview,
} = require("../controllers/reviews");
const { getAllSettings, getSetting, updateSetting } = require("../controllers/settings");
const { getUploadConfig, signUpload } = require("../controllers/uploads");
const { getIntegrationsStatus } = require("../integrations");
const {
    summaryReport,
    salesReport,
    productsReport,
    customersReport,
    vatReport,
    discountsReport,
    ordersDetailReport,
    returnsDetailReport,
    inventoryDetailReport,
    stockLogReport,
    customRequestsReport,
    reviewsDetailReport,
} = require("../controllers/reports");
const {
    listInventory,
    adjustStock,
    listAdjustments,
    setThreshold,
} = require("../controllers/inventory");
const {
    listReturns,
    getReturn,
    approveReturn,
    rejectReturn,
} = require("../controllers/returns");
const {
    listDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
} = require("../controllers/discounts");
const {
    listDelivery,
    getDelivery,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    generateAccessCode,
} = require("../controllers/delivery");
const { listStaff, createStaff, setStaffRole, listAuditLog } = require("../controllers/staff");
const { listNotifications, markSeen } = require("../controllers/notifications");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const validate = require("../middleware/validate");
const {
    idParam,
    reviewStatusSchema,
    reviewReplySchema,
    reviewFlagSchema,
    settingKeyParam,
    settingUpdateSchema,
    userUpdateSchema,
    userRoleSchema,
    deliveryCreateSchema,
    deliveryUpdateSchema,
    orderAssignSchema,
    stockAdjustSchema,
    stockThresholdSchema,
    returnApproveSchema,
    returnRejectSchema,
    discountCreateSchema,
    discountUpdateSchema,
    staffRoleSchema,
    staffCreateSchema,
} = require("../validation/schemas");

const router = express.Router();

// Everything here requires a DB-verified admin role.
router.use(requireAdmin);

router.get("/overview", asyncHandler(getOverview));

router.get("/orders", asyncHandler(listOrders));
// Static path registered before "/orders/:orderNumber" so it isn't captured as one.
router.get("/delivery-options", asyncHandler(listDeliveryOptions));
router.get("/orders/:orderNumber", asyncHandler(getOrderDetail));
router.get("/orders/:orderNumber/invoice", asyncHandler(getOrderInvoice));
router.patch("/orders/:orderNumber/status", asyncHandler(updateOrderStatus));
router.patch(
    "/orders/:orderNumber/delivery",
    validate({ body: orderAssignSchema }),
    asyncHandler(assignDelivery)
);

router.get("/custom-requests", asyncHandler(listCustomRequests));
router.patch("/custom-requests/:id/status", asyncHandler(updateCustomStatus));

router.get("/customers", asyncHandler(listCustomers));
router.get("/customers/:id", validate({ params: idParam }), asyncHandler(getCustomerDetail));
router.patch(
    "/customers/:id",
    validate({ params: idParam, body: userUpdateSchema }),
    asyncHandler(updateCustomer)
);
router.patch(
    "/customers/:id/role",
    validate({ params: idParam, body: userRoleSchema }),
    asyncHandler(updateCustomerRole)
);
router.delete("/customers/:id", validate({ params: idParam }), asyncHandler(deleteCustomer));

// Delivery staff management.
router.get("/delivery", asyncHandler(listDelivery));
router.get("/delivery/:id", validate({ params: idParam }), asyncHandler(getDelivery));
router.post("/delivery", validate({ body: deliveryCreateSchema }), asyncHandler(createDelivery));
router.patch(
    "/delivery/:id",
    validate({ params: idParam, body: deliveryUpdateSchema }),
    asyncHandler(updateDelivery)
);
router.delete("/delivery/:id", validate({ params: idParam }), asyncHandler(deleteDelivery));
router.post("/delivery/:id/access-code", validate({ params: idParam }), asyncHandler(generateAccessCode));

// Reviews moderation queue.
router.get("/reviews", asyncHandler(adminListReviews));
router.get("/reviews/counts", asyncHandler(adminReviewCounts));
router.patch(
    "/reviews/:id/status",
    validate({ params: idParam, body: reviewStatusSchema }),
    asyncHandler(adminSetReviewStatus)
);
router.patch(
    "/reviews/:id/reply",
    validate({ params: idParam, body: reviewReplySchema }),
    asyncHandler(adminReplyReview)
);
router.patch(
    "/reviews/:id/flag",
    validate({ params: idParam, body: reviewFlagSchema }),
    asyncHandler(adminFlagReview)
);
router.delete("/reviews/:id", validate({ params: idParam }), asyncHandler(adminDeleteReview));

// Inventory.
router.get("/inventory", asyncHandler(listInventory));
router.get("/inventory/:id/adjustments", validate({ params: idParam }), asyncHandler(listAdjustments));
router.post(
    "/inventory/:id/adjust",
    validate({ params: idParam, body: stockAdjustSchema }),
    asyncHandler(adjustStock)
);
router.patch(
    "/inventory/:id/threshold",
    validate({ params: idParam, body: stockThresholdSchema }),
    asyncHandler(setThreshold)
);

// Returns / RMA.
router.get("/returns", asyncHandler(listReturns));
router.get("/returns/:id", validate({ params: idParam }), asyncHandler(getReturn));
router.patch(
    "/returns/:id/approve",
    requirePermission("returns"),
    validate({ params: idParam, body: returnApproveSchema }),
    asyncHandler(approveReturn)
);
router.patch(
    "/returns/:id/reject",
    requirePermission("returns"),
    validate({ params: idParam, body: returnRejectSchema }),
    asyncHandler(rejectReturn)
);

// Reports / analytics (JSON or ?format=csv).
router.get("/reports/summary", asyncHandler(summaryReport));
router.get("/reports/sales", asyncHandler(salesReport));
router.get("/reports/products", asyncHandler(productsReport));
router.get("/reports/customers", asyncHandler(customersReport));
router.get("/reports/vat", asyncHandler(vatReport));
router.get("/reports/discounts", asyncHandler(discountsReport));
// Detailed (row-level) reports.
router.get("/reports/orders-detail", asyncHandler(ordersDetailReport));
router.get("/reports/returns-detail", asyncHandler(returnsDetailReport));
router.get("/reports/inventory-detail", asyncHandler(inventoryDetailReport));
router.get("/reports/stock-log", asyncHandler(stockLogReport));
router.get("/reports/custom-requests", asyncHandler(customRequestsReport));
router.get("/reports/reviews-detail", asyncHandler(reviewsDetailReport));

// Discounts / promotions (writes scoped to the 'discounts' permission).
router.get("/discounts", asyncHandler(listDiscounts));
router.post("/discounts", requirePermission("discounts"), validate({ body: discountCreateSchema }), asyncHandler(createDiscount));
router.patch("/discounts/:id", requirePermission("discounts"), validate({ params: idParam, body: discountUpdateSchema }), asyncHandler(updateDiscount));
router.delete("/discounts/:id", requirePermission("discounts"), validate({ params: idParam }), asyncHandler(deleteDiscount));

// Notifications (derived from pending items).
router.get("/notifications", asyncHandler(listNotifications));
router.post("/notifications/seen", asyncHandler(markSeen));

// Staff roles + audit log (owner-only writes).
router.get("/staff", asyncHandler(listStaff));
router.post("/staff", requirePermission("staff"), validate({ body: staffCreateSchema }), asyncHandler(createStaff));
router.patch(
    "/staff/:id/role",
    requirePermission("staff"),
    validate({ params: idParam, body: staffRoleSchema }),
    asyncHandler(setStaffRole)
);
router.get("/audit-log", asyncHandler(listAuditLog));

// Integrations status (which payment/shipping/WhatsApp providers are configured).
router.get("/integrations", asyncHandler(async (_req, res) => res.json(getIntegrationsStatus())));

// Image uploads (Cloudinary signing).
router.get("/uploads/config", asyncHandler(getUploadConfig));
router.post("/uploads/sign", asyncHandler(signUpload));

// Settings (key/value store powering the Settings module).
router.get("/settings", asyncHandler(getAllSettings));
router.get("/settings/:key", validate({ params: settingKeyParam }), asyncHandler(getSetting));
router.put(
    "/settings/:key",
    validate({ params: settingKeyParam, body: settingUpdateSchema }),
    asyncHandler(updateSetting)
);

module.exports = router;
