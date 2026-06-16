const express = require("express");

const { getPublicSettings } = require("../controllers/settings");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Public, unauthenticated subset of settings the storefront needs (safe flags
// only — e.g. whether location autodetect is enabled). Admin settings stay
// behind requireAdmin in adminRoutes.
router.get("/public", asyncHandler(getPublicSettings));

module.exports = router;
