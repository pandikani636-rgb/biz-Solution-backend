import mongoose from 'mongoose';

const scrapPriceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    quantityUnit: {
      type: String,
      default: '1 KG',
      trim: true,
      maxlength: 50,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    displayOrder: {
      type: Number,
      default: 0,
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

scrapPriceSchema.index({ displayOrder: 1, isActive: 1 });

export const ScrapPrice = mongoose.model('ScrapPrice', scrapPriceSchema);
