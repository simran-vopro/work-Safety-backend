const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    // Get query params
    const {
      page = 1,
      limit = 20,
      search,
    } = req.query;



    const filter = {};

    // Add search filter (case-insensitive match on Style or Description)
    if (search) {
      filter.Style = search; // exact match only
    }


    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()
      .populate('Category1')
      .populate('Category2')
      .populate('Category3');

    const total = await Product.countDocuments();

    res.status(200).json({
      data: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};
