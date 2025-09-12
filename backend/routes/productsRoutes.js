const express = require('express');

// controllers
const { getProducts, getProduct, postProduct, updateProduct, deleteProduct, test } = require('../controllers/products')
const router = express.Router()

router.get("/test", test);

router.get("/", getProducts)

router.get("/:id", getProduct);

router.patch("/:id", updateProduct)

router.delete("/:id", deleteProduct)

router.post("/", postProduct)


module.exports = router 