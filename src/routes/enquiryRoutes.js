import express from 'express';
import {
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  approveQuotation,
  rejectQuotation,
  getMyCustomerQuotations,
  deleteEnquiry,
  adminCreateQuotation,
  updateQuotation,
  generateInvoiceFromQuotation,
  sendQuotationEmail,
  getQuotationStats,
} from '../controllers/enquiryController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/', optionalAuthenticate, submitEnquiry);
router.get('/my-quotations', authenticate, getMyCustomerQuotations);
router.get('/stats', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getQuotationStats);
router.post('/admin-create', authenticate, authorize(ROLES.ADMIN), adminCreateQuotation);
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getEnquiries);
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateEnquiryStatus);
router.patch('/:id/approve', authenticate, authorize(ROLES.ADMIN), approveQuotation);
router.patch('/:id/reject', authenticate, authorize(ROLES.ADMIN), rejectQuotation);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateQuotation);
router.patch('/:id', authenticate, authorize(ROLES.ADMIN), updateQuotation);
router.post('/:id/generate-invoice', authenticate, authorize(ROLES.ADMIN), generateInvoiceFromQuotation);
router.post('/:id/send-email', authenticate, authorize(ROLES.ADMIN), sendQuotationEmail);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteEnquiry);

export default router;
