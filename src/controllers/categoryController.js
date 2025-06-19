const Category = require('../models/Category');
const Subcategory = require('../models/SubCategory');
const SubSubCategory = require('../models/SubSubCategory');
const Brands = require('../models/Brand');

exports.getNestedCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();

    const results = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await Subcategory.find({ Category1: cat._id });

        const categories2 = await Promise.all(
          subCats.map(async (subCat) => {
            const subSubCats = await SubSubCategory.find({ Category2: subCat._id });
            const categories3 = subSubCats.map(s => ({
              _id: s._id,
              Category3: s.Category3
            }));

            return {
              _id: subCat._id,
              label: subCat.Category2,
              Categories3: categories3
            };
          })
        );

        const allCategories3 = categories2.flatMap((c) => c.Categories3);

        return {
          _id: cat._id,
          Category1: cat.Category1,
          icon: cat.icon,
          image: cat.image,
          Categories2: categories2,
          allCategories3
        };
      })
    );

    res.status(200).json({
      data: results,
    });

  } catch (error) {
    next(error);
  }
};

exports.getTopCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ top: true });

    const results = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await Subcategory.find({ Category1: cat._id });

        const categories2 = await Promise.all(
          subCats.map(async (subCat) => {
            const subSubCats = await SubSubCategory.find({ Category2: subCat._id });
            const categories3 = subSubCats.map(s => ({
              _id: s._id,
              Category3: s.Category3
            }));

            return {
              _id: subCat._id,
              label: subCat.Category2,
              Categories3: categories3
            };
          })
        );

        const allCategories3 = categories2.flatMap((c) => c.Categories3);

        return {
          _id: cat._id,
          Category1: cat.Category1,
          icon: cat.icon,
          image: cat.image,
          Categories2: categories2,
          allCategories3
        };
      })
    );


    res.status(200).json({
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brands.find();
    res.status(200).json({
      data: brands,
    });
  } catch (error) {
    next(error);
  }
}