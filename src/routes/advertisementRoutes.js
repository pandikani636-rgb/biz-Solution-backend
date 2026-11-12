import express from 'express';
import {
  getActiveAdvertisement,
  getAllAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleAdvertisement,
} from '../controllers/advertisementController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public: Get currently active advertisement for popup
router.get('/active', getActiveAdvertisement);

// Admin routes
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAllAdvertisements);
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), createAdvertisement);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), updateAdvertisement);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), deleteAdvertisement);
router.patch('/:id/toggle', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), toggleAdvertisement);

export default router;
