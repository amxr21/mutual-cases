const express = require("express");

const { addLike, removeLike, viewLiked, likedIds } = require("../controllers/liked");
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { likeAddSchema, likeRemoveSchema } = require("../validation/schemas");

const router = express.Router();

// All liked routes require auth; user comes from the JWT (URL :id ignored).
router.get("/ids/:id", requireAuth, asyncHandler(likedIds));
router.get("/ids", requireAuth, asyncHandler(likedIds));

router.get("/:id", requireAuth, asyncHandler(viewLiked));
router.get("/", requireAuth, asyncHandler(viewLiked));

router.post("/", requireAuth, validate({ body: likeAddSchema }), asyncHandler(addLike));
router.delete("/", requireAuth, validate({ body: likeRemoveSchema }), asyncHandler(removeLike));

module.exports = router;
