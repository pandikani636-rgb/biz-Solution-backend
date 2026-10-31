import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please provide question'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Please provide answer'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

export const FAQ = mongoose.model('FAQ', faqSchema);
