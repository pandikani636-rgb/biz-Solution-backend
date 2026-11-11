import express from 'express';
import {
  createTicketBooking,
  getMyTicketBookings,
  cancelTicketBooking,
  getAllTicketBookings,
  updateTicketBooking,
  createTicketPaymentOrder,
  verifyTicketPayment,
  refundTicketPayment,
} from '../controllers/ticketBookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/', authenticate, createTicketBooking);
router.get('/my', authenticate, getMyTicketBookings);
router.patch('/:id/cancel', authenticate, cancelTicketBooking);
router.post('/:id/payment/order', authenticate, createTicketPaymentOrder);
router.post('/:id/payment/verify', authenticate, verifyTicketPayment);
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAllTicketBookings);
router.patch('/admin/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateTicketBooking);
router.post('/admin/:id/refund', authenticate, authorize(ROLES.ADMIN), refundTicketPayment);

export default router;
