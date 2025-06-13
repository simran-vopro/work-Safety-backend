const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');

router.post('/request-quote', orderController.requestQuote);
router.get("/get-all-orders", auth, orderController.getOrders);
router.get('/get-order/:orderId', orderController.getOrder);
router.put('/edit-order/:orderId', orderController.editOrder);

module.exports = router;
