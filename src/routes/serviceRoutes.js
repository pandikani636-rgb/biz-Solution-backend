import express from 'express';
import {
  getServices,
  getBrands,
  getServiceBySlugOrId,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getServices);
router.get('/brands', getBrands);
router.get('/:identifier', getServiceBySlugOrId);
router.post('/', authenticate, authorize(ROLES.ADMIN), createService);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateService);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteService);

export default router;
