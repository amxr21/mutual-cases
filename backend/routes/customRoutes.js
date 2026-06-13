const express = require("express");

const { submitCustomOrder } = require("../controllers/custom");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { customOrderSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/", validate({ body: customOrderSchema }), asyncHandler(submitCustomOrder));

module.exports = router;
