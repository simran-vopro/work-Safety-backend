const mongoose = require('mongoose');
const Product = require('../models/Product');
const Brand = require('../models/Brand');

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const SubChildCategory = require('../models/SubSubCategory');

const csv = require('csv-parser');
const fs = require('fs');

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

exports.getSingleProduct = async (req, res, next) => {
  const { productId } = req.params;


  if (!productId) {
    return res.status(400).json({ error: "Missing productId" });
  }

  try {
    const product = await Product.findById({ _id: productId });


    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }


    return res.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }

}

// exports.uploadFile = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file received" });
//     }

//     const filePath = req.file.path;
//     const products = await parseProductCSV(filePath);

//     try {
//       const result = await Product.insertMany(products);
//       console.log("Products inserted:", result.length);
//     } catch (insertErr) {
//       console.error("InsertMany Error:", insertErr);
//       if (insertErr && insertErr.writeErrors) {
//         insertErr.writeErrors.forEach((e, i) => {
//           console.error(`Error ${i + 1}:`, e.err.op.Code, e.err.errmsg || e.err);
//         });
//       }
//     }

//     // Clean up CSV file
//     try {
//       fs.unlinkSync(filePath);
//     } catch (unlinkErr) {
//       console.error("File deletion error:", unlinkErr);
//     }

//     res.status(200).json({ message: "Upload process completed" });
//   } catch (error) {
//     console.error("Upload handler error:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     res.status(500).json({ message: "Upload Failed", error: error.message });
//   }
// };


async function resolveCategoryIds(row) {
  const [cat1, cat2, cat3] = await Promise.all([
    Category.findOne({ Category1: row.Category1 }),
    Subcategory.findOne({ Category2: row.Category2 }),
    SubChildCategory.findOne({ Category3: row.Category3 }),
  ]);
  return {
    Category1: cat1?._id || null,
    Category2: cat2?._id || null,
    Category3: cat3?._id || null,
  };
}

async function resolveBrandId(brandName) {
  const brand = await Brand.findOne({ Brand: brandName });
  return brand ? brand._id : null;
}

exports.uploadSimpleCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file received' });

    const filePath = req.file.path;
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        try {
          // Preload brands and categories into maps
          const [brands, cats1, cats2, cats3] = await Promise.all([
            Brand.find(),
            Category.find(),
            Subcategory.find(),
            SubChildCategory.find(),
          ]);

          const brandMap = new Map(brands.map(b => [b.Brand, b._id]));
          const cat1Map = new Map(cats1.map(c => [c.Category1, c._id]));
          const cat2Map = new Map(cats2.map(c => [c.Category2, c._id]));
          const cat3Map = new Map(cats3.map(c => [c.Category3, c._id]));

          const products = [];

          for (const row of rows) {
            const product = {
              Code: row.Code || row.Style,
              Description: row.Description,
              Pack: parseFloat(row.Pack),
              rrp: parseFloat(row.rrp),
              GrpSupplier: row.GrpSupplier,
              GrpSupplierCode: row.GrpSupplierCode,
              Manufacturer: row.Manufacturer,
              ManufacturerCode: row.ManufacturerCode,
              ISPCCombined: parseInt(row.ISPCCombined),
              VATCode: parseInt(row.VATCode),
              Brand: brandMap.get(row.Brand) || null,
              ExtendedCharacterDesc: row.ExtendedCharacterDesc,
              CatalogueCopy: row.CatalogueCopy,
              ImageRef: row['Image Ref'],
              Category1: cat1Map.get(row.Category1) || null,
              Category2: cat2Map.get(row.Category2) || null,
              Category3: cat3Map.get(row.Category3) || null,
              Style: row.Style,
            };

            products.push(product);
          }

          await Product.insertMany(products, { ordered: false });
          fs.unlinkSync(filePath);

          res.status(200).json({ message: 'Products uploaded successfully', count: products.length });
        } catch (err) {
          console.error('Upload error:', err);
          res.status(500).json({ message: 'Upload failed', error: err.message });
        }
      });
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};
