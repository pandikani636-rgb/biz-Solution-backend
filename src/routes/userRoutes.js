import express from 'express';
import {
  getAllCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
  updateCustomerRate,
} from '../controllers/userAdminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerDetails);
router.patch('/customers/:id/toggle-status', toggleCustomerStatus);
router.patch('/customers/:id/rate', updateCustomerRate);

export default router;
