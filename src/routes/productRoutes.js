const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.getProducts);
router.get('/get-product/:productId', productController.getSingleProduct);

module.exports = router;
