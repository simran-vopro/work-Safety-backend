const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/request-quote', orderController.requestQuote);

module.exports = router;
