import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  processRefund,
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Customer
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/my', authenticate, getMyPayments);

// Admin
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN), getAllPayments);
router.post('/admin/refund', authenticate, authorize(ROLES.ADMIN), processRefund);

export default router;
