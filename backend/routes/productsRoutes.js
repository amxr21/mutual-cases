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
const validate = require("../middleware/validate");
const { idParam, productCreateSchema, productUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", asyncHandler(getProducts));

// Must be registered before "/:id" so "filters" isn't matched as an id.
router.get("/filters", asyncHandler(getFilters));

router.get("/:id", validate({ params: idParam }), asyncHandler(getProduct));

router.post("/", validate({ body: productCreateSchema }), asyncHandler(postProduct));

router.patch(
    "/:id",
    validate({ params: idParam, body: productUpdateSchema }),
    asyncHandler(updateProduct)
);

router.delete("/:id", validate({ params: idParam }), asyncHandler(deleteProduct));

module.exports = router;
