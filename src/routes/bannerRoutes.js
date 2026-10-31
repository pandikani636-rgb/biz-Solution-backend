import express from 'express';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/active', getActiveBanners);
router.get('/', authenticate, authorize(ROLES.ADMIN), getAllBanners);
router.post('/', authenticate, authorize(ROLES.ADMIN), createBanner);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateBanner);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteBanner);

export default router;
