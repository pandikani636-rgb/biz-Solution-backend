import mongoose from 'mongoose';
import slugify from 'slugify';

const formFieldSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    fieldType: {
      type: String,
      enum: ['text', 'number', 'select', 'date', 'textarea', 'email', 'tel', 'checkbox'],
      default: 'text',
    },
    placeholder: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    helpText: {
      type: String,
      default: '',
    },
    defaultValue: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
      maxlength: [120, 'Service name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Please select a service category'],
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide short description'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Please provide detailed description'],
    },
    mainImage: {
      type: String,
      required: [true, 'Please provide main service image'],
      default: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    serviceType: {
      type: String,
      enum: ['industrial', 'bearing', 'belt', 'pulley', 'travel', 'recharge', 'insurance', 'education', 'logistics', 'consulting', 'business', 'general'],
      default: 'industrial',
      index: true,
    },
    brand: {
      type: String,
      enum: ['PIX', 'NBC', 'HCH', 'Fenner', 'Timken', 'SKF', 'General', 'Other'],
      default: 'General',
      index: true,
    },
    partNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    section: {
      type: String,
      enum: ['Bearing', 'Belt', 'Bush Pulley', 'General'],
      default: 'General',
      index: true,
    },
    mrp: {
      type: Number,
      default: 0,
      min: [0, 'MRP cannot be negative'],
    },
    discountPercentage: {
      type: Number,
      default: 46,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    deliveryIncluded: {
      type: Boolean,
      default: true,
    },
    origin: {
      type: String,
      enum: ['National', 'International', 'Both', 'Standard'],
      default: 'Standard',
      index: true,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    basePrice: {
      type: Number,
      required: [true, 'Please provide base price'],
      min: [0, 'Base price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 18, // 18% standard GST / Tax
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    processingTime: {
      type: String,
      default: '24-48 Hours',
    },
    requiredFormFields: {
      type: [formFieldSchema],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    terms: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metaTitle: {
      type: String,
      default: '',
    },
    metaDescription: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for packages
serviceSchema.virtual('packages', {
  ref: 'ServicePackage',
  localField: '_id',
  foreignField: 'service',
});

serviceSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Service = mongoose.model('Service', serviceSchema);
