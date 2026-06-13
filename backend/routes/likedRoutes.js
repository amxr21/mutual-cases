const express = require("express");

const { addLike, removeLike, viewLiked, likedIds } = require("../controllers/liked");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { idParam, likeAddSchema, likeRemoveSchema } = require("../validation/schemas");

const router = express.Router();

// Liked product ids only (for hydrating UI heart state) — before "/:id".
router.get("/ids/:id", validate({ params: idParam }), asyncHandler(likedIds));

// Full liked list for a user.
router.get("/:id", validate({ params: idParam }), asyncHandler(viewLiked));

// Add / remove a like.
router.post("/", validate({ body: likeAddSchema }), asyncHandler(addLike));
router.delete("/", validate({ body: likeRemoveSchema }), asyncHandler(removeLike));

module.exports = router;
