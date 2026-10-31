import express from 'express';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getTestimonials);
router.post('/', authenticate, authorize(ROLES.ADMIN), createTestimonial);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateTestimonial);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteTestimonial);

export default router;
