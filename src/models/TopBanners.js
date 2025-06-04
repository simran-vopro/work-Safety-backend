const mongoose = require("mongoose");

const topBanners = new mongoose.Schema({
    banner: String,
    title: String,
});

module.exports = mongoose.model('Banner', topBanners);