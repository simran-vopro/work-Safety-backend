const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/nested-categories', categoryController.getNestedCategories);
router.get('/top-categories', categoryController.getTopCategories);


router.get('/brands', categoryController.getBrands);
router.post('/brand', categoryController.addBrand);
router.put('/brand/:id', categoryController.updateBrand);
router.delete('/brand/:id', categoryController.deleteBrand);

// Category
router.post('/category', categoryController.addCategory);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

// Subcategory
router.post('/subcategory', categoryController.addSubCategory);
router.put('/subcategory/:id', categoryController.updateSubCategory);
router.delete('/subcategory/:id', categoryController.deleteSubCategory);

// Sub-Subcategory
router.post('/subsubcategory', categoryController.addSubSubCategory);
router.put('/subsubcategory/:id', categoryController.updateSubSubCategory);
router.delete('/subsubcategory/:id', categoryController.deleteSubSubCategory);

module.exports = router;
