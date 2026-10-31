import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide banner title'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    badgeText: {
      type: String,
      default: 'Featured Solution',
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide banner image URL'],
    },
    ctaText: {
      type: String,
      default: 'Explore Services',
    },
    ctaLink: {
      type: String,
      default: '/services',
    },
    secondaryCtaText: {
      type: String,
      default: 'Book Consultation',
    },
    secondaryCtaLink: {
      type: String,
      default: '/contact',
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
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Banner = mongoose.model('Banner', bannerSchema);
