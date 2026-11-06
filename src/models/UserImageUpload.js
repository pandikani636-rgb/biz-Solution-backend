import mongoose from 'mongoose';

const userImageUploadSchema = new mongoose.Schema(
  {
    user: {
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
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    customerEmail: {
      type: String,
      trim: true,
      default: '',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: 'Not specified',
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    dimensions: {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      megapixels: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'quoted', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    partNotes: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    quotedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const UserImageUpload = mongoose.model('UserImageUpload', userImageUploadSchema);
