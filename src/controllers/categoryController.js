import { ServiceCategory } from '../models/ServiceCategory.js';
import { Service } from '../models/Service.js';

export const getCategories = async (req, res, next) => {
  try {
    // If not admin, return only active categories
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await ServiceCategory.find(filter).sort({ displayOrder: 1, name: 1 });
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check for dependent services
    const dependentCount = await Service.countDocuments({ category: categoryId });
    if (dependentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${dependentCount} active service(s) belong to this category. Please reassign or delete them first.`,
      });
    }

    const category = await ServiceCategory.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
