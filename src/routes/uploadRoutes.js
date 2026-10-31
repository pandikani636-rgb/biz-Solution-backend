import express from 'express';
import { uploadSingleImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/image', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), upload.single('image'), uploadSingleImage);
router.post('/images', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), upload.array('images', 5), uploadMultipleImages);

export default router;
