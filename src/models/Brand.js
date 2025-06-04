const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  Brand: String,
});

module.exports = mongoose.model('Brand', brandSchema, 'brands');
