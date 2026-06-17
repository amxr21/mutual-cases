const express = require("express");

const {
    getProducts,
    getProduct,
    getFilters,
    postProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/products");
const { subscribeBackInStock } = require("../controllers/inventory");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const validate = require("../middleware/validate");
const {
    idParam,
    productCreateSchema,
    productUpdateSchema,
    stockNotifySchema,
} = require("../validation/schemas");

const router = express.Router();

// Public reads.
router.get("/", asyncHandler(getProducts));

// Must be registered before "/:id" so "filters" isn't matched as an id.
router.get("/filters", asyncHandler(getFilters));

router.get("/:id", validate({ params: idParam }), asyncHandler(getProduct));

// Public: subscribe an email to be notified when a product is back in stock.
router.post(
    "/:id/notify-stock",
    validate({ params: idParam, body: stockNotifySchema }),
    asyncHandler(subscribeBackInStock)
);

// Admin-only writes, scoped to the 'products' permission (owner/manager).
router.post("/", requireAdmin, requirePermission("products"), validate({ body: productCreateSchema }), asyncHandler(postProduct));

router.patch(
    "/:id",
    requireAdmin,
    requirePermission("products"),
    validate({ params: idParam, body: productUpdateSchema }),
    asyncHandler(updateProduct)
);

router.delete("/:id", requireAdmin, requirePermission("products"), validate({ params: idParam }), asyncHandler(deleteProduct));

module.exports = router;
