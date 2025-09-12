const express = require("express")
const router = express.Router();
const { addToCart, viewCart, removeFromCart, updateCart } = require("../controllers/cart");


router.get("/:id", viewCart)

router.post("/", addToCart)

router.delete("/:id", removeFromCart)

router.patch("/", updateCart)


module.exports = router