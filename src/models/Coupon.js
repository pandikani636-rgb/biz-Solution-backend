import mongoose from 'mongoose';
import { DISCOUNT_TYPES } from '../config/constants.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.PERCENTAGE,
    },
    discountValue: {
      type: Number,
      required: [true, 'Please specify discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    minBookingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 means no cap
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Please set expiration date'],
    },
    usageLimit: {
      type: Number,
      default: 100, // total redemption limit
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: 1,
    },
    applicableServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
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

couponSchema.methods.isValidFor = function (bookingAmount, serviceId) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon is not yet active' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (bookingAmount < this.minBookingAmount) {
    return {
      valid: false,
      message: `Minimum booking amount of ₹${this.minBookingAmount} required for this coupon`,
    };
  }
  if (this.applicableServices && this.applicableServices.length > 0) {
    const isApplicable = this.applicableServices.some(
      (id) => id.toString() === serviceId.toString()
    );
    if (!isApplicable) {
      return { valid: false, message: 'Coupon is not applicable to this service' };
    }
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (bookingAmount) {
  let discount = 0;
  if (this.discountType === DISCOUNT_TYPES.PERCENTAGE) {
    discount = (bookingAmount * this.discountValue) / 100;
    if (this.maxDiscount > 0 && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = Math.min(this.discountValue, bookingAmount);
  }
  return Math.round(discount * 100) / 100;
};

export const Coupon = mongoose.model('Coupon', couponSchema);
