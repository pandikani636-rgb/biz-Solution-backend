import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier / Vendor business name is required'],
      trim: true,
    },
    supplierCode: {
      type: String,
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Supplier phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      default: 'Bearings',
      enum: [
        'Bearings',
        'Belts & Transmission',
        'Power Transmission Belts',
        'Bush Pulleys & Bushes',
        'Industrial Gears',
        'Gearboxes & Spares',
        'Electric Motors & Drives',
        'Motors',
        'Industrial Lubricants',
        'Raw Materials & Steel',
        'General Hardware',
        'Other',
      ],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
    paymentTerms: {
      type: String,
      default: 'Net 30 Days',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    invoiceCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate supplier code before saving if not provided
supplierSchema.pre('save', async function (next) {
  if (!this.supplierCode) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierCode = `SUP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Supplier = mongoose.model('Supplier', supplierSchema);
