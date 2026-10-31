import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a customer'],
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Booking must be associated with a service'],
      index: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      required: [true, 'Booking must have an associated package'],
    },
    // Immutable snapshot of service and package details at checkout time
    serviceSnapshot: {
      name: { type: String, required: true },
      slug: { type: String },
      serviceType: { type: String },
      mainImage: { type: String },
    },
    packageSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      discountPrice: { type: Number, default: 0 },
      duration: { type: String },
      features: { type: [String], default: [] },
    },
    // Add-ons selected by customer
    selectedAddOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, default: '' },
      },
    ],
    // Dynamic form values submitted by customer matching service.requiredFormFields
    dynamicFormData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Pricing Breakdown
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    newUserMarkupRate: {
      type: Number,
      default: 0,
    },
    newUserSurcharge: {
      type: Number,
      default: 0,
    },
    addOnsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Workflow Status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    customerNotes: {
      type: String,
      default: '',
    },
    internalNotes: {
      type: String,
      default: '',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to check valid status transitions
bookingSchema.methods.canTransitionTo = function (nextStatus) {
  const current = this.status;
  const allowed = {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.COMPLETED]: [],
    [BOOKING_STATUS.CANCELLED]: [],
    [BOOKING_STATUS.REJECTED]: [],
  };
  return allowed[current] ? allowed[current].includes(nextStatus) : false;
};

export const Booking = mongoose.model('Booking', bookingSchema);
