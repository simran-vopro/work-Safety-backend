const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, enum: ["admin", "normal-user", "agent"] },
        userId: { type: String, required: true },
        password: { type: String },
        email: { type: String },
        phone: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        address: { type: String },
        city: { type: String },
        company: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
