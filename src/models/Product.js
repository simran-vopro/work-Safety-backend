const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    Code: { type: String, required: true },
    Description: String,
    Pack: Number,
    rrp: Number,
    GrpSupplier: String,
    GrpSupplierCode: String,
    Manufacturer: String,
    ManufacturerCode: String,
    ISPCCombined: Number,
    VATCode: Number,
    Brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    ExtendedCharacterDesc: String,
    CatalogueCopy: String,
    ImageRef: { type: String, alias: 'Image Ref' },
    Category1: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    Category2: { type: mongoose.Schema.Types.ObjectId, ref: 'subcategories' },
    Category3: { type: mongoose.Schema.Types.ObjectId, ref: 'SubChildCategory' },
    Style: String
});

module.exports = mongoose.model('Product', productSchema, 'products');
