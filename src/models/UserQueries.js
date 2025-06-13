const mongoose = require("mongoose");

const queriesSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        phone: { type: String },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        company: { type: String, required: true },
        userId: { type: String, required: true },
        message: { type: String },
        document : {type: String}
    },
    { timestamps: true }
);

module.exports = mongoose.model("Query", queriesSchema);
