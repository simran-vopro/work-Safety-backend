const mongoose = require('mongoose');
const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category1,
      category2,
      category3,
      brand
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { Style: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } }
      ];
    }

    const toObjectIdArray = (param) => {
      if (!param) return undefined;

      // Already an array (e.g., ?category1=A&category1=B)
      if (Array.isArray(param)) {
        return { $in: param.map(id => new mongoose.Types.ObjectId(id)) };
      }

      // Try to parse JSON (e.g. '["A","B"]')
      try {
        const parsed = JSON.parse(param);
        if (Array.isArray(parsed)) {
          return { $in: parsed.map(id => new mongoose.Types.ObjectId(id)) };
        }
        return mongoose.Types.ObjectId(parsed); // single string
      } catch {
        // Fallback: comma-separated string
        const ids = param.split(',');
        return { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
      }
    };

    const parsedCategory1 = toObjectIdArray(category1);
    if (parsedCategory1) filter.Category1 = parsedCategory1;

    const parsedCategory2 = toObjectIdArray(category2);
    if (parsedCategory2) filter.Category2 = parsedCategory2;

    const parsedCategory3 = toObjectIdArray(category3);
    if (parsedCategory3) filter.Category3 = parsedCategory3;

    const parsedBrands = toObjectIdArray(brand);
    if (parsedBrands) filter.Brand = parsedBrands;


    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()
      .populate('Category1')
      .populate('Category2')
      .populate('Category3')
      .populate('Brand');

    const total = await Product.countDocuments(filter);

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

