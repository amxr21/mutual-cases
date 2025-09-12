const express = require("express")

const { addToCart, viewCart, removeFromCart, updateCart } = require("../controllers/cart");

const router = express.Router();


router.get("/:id", viewCart)

router.post("/", addToCart)

router.delete("/:id", removeFromCart)

router.patch("/", updateCart)


module.exports = router