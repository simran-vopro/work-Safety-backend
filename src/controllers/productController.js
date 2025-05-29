const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    // Get query params
    const {
      page = 1,
      limit = 20,
      category1,
      category2,
      category3,
      minPrice,
      maxPrice
    } = req.query;

    // Build filter object
    const filter = {};

    if (category1) filter.Category1 = category1;
    if (category2) filter.Category2 = category2;
    if (category3) filter.Category3 = category3;

    if (minPrice || maxPrice) {
      filter.rrp = {};
      if (minPrice) filter.rrp.$gte = parseFloat(minPrice);
      if (maxPrice) filter.rrp.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()
      .populate('Category1')
      .populate('Category2')
      .populate('Category3');

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};
