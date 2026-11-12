import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    linkUrl: {
      type: String,
      default: '/services',
      trim: true,
    },
    ctaText: {
      type: String,
      default: 'Explore Offer',
      trim: true,
      maxlength: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    badgeText: {
      type: String,
      default: 'Exclusive Deal',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

advertisementSchema.index({ isActive: 1, priority: -1, createdAt: -1 });

export const Advertisement = mongoose.model('Advertisement', advertisementSchema);
