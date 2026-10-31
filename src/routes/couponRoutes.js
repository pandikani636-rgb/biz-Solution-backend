import express from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/validate', authenticate, validateCoupon);
router.get('/', authenticate, authorize(ROLES.ADMIN), getCoupons);
router.post('/', authenticate, authorize(ROLES.ADMIN), createCoupon);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateCoupon);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteCoupon);

export default router;
