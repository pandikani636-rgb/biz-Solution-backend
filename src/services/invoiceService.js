import { Invoice } from '../models/Invoice.js';
import { PAYMENT_STATUS } from '../config/constants.js';

export const generateInvoiceForBooking = async (booking, paymentMethod = 'Online Gateway') => {
  // Check if invoice already exists
  let existing = await Invoice.findOne({ booking: booking._id });
  if (existing) {
    if (booking.paymentStatus === PAYMENT_STATUS.PAID && existing.paymentStatus !== PAYMENT_STATUS.PAID) {
      existing.paymentStatus = PAYMENT_STATUS.PAID;
      existing.paidAt = new Date();
      await existing.save();
    }
    return existing;
  }

  // Generate unique invoice number: INV-YEAR-TIMESTAMP
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const invoiceNumber = `INV-${year}-${randomSuffix}`;

  // Assemble invoice items
  const items = [
    {
      description: `${booking.serviceSnapshot.name} - ${booking.packageSnapshot.name}`,
      quantity: 1,
      unitPrice: booking.baseAmount,
      amount: booking.baseAmount,
    },
  ];

  if (booking.selectedAddOns && booking.selectedAddOns.length > 0) {
    booking.selectedAddOns.forEach((addon) => {
      items.push({
        description: `Add-on: ${addon.name}`,
        quantity: 1,
        unitPrice: addon.price,
        amount: addon.price,
      });
    });
  }

  const invoice = await Invoice.create({
    invoiceNumber,
    booking: booking._id,
    customer: booking.customer,
    items,
    subtotal: booking.baseAmount + (booking.addOnsTotal || 0),
    taxRate: booking.taxRate,
    taxAmount: booking.taxAmount,
    discountAmount: booking.coupon?.discountAmount || 0,
    totalAmount: booking.totalAmount,
    paymentStatus: booking.paymentStatus,
    paymentMethod,
    paidAt: booking.paymentStatus === PAYMENT_STATUS.PAID ? new Date() : null,
  });

  return invoice;
};
