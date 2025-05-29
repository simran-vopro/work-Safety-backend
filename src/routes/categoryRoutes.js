const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/nested-categories', categoryController.getNestedCategories);

module.exports = router;
