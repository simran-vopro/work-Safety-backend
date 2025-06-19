const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  Category2: String,
  Category1: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
  image: String,
});

module.exports = mongoose.model('SubCategory', subCategorySchema, 'subcategories');
