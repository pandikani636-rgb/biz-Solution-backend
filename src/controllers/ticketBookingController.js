import crypto from 'crypto';
import Razorpay from 'razorpay';
import { TicketBooking } from '../models/TicketBooking.js';
import { notifyAdmins, createNotification } from '../services/notificationService.js';
import { isTicketCancellationAllowed } from '../services/ticketBookingPolicy.js';

const FARES = {
  bus: { seater: 499, sleeper: 799, ac_sleeper: 1299 },
  train: { second_sitting: 250, sleeper: 500, ac_3_tier: 1100, ac_2_tier: 1800, ac_1_tier: 3000 },
  flight: { economy: 4500, premium_economy: 7800, business: 16000, first: 32000 },
};

export const refundTicketPayment = async (req, res, next) => {
  try {
    if (!razorpayEnabled()) {
      return res.status(503).json({ success: false, message: 'Online refunds are not configured.' });
    }
    const booking = await TicketBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Ticket booking not found.' });
    if (booking.paymentStatus !== 'paid' || !booking.payment.paymentId) {
      return res.status(400).json({ success: false, message: 'Only captured ticket payments can be refunded.' });
    }
    if (booking.status !== 'cancelled' || booking.cancellationStatus !== 'refund_pending') {
      return res.status(400).json({ success: false, message: 'This booking has no pending cancellation refund.' });
    }
    const razorpay = createRazorpayClient();
    let refund;
    if (booking.payment.refundId && booking.payment.refundStatus !== 'failed') {
      refund = await razorpay.refunds.fetch(booking.payment.refundId);
    } else {
      refund = await razorpay.payments.refund(booking.payment.paymentId, {
        amount: Math.round(booking.payment.amount * 100),
        notes: { ticketBookingId: booking._id.toString(), bookingNumber: booking.bookingNumber },
      });
      booking.payment.refundId = refund.id;
    }
    booking.payment.refundStatus = ['processed', 'failed', 'pending'].includes(refund.status) ? refund.status : 'pending';
    if (refund.status === 'processed') {
      booking.paymentStatus = 'refunded';
      booking.cancellationStatus = 'refunded';
    } else if (refund.status === 'failed') {
      booking.paymentStatus = 'paid';
      booking.cancellationStatus = 'refund_pending';
    }
    await booking.save();
    if (refund.status === 'processed') {
      await createNotification({
        recipient: booking.customer,
        title: 'Ticket refund processed',
        message: `A refund was processed for ticket booking ${booking.bookingNumber}.`,
        type: 'payment',
        link: '/customer/ticket-bookings',
      });
    }
    res.json({
      success: true,
      message: refund.status === 'processed'
        ? 'Refund processed.'
        : refund.status === 'failed'
          ? 'Razorpay could not process the refund. Review the gateway status before retrying.'
          : 'Refund submitted and is pending with Razorpay.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const razorpayEnabled = () =>
  Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !/dummy|placeholder/i.test(process.env.RAZORPAY_KEY_ID)
  );

const createRazorpayClient = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const makeBookingNumber = () =>
  `TB-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const ticketDetailsForType = (type, details = {}) => {
  const values = details || {};
  const allowedFields = {
    bus: ['operator', 'boardingPoint', 'droppingPoint', 'busType'],
    train: ['trainNumber', 'trainName', 'boardingStation', 'quota', 'berthPreference'],
    flight: ['tripType', 'airline', 'cabinClass', 'originCode', 'destinationCode'],
  }[type];
  return Object.fromEntries(
    allowedFields.map((field) => [field, String(values[field] || '').trim().slice(0, 120)])
  );
};

export const createTicketBooking = async (req, res, next) => {
  try {
    const {
      transportType,
      bookingType = 'general',
      adultCount = 1,
      childCount = 0,
      childrenAges = [],
      groupDetails = {},
      tourismDetails = {},
      source,
      destination,
      travelAt,
      returnAt,
      travelDetails,
      passengers,
      passengerContact,
      fareClass,
      seatPreference,
    } = req.body;

    if (!FARES[transportType]) {
      return res.status(400).json({ success: false, message: 'Choose bus, train, or flight.' });
    }
    const sourceText = String(source || '').trim();
    const destinationText = String(destination || '').trim();
    if (!sourceText || !destinationText || sourceText.toLowerCase() === destinationText.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Enter different source and destination locations.' });
    }
    const departure = new Date(travelAt);
    if (!travelAt || Number.isNaN(departure.getTime()) || departure <= new Date()) {
      return res.status(400).json({ success: false, message: 'Travel date and time must be in the future.' });
    }
    if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 9) {
      return res.status(400).json({ success: false, message: 'Add between 1 and 9 passengers.' });
    }
    if (!passengers.every((passenger) => passenger && typeof passenger === 'object' &&
      String(passenger.name || '').trim() &&
      String(passenger.age).trim() !== '' &&
      Number.isInteger(Number(passenger.age)) &&
      Number(passenger.age) >= 0 &&
      Number(passenger.age) <= 120 &&
      ['female', 'male', 'other'].includes(passenger.gender)
    )) {
      return res.status(400).json({ success: false, message: 'Check each passenger name, age, and gender.' });
    }
    const contactEmail = String(passengerContact?.email || req.user.email).trim().toLowerCase();
    const contactPhone = String(passengerContact?.phone || req.user.phone || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(contactEmail) || contactPhone.length < 7 || contactPhone.length > 20) {
      return res.status(400).json({ success: false, message: 'Enter a valid contact email and phone number.' });
    }
    const farePerPassenger = FARES[transportType][fareClass];
    if (!farePerPassenger) {
      return res.status(400).json({ success: false, message: 'The selected fare class is not available.' });
    }
    if (transportType === 'bus' && (!travelDetails?.boardingPoint || !travelDetails?.droppingPoint)) {
      return res.status(400).json({ success: false, message: 'Bus boarding and drop-off points are required.' });
    }
    if (transportType === 'train' && !travelDetails?.boardingStation) {
      return res.status(400).json({ success: false, message: 'A train boarding station is required.' });
    }
    if (transportType === 'flight' && !['one_way', 'round_trip'].includes(travelDetails?.tripType)) {
      return res.status(400).json({ success: false, message: 'Choose a valid flight trip type.' });
    }
    const tripMultiplier = transportType === 'flight' && travelDetails.tripType === 'round_trip' ? 2 : 1;

    let returnDate = null;
    if (returnAt) {
      returnDate = new Date(returnAt);
      if (Number.isNaN(returnDate.getTime()) || returnDate <= departure) {
        return res.status(400).json({ success: false, message: 'Return travel must be after departure.' });
      }
    }
    if (transportType === 'flight' && travelDetails?.tripType === 'round_trip' && !returnDate) {
      return res.status(400).json({ success: false, message: 'Select a return date for a round trip.' });
    }

    const booking = await TicketBooking.create({
      bookingNumber: makeBookingNumber(),
      customer: req.user._id,
      customerSnapshot: { name: req.user.name, email: req.user.email, phone: req.user.phone || '' },
      transportType,
      bookingType,
      adultCount: Number(adultCount) || 1,
      childCount: Number(childCount) || 0,
      childrenAges: Array.isArray(childrenAges) ? childrenAges.map(Number) : [],
      groupDetails: groupDetails || {},
      tourismDetails: tourismDetails || {},
      source: sourceText,
      destination: destinationText,
      travelAt: departure,
      returnAt: returnDate,
      travelDetails: ticketDetailsForType(transportType, travelDetails),
      passengers: passengers.map(({ name, age, gender }) => ({
        name: String(name).trim(),
        age: Number(age),
        gender,
      })),
      passengerContact: { email: contactEmail, phone: contactPhone },
      fareClass,
      seatPreference: String(seatPreference || '').trim().slice(0, 80),
      totalAmount: farePerPassenger * passengers.length * tripMultiplier,
    });

    await notifyAdmins({
      title: 'New ticket booking request',
      message: `${req.user.name} requested a ${transportType} booking ${booking.bookingNumber} for ${booking.source} to ${booking.destination}.`,
      type: 'booking',
      link: '/admin/ticket-bookings',
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket booking request sent. The admin will confirm availability before payment.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTicketBookings = async (req, res, next) => {
  try {
    const bookings = await TicketBooking.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const cancelTicketBooking = async (req, res, next) => {
  try {
    const booking = await TicketBooking.findOne({ _id: req.params.id, customer: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Ticket booking not found.' });
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'This ticket booking can no longer be cancelled.' });
    }
    if (!isTicketCancellationAllowed(booking.travelAt)) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation is not permitted within 2 days (48 hours) of departure.',
      });
    }

    booking.status = 'cancelled';
    booking.cancellationStatus = booking.paymentStatus === 'paid' ? 'refund_pending' : 'requested';
    booking.cancellationReason = String(req.body.reason || 'Customer requested cancellation').trim().slice(0, 500);
    await booking.save();

    await notifyAdmins({
      title: 'Ticket cancellation requested',
      message: `${booking.bookingNumber} was cancelled by the customer. ${booking.paymentStatus === 'paid' ? 'A refund requires admin processing.' : ''}`,
      type: 'booking',
      link: '/admin/ticket-bookings',
    });
    res.json({ success: true, message: 'Ticket cancellation request recorded.', data: booking });
  } catch (error) {
    next(error);
  }
};

export const getAllTicketBookings = async (req, res, next) => {
  try {
    const { status, transportType, search } = req.query;
    const query = {};
    if (['pending', 'confirmed', 'rejected', 'cancelled'].includes(status)) query.status = status;
    if (['bus', 'train', 'flight'].includes(transportType)) query.transportType = transportType;
    if (search) {
      const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { bookingNumber: regex },
        { source: regex },
        { destination: regex },
        { 'customerSnapshot.name': regex },
        { 'customerSnapshot.email': regex },
      ];
    }
    const bookings = await TicketBooking.find(query).sort({ createdAt: -1 }).populate('customer', 'name email phone');
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const updateTicketBooking = async (req, res, next) => {
  try {
    const booking = await TicketBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Ticket booking not found.' });
    const { status, totalAmount, ticketNumber, seatAssignments, adminNotes, cancellationStatus } = req.body;

    if (status !== undefined) {
      if (!['pending', 'confirmed', 'rejected', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid ticket booking status.' });
      }
      if (['cancelled', 'rejected'].includes(booking.status) && status !== booking.status) {
        return res.status(400).json({ success: false, message: 'A cancelled or rejected ticket booking cannot be reopened.' });
      }
      if (booking.paymentStatus === 'paid' && status === 'rejected') {
        return res.status(400).json({ success: false, message: 'Paid bookings must be cancelled and refunded, not rejected.' });
      }
      if (booking.paymentStatus === 'paid' && status === 'cancelled' &&
        booking.cancellationStatus !== 'refund_pending' && cancellationStatus !== 'refund_pending') {
        return res.status(400).json({ success: false, message: 'Set the cancellation status to refund pending before cancelling a paid booking.' });
      }
      booking.status = status;
    }
    if (totalAmount !== undefined) {
      const amount = Number(totalAmount);
      if (!Number.isFinite(amount) || amount <= 0 || (booking.paymentStatus === 'paid' && amount !== booking.totalAmount)) {
        return res.status(400).json({ success: false, message: 'Set a valid positive fare before payment.' });
      }
      booking.totalAmount = Math.round(amount * 100) / 100;
    }
    if (ticketNumber !== undefined) booking.ticketNumber = String(ticketNumber).trim().slice(0, 100);
    if (seatAssignments !== undefined) {
      if (!Array.isArray(seatAssignments) || seatAssignments.length > booking.passengers.length) {
        return res.status(400).json({ success: false, message: 'Seat assignments must match the passenger count.' });
      }
      booking.seatAssignments = seatAssignments.map((seat) => String(seat).trim().slice(0, 30));
    }
    if (adminNotes !== undefined) booking.adminNotes = String(adminNotes).trim().slice(0, 1000);
    if (cancellationStatus !== undefined) {
      if (!['not_requested', 'requested', 'approved', 'rejected', 'refund_pending', 'refunded'].includes(cancellationStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid cancellation status.' });
      }
      if (cancellationStatus === 'refunded' &&
        (booking.paymentStatus !== 'refunded' || !booking.payment.refundId || booking.payment.refundStatus !== 'processed')) {
        return res.status(400).json({ success: false, message: 'Refunded status can only follow a processed gateway refund.' });
      }
      booking.cancellationStatus = cancellationStatus;
    }
    await booking.save();
    if (Object.keys(req.body).length > 0) {
      await createNotification({
        recipient: booking.customer,
        title: 'Ticket booking updated',
        message: `Your ticket booking ${booking.bookingNumber} is now ${booking.status}.`,
        type: 'booking',
        link: '/customer/ticket-bookings',
      });
    }
    res.json({ success: true, message: 'Ticket booking updated.', data: booking });
  } catch (error) {
    next(error);
  }
};

export const createTicketPaymentOrder = async (req, res, next) => {
  try {
    if (!razorpayEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Online ticket payments are not configured. Please contact the administrator.',
      });
    }
    const booking = await TicketBooking.findOne({ _id: req.params.id, customer: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Ticket booking not found.' });
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Payment is available after the admin confirms availability.' });
    }
    if (booking.paymentStatus === 'paid' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking is not eligible for payment.' });
    }

    const order = await createRazorpayClient().orders.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: booking.currency,
      receipt: booking.bookingNumber,
      notes: { ticketBookingId: booking._id.toString(), bookingNumber: booking.bookingNumber },
    });
    booking.payment.orderId = order.id;
    await booking.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTicketPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const booking = await TicketBooking.findOne({ _id: req.params.id, customer: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Ticket booking not found.' });
    if (!razorpayEnabled()) {
      return res.status(503).json({ success: false, message: 'Online ticket payments are not configured.' });
    }
    if (!orderId || !paymentId || !signature || orderId !== booking.payment.orderId) {
      return res.status(400).json({ success: false, message: 'Payment does not match the active booking order.' });
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest();
    let supplied;
    try {
      supplied = Buffer.from(signature, 'hex');
    } catch {
      supplied = Buffer.alloc(0);
    }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }
    if (booking.paymentStatus === 'paid' && booking.payment.paymentId === paymentId) {
      return res.json({ success: true, message: 'Ticket payment was already verified.', data: booking });
    }
    const razorpay = createRazorpayClient();
    let gatewayPayment = await razorpay.payments.fetch(paymentId);
    if (
      gatewayPayment.order_id !== orderId ||
      gatewayPayment.amount !== Math.round(booking.totalAmount * 100) ||
      gatewayPayment.currency !== booking.currency
    ) {
      return res.status(400).json({ success: false, message: 'Gateway payment details do not match this booking.' });
    }
    if (gatewayPayment.status === 'authorized') {
      gatewayPayment = await razorpay.payments.capture(paymentId, gatewayPayment.amount, gatewayPayment.currency);
    }
    if (gatewayPayment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Gateway payment has not been captured.' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({ success: false, message: 'This ticket booking has already been paid.' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed tickets can be paid.' });
    }

    booking.paymentStatus = 'paid';
    if (!['upi', 'card', 'netbanking', 'wallet', 'emi', 'paylater'].includes(gatewayPayment.method)) {
      return res.status(400).json({ success: false, message: 'Gateway returned an unsupported payment method.' });
    }
    booking.payment.method = gatewayPayment.method;
    booking.payment.paymentId = paymentId;
    booking.payment.amount = booking.totalAmount;
    booking.payment.paidAt = new Date();
    await booking.save();
    await createNotification({
      recipient: booking.customer,
      title: 'Ticket payment received',
      message: `Payment received for ticket booking ${booking.bookingNumber}.`,
      type: 'payment',
      link: '/customer/ticket-bookings',
    });
    await notifyAdmins({
      title: 'Ticket payment received',
      message: `Payment received for ${booking.bookingNumber} by ${booking.customerSnapshot.name}.`,
      type: 'payment',
      link: '/admin/ticket-bookings',
    });

    res.json({ success: true, message: 'Ticket payment verified.', data: booking });
  } catch (error) {
    next(error);
  }
};
