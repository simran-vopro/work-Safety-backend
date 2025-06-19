const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const uploadCSV = require('../utils/uploadCSV');

router.get('/', productController.getProducts);
router.get('/get-product/:productId', productController.getSingleProduct);
router.post('/upload-csv', auth, uploadCSV.single("file"), productController.uploadSimpleCSV);

module.exports = router;

