import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Material / Item name is required'],
    trim: true,
  },
  partNumber: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    default: 'Bearings',
  },
  hsnCode: {
    type: String,
    default: '8482',
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  unit: {
    type: String,
    default: 'NOS',
    enum: ['NOS', 'PCS', 'SETS', 'METERS', 'BOXES', 'KGS'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit cost price is required'],
    min: [0, 'Unit price cannot be negative'],
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
    required: true,
  },
});

const paymentRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    default: 'Bank Transfer / NEFT',
    enum: ['Bank Transfer / NEFT', 'RTGS', 'UPI / IMPS', 'Cheque', 'Cash'],
  },
  reference: {
    type: String,
    default: '',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
  },
  recordedBy: {
    type: String,
    default: 'Admin',
  },
});

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    vendorInvoiceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
      index: true,
    },
    supplierName: {
      type: String,
      default: '',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Received', 'Pending', 'In Transit', 'Cancelled'],
      default: 'Received',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Paid'],
      default: 'Unpaid',
      index: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer / NEFT', 'RTGS', 'UPI / IMPS', 'Cheque', 'Cash'],
      default: 'Bank Transfer / NEFT',
    },
    paymentReference: {
      type: String,
      default: '',
    },
    payments: [paymentRecordSchema],
    notes: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: String,
      default: 'K. Karthick Kumar',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate sequential Purchase Order number PUR-YYYY-XXXX
purchaseInvoiceSchema.pre('save', async function (next) {
  if (!this.purchaseNumber && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PurchaseInvoice').countDocuments();
    const generated = `PUR-${year}-${String(count + 1).padStart(4, '0')}`;
    this.purchaseNumber = generated;
    this.invoiceNumber = generated;
  } else if (!this.purchaseNumber && this.invoiceNumber) {
    this.purchaseNumber = this.invoiceNumber;
  } else if (!this.invoiceNumber && this.purchaseNumber) {
    this.invoiceNumber = this.purchaseNumber;
  }

  // Calculate balance due
  this.balanceDue = Math.max(0, Math.round((this.grandTotal - this.paidAmount) * 100) / 100);

  // Update payment status
  if (this.paidAmount >= this.grandTotal && this.grandTotal > 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partially Paid';
  } else {
    this.paymentStatus = 'Unpaid';
  }

  next();
});

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
