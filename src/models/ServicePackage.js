import mongoose from 'mongoose';
import slugify from 'slugify';

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const servicePackageSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Package must belong to a service'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide package name'],
      trim: true,
      maxlength: [80, 'Package name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please specify package price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative'],
    },
    duration: {
      type: String,
      default: 'Standard Service Duration',
    },
    features: {
      type: [String],
      default: [],
    },
    addOns: {
      type: [addOnSchema],
      default: [],
    },
    validityDays: {
      type: Number,
      default: 30,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

servicePackageSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema);
