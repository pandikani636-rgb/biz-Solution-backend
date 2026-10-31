import express from 'express';
import {
  uploadUserImage,
  getAdminUserUploads,
  updateUserUploadStatus,
  deleteUserUpload,
} from '../controllers/userImageUploadController.js';
import { upload } from '../middleware/upload.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public user image upload (authenticated or guest with details)
router.post('/user-image', optionalAuthenticate, upload.single('image'), uploadUserImage);

// Admin tracking endpoints
router.get('/admin', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), getAdminUserUploads);
router.patch('/admin/:id', authenticate, authorize(ROLES.ADMIN), updateUserUploadStatus);
router.delete('/admin/:id', authenticate, authorize(ROLES.ADMIN), deleteUserUpload);

export default router;
