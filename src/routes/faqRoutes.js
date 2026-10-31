import express from 'express';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../controllers/faqController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getFAQs);
router.post('/', authenticate, authorize(ROLES.ADMIN), createFAQ);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateFAQ);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteFAQ);

export default router;
