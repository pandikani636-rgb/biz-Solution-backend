import { Invoice } from '../models/Invoice.js';
import { Booking } from '../models/Booking.js';
import { generateInvoiceForBooking } from '../services/invoiceService.js';
import { ROLES } from '../config/constants.js';

export const getInvoiceByBookingId = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === ROLES.CUSTOMER && booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let invoice = await Invoice.findOne({ booking: booking._id }).populate('customer', 'name email phone address');
    if (!invoice) {
      invoice = await generateInvoiceForBooking(booking);
      await invoice.populate('customer', 'name email phone address');
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
