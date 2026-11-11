import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['female', 'male', 'other'], required: true },
  },
  { _id: false }
);

const ticketBookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    transportType: { type: String, enum: ['bus', 'train', 'flight'], required: true, index: true },
    source: { type: String, required: true, trim: true, maxlength: 120 },
    destination: { type: String, required: true, trim: true, maxlength: 120 },
    travelAt: { type: Date, required: true, index: true },
    returnAt: { type: Date, default: null },
    travelDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    passengers: { type: [passengerSchema], required: true, validate: [(items) => items.length > 0, 'At least one passenger is required'] },
    passengerContact: {
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    fareClass: { type: String, required: true },
    seatPreference: { type: String, default: '' },
    seatAssignments: { type: [String], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled'], default: 'pending', index: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
    payment: {
      provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
      method: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'emi', 'paylater'], default: 'upi' },
      orderId: { type: String, default: '' },
      paymentId: { type: String, default: '' },
      refundId: { type: String, default: '' },
      refundStatus: { type: String, enum: ['pending', 'processed', 'failed'], default: null },
      amount: { type: Number, default: 0 },
      paidAt: { type: Date, default: null },
    },
    cancellationStatus: { type: String, enum: ['not_requested', 'requested', 'approved', 'rejected', 'refund_pending', 'refunded'], default: 'not_requested', index: true },
    cancellationReason: { type: String, default: '' },
    ticketNumber: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const TicketBooking = mongoose.model('TicketBooking', ticketBookingSchema);
