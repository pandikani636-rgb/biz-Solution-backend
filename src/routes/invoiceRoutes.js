import express from 'express';
import { getInvoiceByBookingId } from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/booking/:bookingId', authenticate, getInvoiceByBookingId);

export default router;
