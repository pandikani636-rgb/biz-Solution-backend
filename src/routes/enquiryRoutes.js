import express from 'express';
import {
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  approveQuotation,
  rejectQuotation,
  getMyCustomerQuotations,
  deleteEnquiry,
} from '../controllers/enquiryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/', submitEnquiry);
router.get('/my-quotations', authenticate, getMyCustomerQuotations);
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getEnquiries);
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateEnquiryStatus);
router.patch('/:id/approve', authenticate, authorize(ROLES.ADMIN), approveQuotation);
router.patch('/:id/reject', authenticate, authorize(ROLES.ADMIN), rejectQuotation);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteEnquiry);

export default router;
