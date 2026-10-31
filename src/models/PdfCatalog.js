import mongoose from 'mongoose';

const pdfProductSchema = new mongoose.Schema(
  {
    partNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: 'General', trim: true },
    section: { type: String, default: '', trim: true },
    categoryName: { type: String, default: '', trim: true },
    subcategoryName: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    mrp: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    specifications: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
  },
  { _id: true }
);

const pdfSubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    products: [pdfProductSchema],
  },
  { _id: true }
);

const pdfCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    subcategories: [pdfSubcategorySchema],
  },
  { _id: true }
);

const pdfCatalogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    totalCategories: {
      type: Number,
      default: 0,
    },
    categories: [pdfCategorySchema],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PdfCatalog = mongoose.model('PdfCatalog', pdfCatalogSchema);
