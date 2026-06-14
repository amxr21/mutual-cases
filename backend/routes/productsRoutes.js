const express = require("express");

const {
    getProducts,
    getProduct,
    getFilters,
    postProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/products");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { idParam, productCreateSchema, productUpdateSchema } = require("../validation/schemas");

const router = express.Router();

// Public reads.
router.get("/", asyncHandler(getProducts));

// Must be registered before "/:id" so "filters" isn't matched as an id.
router.get("/filters", asyncHandler(getFilters));

router.get("/:id", validate({ params: idParam }), asyncHandler(getProduct));

// Admin-only writes.
router.post("/", requireAdmin, validate({ body: productCreateSchema }), asyncHandler(postProduct));

router.patch(
    "/:id",
    requireAdmin,
    validate({ params: idParam, body: productUpdateSchema }),
    asyncHandler(updateProduct)
);

router.delete("/:id", requireAdmin, validate({ params: idParam }), asyncHandler(deleteProduct));

module.exports = router;
