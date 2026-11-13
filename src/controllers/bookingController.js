import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { ServicePackage } from '../models/ServicePackage.js';
import { Coupon } from '../models/Coupon.js';
import { Payment } from '../models/Payment.js';
import { calculateBookingPrice } from '../services/pricingService.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';
import { sendNewOrderNotificationEmail } from '../services/emailService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';

export const createBooking = async (req, res, next) => {
  try {
    const { serviceId, packageId, selectedAddOns = [], dynamicFormData = {}, couponCode, customerNotes } = req.body;

    if (!serviceId || !packageId) {
      return res.status(400).json({ success: false, message: 'Service and Package are required' });
    }

    // 1. Fetch Service and Package from DB
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(400).json({ success: false, message: 'Selected service is no longer active or available' });
    }

    const pkg = await ServicePackage.findOne({ _id: packageId, service: serviceId, isActive: true });
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Selected package is not available for this service' });
    }

    // 2. Validate dynamic form fields required by the service
    if (service.requiredFormFields && service.requiredFormFields.length > 0) {
      for (const field of service.requiredFormFields) {
        if (field.required) {
          const val = dynamicFormData[field.fieldName];
          if (val === undefined || val === null || val === '') {
            return res.status(400).json({
              success: false,
              message: `Field '${field.label}' is required for this service.`,
            });
          }
        }
      }
    }

    // 3. Validate Add-ons against package definition
    const validAddOns = [];
    if (Array.isArray(selectedAddOns) && selectedAddOns.length > 0) {
      for (const reqAddon of selectedAddOns) {
        const found = pkg.addOns.find((a) => a.name === reqAddon.name);
        if (found) {
          validAddOns.push({
            name: found.name,
            price: found.price,
            description: found.description || '',
          });
        }
      }
    }

    // 4. Validate Coupon if provided
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (!couponDoc) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }
      const initialSubtotal = (pkg.discountPrice > 0 ? pkg.discountPrice : pkg.price) +
        validAddOns.reduce((s, a) => s + a.price, 0);

      const validity = couponDoc.isValidFor(initialSubtotal, service._id);
      if (!validity.valid) {
        return res.status(400).json({ success: false, message: validity.message });
      }
    }

    // 5. Calculate Server-side Verified Pricing
    // Determine if percentage-based pricing applies (only to newly registered users; existing users pay 0% extra)
    const isNewUserCustomer = Boolean(req.user.isNewUser || req.user.pricingTier === 'new_user');
    const userMarkupPercentage = isNewUserCustomer ? (req.user.markupPercentage ?? 5) : 0;

    const pricing = calculateBookingPrice({
      packagePrice: pkg.price,
      discountPrice: pkg.discountPrice,
      selectedAddOns: validAddOns,
      coupon: couponDoc,
      taxRate: service.taxRate || 18,
      isNewUser: isNewUserCustomer,
      markupPercentage: userMarkupPercentage,
    });

    // 6. Generate Unique Booking Reference
    const year = new Date().getFullYear();
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const bookingNumber = `BK-${year}-${randomHex}`;

    // 7. Create Booking Document with immutable snapshots
    const booking = await Booking.create({
      bookingNumber,
      customer: req.user._id,
      service: service._id,
      package: pkg._id,
      serviceSnapshot: {
        name: service.name,
        slug: service.slug,
        serviceType: service.serviceType,
        mainImage: service.mainImage,
      },
      packageSnapshot: {
        name: pkg.name,
        price: pkg.price,
        discountPrice: pkg.discountPrice,
        duration: pkg.duration,
        features: pkg.features || [],
      },
      selectedAddOns: validAddOns,
      dynamicFormData,
      baseAmount: pricing.baseAmount,
      newUserMarkupRate: pricing.newUserMarkupRate || 0,
      newUserSurcharge: pricing.newUserSurcharge || 0,
      addOnsTotal: pricing.addOnsTotal,
      coupon: pricing.coupon,
      taxRate: pricing.taxRate,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      customerNotes: customerNotes || '',
      statusHistory: [
        {
          status: BOOKING_STATUS.PENDING,
          timestamp: new Date(),
          note: 'Booking order initiated by customer',
          updatedBy: req.user._id,
        },
      ],
    });

    // Update coupon used count if applicable
    if (couponDoc) {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    // Notify Customer & Admin
    await createNotification({
      recipient: req.user._id,
      title: 'Booking Order Received',
      message: `Your booking #${booking.bookingNumber} for ${service.name} has been initiated. Complete payment to finalize.`,
      type: 'booking',
      link: `/customer/bookings/${booking._id}`,
    });

    await notifyAdmins({
      title: 'New Booking Order',
      message: `Customer ${req.user.name} placed a booking #${booking.bookingNumber} for ${service.name} (₹${booking.totalAmount}).`,
      type: 'booking',
      link: `/admin/bookings/${booking._id}`,
    });

    // Send automated email notification with order details to business owner / admin
    sendNewOrderNotificationEmail({
      order: booking,
      customer: req.user,
      service,
      pkg,
    }).catch((err) => {
      console.error('[Admin Order Email Background Error]', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Booking initiated successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customer: req.user._id };

    if (status && Object.values(BOOKING_STATUS).includes(status)) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'name slug mainImage serviceType')
        .populate('package', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone avatar')
      .populate('service', 'name slug mainImage category serviceType')
      .populate('package', 'name price duration')
      .populate('assignedStaff', 'name email')
      .populate('statusHistory.updatedBy', 'name');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: customer can only view their own booking
    if (req.user.role === ROLES.CUSTOMER && booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this booking' });
    }

    // Look up associated payment and invoice
    const [payment, invoice] = await Promise.all([
      Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 }),
      import('../models/Invoice.js').then((m) => m.Invoice.findOne({ booking: booking._id })),
    ]);

    res.json({
      success: true,
      data: {
        ...booking.toObject(),
        payment,
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If customer, ensure it's their booking and in cancellable state
    if (req.user.role === ROLES.CUSTOMER) {
      if (booking.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking with current status: ${booking.status}. Please contact support.`,
        });
      }
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = reason;
    booking.statusHistory.push({
      status: BOOKING_STATUS.CANCELLED,
      timestamp: new Date(),
      note: `Cancelled: ${reason}`,
      updatedBy: req.user._id,
    });

    await booking.save();

    await createNotification({
      recipient: booking.customer,
      title: 'Booking Cancelled',
      message: `Booking #${booking.bookingNumber} has been cancelled.`,
      type: 'booking',
      link: `/customer/bookings/${booking._id}`,
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all bookings with filtering & search
export const getAllBookings = async (req, res, next) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      serviceId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status && Object.values(BOOKING_STATUS).includes(status)) {
      query.status = status;
    }

    if (paymentStatus && Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }

    if (serviceId) {
      query.service = serviceId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { 'serviceSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('customer', 'name email phone avatar')
        .populate('service', 'name slug serviceType')
        .populate('package', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update booking workflow status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note = '', internalNotes, assignedStaff } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status && status !== booking.status) {
      // Validate workflow transition
      if (!booking.canTransitionTo(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid workflow transition from '${booking.status}' to '${status}'.`,
        });
      }

      booking.status = status;
      booking.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status} by administrator`,
        updatedBy: req.user._id,
      });

      // Notify customer with specific notification on order confirmation
      const isConfirmed = status === BOOKING_STATUS.CONFIRMED || status === 'confirmed';
      const notificationTitle = isConfirmed ? 'Your order has been confirmed!' : `Booking Status: ${status.toUpperCase().replace('_', ' ')}`;
      const notificationMessage = isConfirmed
        ? 'Your order has been confirmed!'
        : `Your booking #${booking.bookingNumber} is now ${status.replace('_', ' ')}. ${note}`;

      await createNotification({
        recipient: booking.customer,
        title: notificationTitle,
        message: notificationMessage,
        type: 'booking',
        link: `/customer/bookings/${booking._id}`,
      });
    }

    if (internalNotes !== undefined) booking.internalNotes = internalNotes;
    if (assignedStaff !== undefined) booking.assignedStaff = assignedStaff;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
