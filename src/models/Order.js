const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId : { type: String, required: true, unique: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  postcode: { type: String, required: true },
  company: { type: String, required: true },
  sessionId: { type: String, required: true },
  message: { type: String },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      code: String,
      description: String,
      image: String,
      quantity: Number,
      unitPrice: { type: Number },
      totalPrice : { type: Number },
    }
  ],
  status: { type: String, enum: ["pending", "Confirmed", "delivered"], default: "pending" },
  subtotal:  { type: Number },
  tax : { type: Number },
  total : { type: Number },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
