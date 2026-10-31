import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', authenticate, authorize(ROLES.ADMIN), updateSettings);

export default router;
