const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 }
    }
  ]
});

module.exports = mongoose.model("Cart", cartSchema);
