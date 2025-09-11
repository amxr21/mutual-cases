const express = require("express")

const router = express.Router();

const { addToCart, viewCart, removeFromCart, updateCart } = require("../controllers/cart");

router.post("/", addToCart)

router.get("/:id", viewCart)

router.delete("/:id", removeFromCart)

router.patch("/", updateCart)


module.exports = router