import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Customer protected routes
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/cancel', authenticate, cancelBooking);

// Admin protected routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAllBookings);
router.patch('/admin/:id/status', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateBookingStatus);

export default router;
