const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const SubSubCategory = require('../models/SubSubCategory');

exports.getNestedCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();

    const results = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await SubCategory.find({ Category1: cat._id }).lean();

        const categories2 = await Promise.all(
          subCats.map(async (subCat) => {
            const subSubCats = await SubSubCategory.find({ Category2: subCat._id }).lean();
            const categories3 = subSubCats.map((s) => s.Category3);
            return {
              label: subCat.Category2,
              Categories3: categories3
            };
          })
        );

        const allCategories3 = categories2.flatMap((c) => c.Categories3);

        return {
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
