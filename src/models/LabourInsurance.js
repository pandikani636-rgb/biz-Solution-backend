import mongoose from 'mongoose';

const labourInsuranceSchema = new mongoose.Schema(
  {
    inquiryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    gstNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 15,
    },
    officialEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPersonRole: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    officialContactNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    numberOfLabours: {
      type: Number,
      required: true,
      min: 1,
    },
    workingPeriod: {
      type: String,
      required: true,
      enum: ['3 Months', '6 Months', '12 Months'],
      default: '12 Months',
    },
    insuranceCoverage: {
      type: String,
      required: true,
      enum: ['₹1 Lakh', '₹3 Lakhs', '₹5 Lakhs', '₹10 Lakhs'],
      default: '₹5 Lakhs',
    },
    estimatedPremium: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'quoted', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

labourInsuranceSchema.index({ status: 1, createdAt: -1 });

export const LabourInsurance = mongoose.model('LabourInsurance', labourInsuranceSchema);
