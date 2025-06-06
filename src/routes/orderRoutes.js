const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/request-quote', orderController.requestQuote);
router.get('/get-order/:orderId', orderController.getOrder);
router.put('/edit-order/:orderId', orderController.editOrder);

module.exports = router;
