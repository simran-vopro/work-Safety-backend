const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  address2: { type: String },
  sessionId: { type: String, required: true },
  message: { type: String },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      code: String,
      description: String,
      image: String,
      quantity: Number,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
