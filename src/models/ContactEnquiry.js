import mongoose from 'mongoose';
import { ENQUIRY_STATUS } from '../config/constants.js';

const contactEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Please provide your message'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    enquiryType: {
      type: String,
      enum: ['general', 'rfq', 'bulk_order', 'ticket_booking', 'travel_booking'],
      default: 'general',
      index: true,
    },
    quotationNumber: {
      type: String,
      default: '',
      index: true,
    },
    monthlySequence: {
      type: Number,
      default: 1,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryLocation: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    partNumber: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    targetPrice: {
      type: Number,
      default: 0,
    },
    approvedPrice: {
      type: Number,
      default: 0,
    },
    items: [
      {
        category: { type: String, default: '' },
        partNumber: { type: String, default: '' },
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        hsn: { type: String, default: '8482' },
        quantity: { type: Number, default: 1 },
        mrp: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 48 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      default: '7 DAYS CREDIT',
    },
    deliveryTerms: {
      type: String,
      default: 'SELF TO SRIVIL',
    },
    customerImages: [
      {
        url: { type: String, default: '' },
        filename: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ENQUIRY_STATUS),
      default: ENQUIRY_STATUS.NEW,
      index: true,
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
    replyMessage: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);
