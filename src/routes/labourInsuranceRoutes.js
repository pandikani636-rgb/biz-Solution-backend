import express from 'express';
import {
  createLabourInsuranceInquiry,
  getLabourInsuranceInquiries,
  getLabourInsuranceById,
  updateLabourInsuranceStatus,
  deleteLabourInsuranceInquiry,
} from '../controllers/labourInsuranceController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public / Authenticated user: Submit labour insurance inquiry
router.post('/', optionalAuthenticate, createLabourInsuranceInquiry);

// Admin routes
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getLabourInsuranceInquiries);
router.get('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getLabourInsuranceById);
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateLabourInsuranceStatus);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deleteLabourInsuranceInquiry);

export default router;
