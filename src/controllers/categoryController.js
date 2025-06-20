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


// Add a new brand
exports.addBrand = async (req, res, next) => {
  try {
    const { Brand } = req.body;
    const newBrand = new Brands({ Brand });
    await newBrand.save();
    res.status(201).json({ message: 'Brand added', data: newBrand });
  } catch (error) {
    next(error);
  }
};

// Update brand
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBrand = await Brands.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBrand) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand updated', data: updatedBrand });
  } catch (error) {
    next(error);
  }
};

// Delete brand
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Brands.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Add New Category
exports.addCategory = async (req, res, next) => {
  try {
    const { Category1, icon, image, top } = req.body;
    const newCat = new Category({ Category1, icon, image, top });
    await newCat.save();
    res.status(201).json({ message: 'Category added', data: newCat });
  } catch (err) {
    next(err);
  }
};

// --- Update Category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedCat = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCat) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category updated', data: updatedCat });
  } catch (err) {
    next(err);
  }
};

// --- Delete Category (and its subcategories)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Subcategory.deleteMany({ Category1: id });
    await SubSubCategory.deleteMany({ Category1: id });
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category and related subcategories deleted' });
  } catch (err) {
    next(err);
  }
};

// --- Add Subcategory
exports.addSubCategory = async (req, res, next) => {
  try {
    const { Category2, Category1, image } = req.body;
    const newSubCat = new Subcategory({ Category2, Category1, image });
    await newSubCat.save();
    res.status(201).json({ message: 'Subcategory added', data: newSubCat });
  } catch (err) {
    next(err);
  }
};

// --- Update Subcategory
exports.updateSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Subcategory.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// --- Delete Subcategory (and its sub-subcategories)
exports.deleteSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SubSubCategory.deleteMany({ Category2: id });
    const deleted = await Subcategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory and its sub-subcategories deleted' });
  } catch (err) {
    next(err);
  }
};

// --- Add Sub-Subcategory
exports.addSubSubCategory = async (req, res, next) => {
  try {
    const { Category3, Category1, Category2 } = req.body;
    const newSubSubCat = new SubSubCategory({ Category3, Category1, Category2 });
    await newSubSubCat.save();
    res.status(201).json({ message: 'Sub-Subcategory added', data: newSubSubCat });
  } catch (err) {
    next(err);
  }
};

// --- Update Sub-Subcategory
exports.updateSubSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await SubSubCategory.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Sub-Subcategory not found' });
    res.json({ message: 'Sub-Subcategory updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// --- Delete Sub-Subcategory
exports.deleteSubSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SubSubCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Sub-Subcategory not found' });
    res.json({ message: 'Sub-Subcategory deleted' });
  } catch (err) {
    next(err);
  }
};
