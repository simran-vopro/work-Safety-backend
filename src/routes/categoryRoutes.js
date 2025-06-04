const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/nested-categories', categoryController.getNestedCategories);
router.get('/top-categories', categoryController.getTopCategories);
router.get('/brands', categoryController.getBrands);

module.exports = router;
