import express from 'express';
import {
  getPackagesByService,
  createPackage,
  updatePackage,
  deletePackage,
} from '../controllers/packageController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/service/:serviceId', getPackagesByService);
router.post('/', authenticate, authorize(ROLES.ADMIN), createPackage);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updatePackage);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deletePackage);

export default router;
