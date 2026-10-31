import mongoose from 'mongoose';
import slugify from 'slugify';

const contentPageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide page title'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide page content'],
    },
    metaTitle: {
      type: String,
      default: '',
    },
    metaDescription: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

contentPageSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export const ContentPage = mongoose.model('ContentPage', contentPageSchema);
