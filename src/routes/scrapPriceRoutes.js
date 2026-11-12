import express from 'express';
import {
  getScrapPrices,
  getAllScrapPricesAdmin,
  createScrapPrice,
  updateScrapPrice,
  deleteScrapPrice,
  resetDefaultScrapPrices,
} from '../controllers/scrapPriceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public route for homepage
router.get('/', getScrapPrices);

// Admin routes
router.get('/admin/all', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAllScrapPricesAdmin);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createScrapPrice);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateScrapPrice);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deleteScrapPrice);
router.post('/admin/reset-defaults', authenticate, authorize(ROLES.ADMIN), resetDefaultScrapPrices);

export default router;
